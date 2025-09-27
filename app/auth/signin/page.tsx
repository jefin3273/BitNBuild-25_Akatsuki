// app/auth/signin/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/lib/auth-utils";
import { useAuth } from "@/hooks/useAuth";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { profile } = useAuth();

    // Redirect if already signed in
    React.useEffect(() => {
        if (profile) {
            if (profile.role === "client") {
                router.push("/client-dashboard");
            } else if (profile.role === "freelancer") {
                router.push("/freelancer-dashboard");
            }
        }
    }, [profile, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { data, error } = await signIn(email, password);

        if (error) {
            setError(error.message || "Failed to sign in");
            setLoading(false);
            return;
        }

        // The useAuth hook will handle the redirect based on user role
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                        Welcome back! Please sign in to your account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                        <div className="text-sm text-center space-y-2">
                            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                                Forgot your password?
                            </Link>
                            <p>
                                Don't have an account?{" "}
                                <Link href="/auth/signup" className="text-blue-600 hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}