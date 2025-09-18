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
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <OpportunityAnalysis opportunityId={params.id} />
    </section>
  );
}