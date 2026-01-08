import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

export type SupabaseStorageUploadParams = {
  bucket: string;
  path: string;
  fileUri: string;
  contentType: string;
  upsert?: boolean;
  onProgress?: (progress01: number) => void;
};

const encodeStoragePath = (path: string) =>
  path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export async function uploadUriToSupabaseStorage(params: SupabaseStorageUploadParams): Promise<void> {
  const { bucket, path, fileUri, contentType, upsert = false, onProgress } = params;

  if (Platform.OS === 'web') {
    throw new Error('uploadUriToSupabaseStorage is native-only');
  }

  const encodedPath = encodeStoragePath(path);
  const url = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${encodedPath}`;

  console.log('[SUPABASE_UPLOAD] url:', url);
  console.log('[SUPABASE_UPLOAD] bucket:', bucket, 'path:', path);
  console.log('[SUPABASE_UPLOAD] fileUri:', fileUri);
  console.log('[SUPABASE_UPLOAD] contentType:', contentType, 'upsert:', upsert);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
    'Content-Type': contentType,
  };

  if (upsert) {
    headers['x-upsert'] = 'true';
  }

  onProgress?.(0);

  const result = await FileSystem.uploadAsync(url, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers,
  });

  onProgress?.(1);

  console.log('[SUPABASE_UPLOAD] result:', {
    status: result?.status,
    bodySnippet: typeof result?.body === 'string' ? result.body.slice(0, 250) : String(result?.body),
  });

  if (!result || (result.status < 200 || result.status >= 300)) {
    throw new Error(`Storage upload failed (${result?.status ?? 'no-status'}): ${result?.body ?? ''}`);
  }
}
