import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getQuoteRequestById } from "@/lib/services/quote-requests";
import { QuoteRequestDetail } from "../_components/quote-request-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface QuoteRequestPageProps {
  params: {
    id: string;
  };
}

export default async function QuoteRequestPage({ params }: QuoteRequestPageProps) {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  const quoteRequest = await getQuoteRequestById(params.id);

  if (!quoteRequest) {
    redirect("/dashboard/quote-requests");
  }

  // Check ownership
  if (quoteRequest.userId !== result.session.userId) {
    redirect("/dashboard/quote-requests");
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full max-w-6xl mx-auto">
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/quote-requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quote Requests
            </Button>
          </Link>
        </div>

        <QuoteRequestDetail 
          quoteRequest={quoteRequest} 
          userId={result.session.userId} 
        />
      </div>
    </section>
  );
}