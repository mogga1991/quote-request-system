import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QuoteRequestsList } from "./_components/quote-requests-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function QuoteRequestsPage() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Quote Requests
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track your requests for quotes from suppliers.
          </p>
        </div>
        <Link href="/dashboard/quote-requests/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline hidden">Create Quote Request</span>
            <span className="sm:hidden inline">Create Request</span>
          </Button>
        </Link>
      </div>

      {/* Quote Requests List */}
      <QuoteRequestsList userId={result.session.userId} />
    </div>
  );
}