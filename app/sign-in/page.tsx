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

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: returnTo || "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Sign in failed");
        return;
      }

      toast.success("Welcome back!");
      router.push(returnTo || "/dashboard");
    } catch (error) {
      console.error("Authentication error:", error);
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
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to access your contracting dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-4">
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link 
                href="/sign-up" 
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
            
            {/* Test Credentials Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Demo Credentials
              </h4>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1 font-mono">
                <div>Email: test@example.com</div>
                <div>Password: password123</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
          By signing in, you agree to our{" "}
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

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <div className="max-w-md w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg h-96"></div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
