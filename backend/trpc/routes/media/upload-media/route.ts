import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

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
    console.log('[Media] Uploading media:', input.name);
    
    const timestamp = Date.now();
    const sanitizedName = input.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = input.folderPath 
      ? `${input.folderPath}/${timestamp}_${sanitizedName}`
      : `${timestamp}_${sanitizedName}`;
    
    const base64Data = input.base64Data.includes(',') 
      ? input.base64Data.split(',')[1] 
      : input.base64Data;
    
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const { error: uploadError } = await supabase.storage
      .from('media-library')
      .upload(storagePath, binaryData, {
        contentType: input.mimeType,
        upsert: false,
      });
    
    if (uploadError) {
      console.error('[Media] Error uploading to storage:', uploadError);
      throw new Error('Failed to upload file to storage');
    }
    
    const { data: mediaData, error: dbError } = await supabase
      .from('media_library')
      .insert({
        name: input.name,
        path: storagePath,
        folder_path: input.folderPath,
        file_type: input.fileType,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        storage_path: storagePath,
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('[Media] Error saving to database:', dbError);
      
      await supabase.storage
        .from('media-library')
        .remove([storagePath]);
      
      throw new Error('Failed to save file metadata');
    }
    
    console.log('[Media] Successfully uploaded media:', mediaData.id);
    
    return mediaData;
  });
