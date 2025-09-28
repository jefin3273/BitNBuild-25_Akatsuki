"use client";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import ProfilePage from "./ProfilePage";

const CheckingPageFroProfile = () => {
  const { user, profile } = useAuth();
  return (
    <div>
      {profile && profile.id ? (
        <ProfilePage id={profile.id as unknown as string} />
      ) : (
        ""
      )}
    </div>
  );
};

export default CheckingPageFroProfile;
