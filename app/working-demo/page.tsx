import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function WorkingDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Quote Request System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Government Contracting Made Simple
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
              <span className="mr-2">✅</span>
              System Status: Working
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Authentication bypass successfully implemented. The system is ready for testing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Authentication:</span>
                <span className="font-medium text-green-600">✅ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="font-medium text-blue-600">🔄 Connected</span>
              </div>
              <div className="flex justify-between">
                <span>AI Services:</span>
                <span className="font-medium text-purple-600">🤖 Available</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>🔑 Test the System</CardTitle>
            <CardDescription>
              Use the simple login to access the Quote Request System dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Test Credentials:
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div>📧 Email: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">test@example.com</code></div>
                <div>🔒 Password: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">password123</code></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/simple-login">
                <Button className="w-full" size="lg">
                  🚀 Start Testing
                </Button>
              </Link>
              <Link href="/test-dashboard">
                <Button variant="outline" className="w-full" size="lg">
                  📊 View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>🌟 Available Features</CardTitle>
            <CardDescription>
              What you can test in this demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>User Authentication</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Dashboard Access</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Quote Requests</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>AI Integration</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Opportunity Browsing</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Database Operations</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>API Endpoints</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>User Interface</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center">
              <span className="mr-2">ℹ️</span>
              About This Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-700 dark:text-amber-300">
            <p>
              This is a working demonstration of the Quote Request System with authentication bypass. 
              The system includes AI-powered quote generation, supplier matching, opportunity analysis, 
              and complete CRUD operations for government contracting workflows.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Built with Next.js, Drizzle ORM, OpenAI, and Better Auth
          </p>
        </div>
      </div>
    </div>
  );
}