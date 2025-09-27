"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show sign in message if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Please sign in to view this page.</p>
            <Button 
              onClick={() => router.push("/auth/signin")} 
              className="mt-4"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        
        {/* User Authentication Info */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Details</CardTitle>
            <CardDescription>
              Information from Supabase Auth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Email Verified:</strong> {user.email_confirmed_at ? "Yes" : "No"}
            </div>
            <div>
              <strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}
            </div>
          </CardContent>
        </Card>

        {/* User Profile Info */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Information from your user profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Profile ID:</strong> {profile.id}
              </div>
              <div>
                <strong>Name:</strong> {profile.name}
              </div>
              <div>
                <strong>Email:</strong> {profile.email}
              </div>
              <div className="flex items-center space-x-2">
                <strong>Role:</strong>
                <Badge variant={profile.role === "client" ? "default" : "secondary"}>
                  {profile.role}
                </Badge>
              </div>
              {profile.university_id && (
                <div>
                  <strong>University ID:</strong> {profile.university_id}
                </div>
              )}
              {profile.role === "client" && (
                <div>
                  <strong>Verified Student:</strong> {profile.is_verified_student ? "Yes" : "No"}
                </div>
              )}
              <div>
                <strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-specific content */}
        {profile?.role === "client" && (
          <Card>
            <CardHeader>
              <CardTitle>Client Dashboard</CardTitle>
              <CardDescription>
                Actions available to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={() => router.push("/client-dashboard")} className="w-full">
                  Go to Client Dashboard
                </Button>
                <Button variant="outline" className="w-full">
                  Post a New Project
                </Button>
                <Button variant="outline" className="w-full">
                  Browse Freelancers
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.role === "freelancer" && (
          <Card>
            <CardHeader>
              <CardTitle>Freelancer Dashboard</CardTitle>
              <CardDescription>
                Actions available to freelancers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={() => router.push("/freelancer-dashboard")} className="w-full">
                  Go to Freelancer Dashboard
                </Button>
                <Button variant="outline" className="w-full">
                  Browse Projects
                </Button>
                <Button variant="outline" className="w-full">
                  Update Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}