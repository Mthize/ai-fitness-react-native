import { getClerkInstance } from "@clerk/expo";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/backend/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
const supabasePublicKey = supabaseAnonKey || supabasePublishableKey;

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabasePublicKey.length > 0;

let hasWarnedMissingClerkSupabaseToken = false;

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createSupabaseClient()
  : null;

export async function requireSupabaseClient(options?: { requireAuth?: boolean }) {
  if (!supabase) {
    if (__DEV__) {
      console.warn("[supabase] Supabase client is unavailable", {
        isSupabaseConfigured,
        hasUrl: supabaseUrl.length > 0,
        hasAnonKey: supabaseAnonKey.length > 0,
        hasPublishableKey: supabasePublishableKey.length > 0,
      });
    }

    throw new Error(
      "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL plus EXPO_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY before using backend helpers.",
    );
  }

  if (options?.requireAuth) {
    const token = await getClerkSupabaseToken();

    if (!token) {
      if (__DEV__ && !hasWarnedMissingClerkSupabaseToken) {
        hasWarnedMissingClerkSupabaseToken = true;
        console.warn(
          "[supabase] Authenticated Supabase request skipped because there is no active Clerk session yet.",
        );
      }

      throw new Error(
        "No active Clerk session is available for this authenticated Supabase request.",
      );
    }

    return createSupabaseClient(async () => token);
  }

  return supabase;
}

async function getClerkSupabaseToken() {
  try {
    const clerk = getClerkInstance();
    const fallbackToken = (await clerk.session?.getToken()) ?? null;

    if (fallbackToken) {
      return fallbackToken;
    }
  } catch {
    // Clerk may not be ready yet during app bootstrap. Treat that as no session.
  }

  return null;
}

export function getSupabaseDebugState() {
  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: supabaseUrl.length > 0,
    hasAnonKey: supabaseAnonKey.length > 0,
    hasPublishableKey: supabasePublishableKey.length > 0,
  };
}

if (__DEV__) {
  const supabaseConfigWarnings: string[] = [];

  if (supabaseUrl.length === 0) {
    supabaseConfigWarnings.push("EXPO_PUBLIC_SUPABASE_URL is missing.");
  } else if (!isLikelySupabaseProjectUrl(supabaseUrl)) {
    supabaseConfigWarnings.push(
      "EXPO_PUBLIC_SUPABASE_URL should look like https://<project-ref>.supabase.co with no extra characters or quotes.",
    );
  }

  if (supabaseAnonKey.length === 0) {
    if (supabasePublishableKey.length === 0) {
      supabaseConfigWarnings.push(
        "EXPO_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.",
      );
    }
  } else if (looksLikeSecretOrDatabaseUrl(supabaseAnonKey)) {
    supabaseConfigWarnings.push(
      "EXPO_PUBLIC_SUPABASE_ANON_KEY looks like a secret or database connection string. Use the public anon key only.",
    );
  } else if (hasWrappingQuotes(supabaseAnonKey)) {
    supabaseConfigWarnings.push(
      "EXPO_PUBLIC_SUPABASE_ANON_KEY should not be wrapped in quotes.",
    );
  }

  if (supabasePublishableKey.length > 0) {
    if (looksLikeSecretOrDatabaseUrl(supabasePublishableKey)) {
      supabaseConfigWarnings.push(
        "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks like a secret or database connection string. Use the public publishable key only.",
      );
    } else if (hasWrappingQuotes(supabasePublishableKey)) {
      supabaseConfigWarnings.push(
        "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY should not be wrapped in quotes.",
      );
    }
  }

  if (supabaseConfigWarnings.length > 0) {
    console.warn("[supabase] Invalid Expo public env configuration detected.", {
      warnings: supabaseConfigWarnings,
    });
  }
}

function createSupabaseClient(accessToken?: () => Promise<string | null>) {
  return createClient<Database>(supabaseUrl, supabasePublicKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    accessToken,
    global: {
      headers: {
        "X-Client-Info": "ai-fitness-mobile",
      },
    },
  });
}

function isLikelySupabaseProjectUrl(value: string) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
}

function looksLikeSecretOrDatabaseUrl(value: string) {
  return (
    /^postgres(ql)?:\/\//i.test(value) ||
    /^sb_secret_/i.test(value) ||
    /service_role/i.test(value)
  );
}

function hasWrappingQuotes(value: string) {
  return (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  );
}

// Security notes:
// - Only public Supabase URL and anon key belong in the mobile app.
// - Never expose a service_role or any other backend secret in Expo public env vars.
// - Clerk remains the source of truth for auth until Supabase third-party auth is configured.
