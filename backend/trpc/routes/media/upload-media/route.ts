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
  .mutation(async ({ input, ctx }) => {
    console.log('[Media] Uploading media:', input.name);
    
    const authHeader = ctx.req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Niet geautoriseerd. Log opnieuw in.');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = supabase;

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('[Media] Auth error:', authError);
      throw new Error('Authenticatie mislukt. Log opnieuw in.');
    }

    console.log('[Media] Authenticated user:', user.id);
    
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
      
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, binaryData, {
          contentType: input.mimeType,
          upsert: false,
        });
      
      if (uploadError) {
        console.error('[Media] Error uploading to storage:', uploadError);
        throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
      }
      
      const insertData: Database['public']['Tables']['media_library']['Insert'] = {
        name: input.name,
        path: storagePath,
        folder_path: input.folderPath,
        file_type: input.fileType,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        storage_path: storagePath,
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
        
        throw new Error(`Failed to save file metadata: ${dbError.message}`);
      }
      
      if (!mediaData) {
        throw new Error('Failed to create media record');
      }
      
      const typedMediaData = mediaData as Database['public']['Tables']['media_library']['Row'];
      
      console.log('[Media] Successfully uploaded media:', typedMediaData.id);
      
      return typedMediaData;
    } catch (error) {
      console.error('[Media] Upload error:', error);
      throw error;
    }
  });
