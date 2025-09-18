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
    <div className="relative">
      {/* Desktop Header */}
      <div className="hidden lg:block mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Quote Requests
            </h1>
            <p className="text-base text-muted-foreground">
              Manage and track your requests for quotes from suppliers.
            </p>
          </div>
          <Link href="/dashboard/quote-requests/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">
            Quote Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your quote requests
          </p>
        </div>
      </div>

      {/* Quote Requests List */}
      <QuoteRequestsList userId={result.session.userId} />

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Link href="/dashboard/quote-requests/create">
          <Button size="lg" className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Create Quote Request</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}