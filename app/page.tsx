import FooterSection from "@/components/homepage/footer";
import HeroSection from "@/components/homepage/hero-section";
import { Features } from "@/components/homepage/features";
import { Stats } from "@/components/homepage/stats";
import { Testimonials } from "@/components/homepage/testimonials";
import { CTA } from "@/components/homepage/cta";
import { getSubscriptionDetails } from "@/lib/subscription";
import PricingTable from "./pricing/_component/pricing-table";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <>
      <HeroSection />
      <Stats />
      <Features />
      <Testimonials />
      <PricingTable subscriptionDetails={subscriptionDetails} />
      <CTA />
      <FooterSection />
    </>
  );
}
