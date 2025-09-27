import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side Supabase client (SSR-safe, works with Clerk sessions + cookies)
 */
export function supabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value;
      },
    },
  });
}

/**
 * Browser-side Supabase client (for realtime chat, inserts, updates)
 */
export function supabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
