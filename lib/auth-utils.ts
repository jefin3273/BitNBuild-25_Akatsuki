// lib/auth-utils.ts
import { supabase } from "./supabaseClient";
import { UserRole } from "@/hooks/useAuth";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  university_id?: number;
}

// Define the user profile interface to match your database schema
export interface UserProfile {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  university_id?: number | null;
  is_verified_student?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

// Type for inserting new user data
type UserInsert = {
  email: string;
  name: string;
  role: UserRole;
  university_id?: number | null;
  is_verified_student?: boolean | null;
};

export const signUp = async (userData: SignUpData) => {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      throw authError;
    }

    // Create user profile in database
    if (authData.user) {
      const profileData: UserInsert = {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        university_id: userData.university_id || null,
        is_verified_student: userData.role === "client" ? false : null,
      };

      // Use type assertion for now until proper types are set up
      const { error: profileError } = await (supabase as any)
        .from("users")
        .insert(profileData);

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        console.error("Error creating user profile:", profileError);
        throw new Error("Failed to create user profile");
      }
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error("Sign up error:", error);
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Sign in error:", error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error("Update password error:", error);
    return { error };
  }
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await (supabase as any)
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return { data: data as UserProfile, error: null };
  } catch (error) {
    console.error("Get user profile error:", error);
    return { data: null, error };
  }
};

// Helper function to update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const { data, error } = await (supabase as any)
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data: data as UserProfile, error: null };
  } catch (error) {
    console.error("Update user profile error:", error);
    return { data: null, error };
  }
};