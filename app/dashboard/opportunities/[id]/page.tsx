import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OpportunityAnalysis } from "./_components/opportunity-analysis";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function OpportunityPage({ params }: PageProps) {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <OpportunityAnalysis opportunityId={params.id} />
    </div>
  );
}