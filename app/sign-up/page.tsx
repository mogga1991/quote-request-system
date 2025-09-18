"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function SignUpContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: returnTo || "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Sign up failed");
        return;
      }

      toast.success("Account created successfully!");
      router.push(returnTo || "/dashboard");
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            GovBid AI
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Government Contracting Platform
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Join thousands of contractors winning government bids
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link 
                href="/sign-in" 
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms-of-service"
            className="underline hover:text-gray-700 dark:hover:text-gray-300"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="underline hover:text-gray-700 dark:hover:text-gray-300"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <div className="max-w-md w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg h-96"></div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
