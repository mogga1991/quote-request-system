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
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full">
        <div className="flex flex-col items-start justify-center gap-2 mb-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Quote Requests
              </h1>
              <p className="text-muted-foreground">
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
        <QuoteRequestsList userId={result.session.userId} />
      </div>
    </section>
  );
}