// hooks/useOtherUsers.ts
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { getOtherUsers } from "@/lib/supabaseClient";

export const useOtherUsers = () => {
  const { profile, loading: authLoading } = useAuth();
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !profile) {
      setLoading(true);
      return;
    }

    const fetchOthers = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await getOtherUsers(profile.id as any); // exclude current user by ID

      if (error) {
        setError("Failed to load users");
        setOtherUsers([]);
      } else {
        setOtherUsers(data || []);
      }

      setLoading(false);
    };

    fetchOthers();
  }, [profile, authLoading]);

  return { otherUsers, loading, error };
};
