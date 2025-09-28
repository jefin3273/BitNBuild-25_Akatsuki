import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const supabase =
  browserClient ??
  (browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey));

// Helper function to get user profile with proper typing
export const getUserProfile = async (email: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  return { data, error };
};

// Helper function to create user profile
export const createUserProfile = async (profile: Database["public"]["Tables"]["users"]["Insert"]) => {
    const { data, error } = await (supabase as any)
        .from("users")
        .insert(profile)
        .select()
        .single();

  return { data, error };
};

// Helper function to update user profile
export const updateUserProfile = async (
  email: string,
  updates: Database["public"]["Tables"]["users"]["Update"]
) => {
    const { data, error } = await (supabase as any)
        .from("users")
        .update(updates)
        .eq("email", email)
        .select()
        .single();

  return { data, error };
};
