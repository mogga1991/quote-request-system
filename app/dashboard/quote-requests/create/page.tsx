import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateQuoteRequestForm } from "../_components/create-quote-request-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateQuoteRequestPage() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full max-w-4xl mx-auto">
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/quote-requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quote Requests
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-start justify-center gap-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create Quote Request
          </h1>
          <p className="text-muted-foreground">
            Generate a professional request for quotes from your selected suppliers.
          </p>
        </div>

        <CreateQuoteRequestForm userId={result.session.userId} />
      </div>
    </section>
  );
}