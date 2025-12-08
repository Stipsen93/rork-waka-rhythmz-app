import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const sanitizeUrl = (value: string) => value.replace(/\/$/, "");

const isLocalHost = (host: string) => {
  if (!host) {
    return false;
  }

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
};

const shouldUseHttps = (rawUri: string, host: string, port?: string) => {
  if (port === "443") {
    return true;
  }

  if (rawUri.startsWith("https")) {
    return true;
  }

  const secureHostHints = ["ngrok", "trycloudflare", "rork.app"] as const;
  if (secureHostHints.some((hint) => host.includes(hint))) {
    return true;
  }

  return !isLocalHost(host);
};

const deriveDevServerUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? null;
  if (!hostUri) {
    return null;
  }

  const normalized = hostUri
    .replace(/^(exp|http|https|ws|wss):\/\//, "")
    .split(/[/?]/)[0];

  if (!normalized) {
    return null;
  }

  const [host, port] = normalized.split(":");
  if (!host) {
    return null;
  }

  const useHttps = shouldUseHttps(hostUri, host, port);
  const protocol = useHttps ? "https" : "http";
  const resolvedPort = port ?? (useHttps ? "" : "8081");

  return `${protocol}://${host}${resolvedPort ? `:${resolvedPort}` : ""}`;
};

let cachedBaseUrl: string | null = null;

const getBaseUrl = () => {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    cachedBaseUrl = sanitizeUrl(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    console.log("[TRPC] Using RORK API URL:", cachedBaseUrl);
    return cachedBaseUrl;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    cachedBaseUrl = sanitizeUrl(`${window.location.protocol}//${window.location.host}`);
    console.log("[TRPC] Using window location as base URL:", cachedBaseUrl);
    return cachedBaseUrl;
  }

  const devServerUrl = deriveDevServerUrl();
  if (devServerUrl) {
    cachedBaseUrl = sanitizeUrl(devServerUrl);
    console.log("[TRPC] Using dev server host as base URL:", cachedBaseUrl);
    return cachedBaseUrl;
  }

  console.warn("[TRPC] Unable to determine API base URL. Using fallback.");
  cachedBaseUrl = "http://localhost:8081";
  return cachedBaseUrl;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const { data: { session } } = await supabase.auth.getSession();
        return {
          authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        };
      },
      fetch(url, options) {
        console.log("[TRPC FETCH] URL:", url);
        console.log("[TRPC FETCH] Method:", options?.method);
        return fetch(url, options)
          .then(async (response) => {
            console.log("[TRPC RESPONSE] Status:", response.status);
            console.log("[TRPC RESPONSE] Headers:", JSON.stringify([...response.headers.entries()]));

            if (!response.ok) {
              const text = await response.clone().text();
              console.error("[TRPC RESPONSE] Error body:", text.substring(0, 500));
              
              if (text.includes("<!DOCTYPE html>") || text.includes("<html>")) {
                console.error("[TRPC] Received HTML instead of JSON. Backend may not be running or URL is incorrect.");
              }
            }

            return response;
          })
          .catch((error) => {
            console.error("[TRPC FETCH ERROR]:", error);
            console.error("[TRPC] Backend might not be running. Make sure the server is started.");
            throw error;
          });
      },
    }),
  ],
});
