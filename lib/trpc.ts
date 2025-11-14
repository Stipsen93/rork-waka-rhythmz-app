import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log('[TRPC] Base URL:', baseUrl);
  
  if (!baseUrl) {
    throw new Error(
      "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
    );
  }
  
  return baseUrl;
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
