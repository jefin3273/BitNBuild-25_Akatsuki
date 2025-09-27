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
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          university_id: userData.university_id,
          is_verified_student: userData.role === "client" ? false : null,
        });

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