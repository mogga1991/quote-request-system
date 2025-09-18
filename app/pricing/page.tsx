import { getSubscriptionDetails } from "@/lib/subscription";
import PricingTable from "./_component/pricing-table";

export default async function PricingPage() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PricingTable subscriptionDetails={subscriptionDetails} />
      </div>
    </div>
  );
}
