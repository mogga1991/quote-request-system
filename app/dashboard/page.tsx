import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OpportunitiesList } from "./_components/opportunities-list";

export default async function Dashboard() {
  const result = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full">
        <div className="flex flex-col items-start justify-center gap-2 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Government Opportunities
          </h1>
          <p className="text-muted-foreground">
            Discover and analyze federal contracting opportunities from SAM.gov.
          </p>
        </div>
        <OpportunitiesList />
      </div>
    </section>
  );
}
