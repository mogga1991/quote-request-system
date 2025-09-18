import {
  Shadcnui,
  TailwindCSS,
  BetterAuth,
  Polar,
  NeonPostgres,
  Nextjs,
} from "@/components/logos";
import { Card } from "@/components/ui/card";
import * as React from "react";

export default function Integrations() {
  return (
    <section>
      <div className="pt-12 pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <div>
            <h2 className="text-balance text-3xl font-semibold md:text-4xl">
              Powerful Features for Government Contracting
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Streamline your federal contracting process with AI-powered analysis,
              real-time data, and intelligent supplier matching.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              title="SAM.gov Integration"
              description="Real-time access to federal contract opportunities with automated monitoring and filtering by NAICS codes and agencies."
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">🏛️</div>
            </IntegrationCard>

            <IntegrationCard
              title="AI-Powered Analysis"
              description="Intelligent document parsing and requirement extraction using advanced AI models to analyze RFQ/RFP documents."
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">🤖</div>
            </IntegrationCard>

            <IntegrationCard
              title="Supplier Matching"
              description="Comprehensive supplier database with smart matching algorithms based on capabilities, certifications, and past performance."
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">🤝</div>
            </IntegrationCard>

            <IntegrationCard
              title="Pricing Intelligence"
              description="Historical contract pricing data and market analysis to provide competitive pricing recommendations and estimates."
            >
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">💰</div>
            </IntegrationCard>

            <IntegrationCard
              title="Compliance Tracking"
              description="Automated compliance checking for federal requirements including set-asides, certifications, and regulations."
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">✅</div>
            </IntegrationCard>

            <IntegrationCard
              title="Risk Assessment"
              description="Comprehensive risk analysis including timeline, competition, financial, and compliance risk factors with mitigation strategies."
            >
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">⚠️</div>
            </IntegrationCard>
          </div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  title,
  description,
  children,
  link,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  link?: string;
}) => {
  const CardContent = () => (
    <div className="relative">
      <div className="*:size-10">{children}</div>

      <div className="mt-6 space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-transform hover:scale-105"
      >
        <Card className="p-6 h-full cursor-pointer hover:shadow-lg transition-shadow rounded-md">
          <CardContent />
        </Card>
      </a>
    );
  }

  return (
    <Card className="p-6">
      <CardContent />
    </Card>
  );
};
