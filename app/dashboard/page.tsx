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
    <div className="space-y-6">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Government Opportunities
          </h1>
          <p className="text-muted-foreground">
            Discover and analyze federal contracting opportunities from SAM.gov.
          </p>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">
            Opportunities
          </h1>
          <p className="text-sm text-muted-foreground">
            Find government contracts
          </p>
        </div>
      </div>

      {/* Opportunities List */}
      <OpportunitiesList />
    </div>
  );
}
