import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('[TRPC] Using RORK API URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  console.warn('[TRPC] EXPO_PUBLIC_RORK_API_BASE_URL not set, trying alternative methods...');
  
  if (typeof window !== 'undefined') {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    console.log('[TRPC] Using window location as base URL:', baseUrl);
    return baseUrl;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL or run in a web environment"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const { data: { session } } = await supabase.auth.getSession();
        return {
          authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        };
      },
      fetch(url, options) {
        console.log('[TRPC FETCH] URL:', url);
        console.log('[TRPC FETCH] Method:', options?.method);
        return fetch(url, options).then(async (response) => {
          console.log('[TRPC RESPONSE] Status:', response.status);
          console.log('[TRPC RESPONSE] Headers:', JSON.stringify([...response.headers.entries()]));
          
          if (!response.ok) {
            const text = await response.clone().text();
            console.error('[TRPC RESPONSE] Error body:', text.substring(0, 500));
          }
          
          return response;
        }).catch((error) => {
          console.error('[TRPC FETCH ERROR]:', error);
          throw error;
        });
      },
    }),
  ],
});
