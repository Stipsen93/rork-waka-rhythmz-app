import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const sanitizeUrl = (value: string) => value.replace(/\/$/, "");

const ensureProtocol = (raw: string) => {
  const trimmed = raw.trim();
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  const host = trimmed.replace(/^[^/]+:\/\//, "").split("/")[0].split(":")[0] ?? "";
  const useHttps = shouldUseHttps(trimmed, host, trimmed.split(":")[1]);
  return `${useHttps ? "https" : "http"}://${trimmed}`;
};

const maybeUpgradeToHttps = (rawBaseUrl: string) => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return rawBaseUrl;
  }

  const pageProtocol = window.location.protocol;
  if (pageProtocol !== "https:") {
    return rawBaseUrl;
  }

  try {
    const parsed = new URL(rawBaseUrl);
    if (parsed.protocol === "http:") {
      const upgraded = `https://${parsed.host}${parsed.pathname}`;
      console.warn("[TRPC] Upgrading base URL to HTTPS to avoid mixed content:", upgraded);
      return upgraded;
    }
  } catch {
    console.warn("[TRPC] Unable to parse base URL for HTTPS upgrade:", rawBaseUrl);
  }

  return rawBaseUrl;
};

const normalizeBaseUrl = (rawBaseUrl: string) => {
  const sanitized = sanitizeUrl(rawBaseUrl.trim());
  if (!sanitized) {
    return sanitized;
  }

  if (sanitized.endsWith("/api")) {
    return sanitized.slice(0, -4);
  }

  return sanitized;
};

export const buildTrpcUrl = (rawBaseUrl: string) => {
  const normalized = normalizeBaseUrl(rawBaseUrl);
  if (!normalized) {
    return "";
  }
  return `${normalized}/api/trpc`;
};

const maskSecret = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length <= 12) {
    return `${trimmed.slice(0, 3)}…${trimmed.slice(-2)}`;
  }
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
};

const logEnvPresence = () => {
  const apiBase = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log("[ENV] EXPO_PUBLIC_RORK_API_BASE_URL:", apiBase ? maskSecret(apiBase) : "<missing>");

  const supaUrl = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_URL;
  const supaAnon = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_ANON_KEY;

  console.log("[ENV] EXPO_PUBLIC_SUPABASE_URL:", supaUrl ? sanitizeUrl(supaUrl) : "<missing>");
  console.log("[ENV] EXPO_PUBLIC_SUPABASE_ANON_KEY:", supaAnon ? maskSecret(supaAnon) : "<missing>");

  const nextPublicSupaUrl = (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SUPABASE_URL;
  const nextPublicSupaAnon = (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("[ENV] NEXT_PUBLIC_SUPABASE_URL:", nextPublicSupaUrl ? sanitizeUrl(nextPublicSupaUrl) : "<missing>");
  console.log("[ENV] NEXT_PUBLIC_SUPABASE_ANON_KEY:", nextPublicSupaAnon ? maskSecret(nextPublicSupaAnon) : "<missing>");

  const supabaseUrl = (process.env as Record<string, string | undefined>).SUPABASE_URL;
  const supabaseService = (process.env as Record<string, string | undefined>).SUPABASE_SERVICE_ROLE_KEY;

  console.log("[ENV] SUPABASE_URL:", supabaseUrl ? sanitizeUrl(supabaseUrl) : "<missing>");
  console.log("[ENV] SUPABASE_SERVICE_ROLE_KEY:", supabaseService ? maskSecret(supabaseService) : "<missing>");
};

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

export const getBaseUrl = () => {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  logEnvPresence();

  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const raw = ensureProtocol(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    cachedBaseUrl = maybeUpgradeToHttps(normalizeBaseUrl(raw));
    console.log("[TRPC] Using RORK API URL:", cachedBaseUrl);
    console.log("[TRPC] Full tRPC URL:", buildTrpcUrl(cachedBaseUrl));
    return cachedBaseUrl;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    cachedBaseUrl = normalizeBaseUrl(`${window.location.protocol}//${window.location.host}`);
    console.log("[TRPC] Using window location as base URL:", cachedBaseUrl);
    console.log("[TRPC] Full tRPC URL:", buildTrpcUrl(cachedBaseUrl));
    return cachedBaseUrl;
  }

  const devServerUrl = deriveDevServerUrl();
  if (devServerUrl) {
    cachedBaseUrl = maybeUpgradeToHttps(normalizeBaseUrl(devServerUrl));
    console.log("[TRPC] Using dev server host as base URL:", cachedBaseUrl);
    console.log("[TRPC] Full tRPC URL:", buildTrpcUrl(cachedBaseUrl));
    return cachedBaseUrl;
  }

  console.warn("[TRPC] Unable to determine API base URL. Using fallback.");
  cachedBaseUrl = maybeUpgradeToHttps(normalizeBaseUrl("http://localhost:8081"));
  return cachedBaseUrl;
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: buildTrpcUrl(getBaseUrl()),
      transformer: superjson,
      maxURLLength: 2083,
      async headers() {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          return {
            authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
          };
        } catch (err) {
          console.error("[TRPC HEADERS] Failed to read Supabase session:", err);
          return { authorization: "" };
        }
      },
      fetch(url, options) {
        const baseUrl = getBaseUrl();
        const intendedTrpcUrl = buildTrpcUrl(baseUrl);
        const finalUrl = typeof url === "string" ? url : String(url);

        console.log("[TRPC FETCH] Base URL:", baseUrl);
        console.log("[TRPC FETCH] Intended tRPC URL:", intendedTrpcUrl);
        console.log("[TRPC FETCH] Final URL:", finalUrl);
        console.log("[TRPC FETCH] Method:", options?.method);

        const modifiedOptions: RequestInit = {
          ...options,
          ...(Platform.OS === "web" ? { mode: "cors" as const } : null),
        };

        const attemptFetch = async (retryCount = 0): Promise<Response> => {
          try {
            const response = await fetch(finalUrl, modifiedOptions);
            console.log("[TRPC RESPONSE] Status:", response.status);

            if (!response.ok) {
              const text = await response.clone().text();
              console.error("[TRPC RESPONSE] Error body:", text.substring(0, 500));

              if (text.includes("<!DOCTYPE html>") || text.includes("<html>")) {
                console.error(
                  "[TRPC] Received HTML instead of JSON. Backend may not be running or base URL is incorrect.",
                );
              }
            }

            return response;
          } catch (error: any) {
            const message = String(error?.message ?? error);
            console.error(`[TRPC FETCH ERROR] Attempt ${retryCount + 1}:`, message);

            if (retryCount < 2) {
              const delayMs = (retryCount + 1) * 1000;
              console.log(`[TRPC] Retrying in ${delayMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              return attemptFetch(retryCount + 1);
            }

            console.error("[TRPC] All retry attempts failed. Backend might not be running.");
            console.error("[TRPC] Debug info:", {
              platform: Platform.OS,
              baseUrl,
              intendedTrpcUrl,
              finalUrl,
            });
            throw error;
          }
        };

        return attemptFetch();
      },
    }),
  ],
});
