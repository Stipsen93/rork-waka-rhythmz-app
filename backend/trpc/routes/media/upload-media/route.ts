import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import type { Database } from "@/lib/database.types";

export const uploadMediaRoute = publicProcedure
  .input(z.object({
    name: z.string(),
    folderPath: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    base64Data: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Media] Uploading media:', input.name, 'to folder:', input.folderPath);
    console.log('[Media] File details - Type:', input.fileType, 'Size:', input.fileSize, 'bytes');
    
    try {
      const timestamp = Date.now();
      const sanitizedName = input.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = input.folderPath 
        ? `${input.folderPath}/${timestamp}_${sanitizedName}`
        : `${timestamp}_${sanitizedName}`;
      
      const base64Data = input.base64Data.includes(',') 
        ? input.base64Data.split(',')[1] 
        : input.base64Data;
      
      const binaryData = Buffer.from(base64Data, 'base64');
      
      console.log('[Media] Uploading to storage:', storagePath);
      
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, binaryData, {
          contentType: input.mimeType,
          upsert: false,
        });
      
      if (uploadError) {
        console.error('[Media] Error uploading to storage:', uploadError);
        throw new Error(`Opslag upload mislukt: ${uploadError.message}`);
      }
      
      console.log('[Media] Saving metadata to database');
      
      const insertData: Database['public']['Tables']['media_library']['Insert'] = {
        name: input.name,
        path: storagePath,
        folder_path: input.folderPath,
        file_type: input.fileType,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        storage_path: storagePath,
        uploaded_by: null,
      };
      
      const { data: mediaData, error: dbError } = await supabase
        .from('media_library')
        .insert(insertData as any)
        .select()
        .single();
      
      if (dbError) {
        console.error('[Media] Error saving to database:', dbError);
        
        await supabase.storage
          .from('media-library')
          .remove([storagePath]);
        
        throw new Error(`Database opslaan mislukt: ${dbError.message}`);
      }
      
      if (!mediaData) {
        throw new Error('Kon media record niet aanmaken');
      }
      
      const typedMediaData = mediaData as Database['public']['Tables']['media_library']['Row'];
      
      console.log('[Media] Successfully uploaded media:', typedMediaData.id);
      
      return typedMediaData;
    } catch (error) {
      console.error('[Media] Upload error:', error);
      if (error instanceof Error) {
        throw new Error(`Upload mislukt: ${error.message}`);
      }
      throw new Error('Upload mislukt: Onbekende fout');
    }
  });
