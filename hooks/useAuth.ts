// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = "client" | "freelancer";

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    university_id?: number;
    is_verified_student?: boolean;
    created_at: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                await fetchUserProfile(user.email!);
            }
            setLoading(false);
        };

        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user || null);

                if (session?.user) {
                    await fetchUserProfile(session.user.email!);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (email: string) => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("email", email)
                .single();

            if (error) {
                console.error("Error fetching user profile:", error);
                return;
            }

            setProfile(data);
        } catch (error) {
            console.error("Error in fetchUserProfile:", error);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user || !profile) return;

        try {
            const { data, error } = await supabase
                .from("users")
                .update(updates)
                .eq("email", user.email!)
                .select()
                .single();

            if (error) {
                console.error("Error updating profile:", error);
                return;
            }

            setProfile(data);
        } catch (error) {
            console.error("Error in updateProfile:", error);
        }
    };

    return {
        user,
        profile,
        loading,
        updateProfile,
        fetchUserProfile,
    };
};