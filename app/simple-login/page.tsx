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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SimpleLogin() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/simple-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: 'signin'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Welcome back!");
        router.push("/test-dashboard");
      } else {
        toast.error(result.error || "Sign in failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Simple Login (Test Version)
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Temporary login system for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          {/* Test Credentials Info */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Test Credentials:
            </h4>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <div>Email: test@example.com</div>
              <div>Password: password123</div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm">
            <Link href="/sign-in" className="underline">
              Try regular login instead
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}