import { 
  Brain, 
  Clock, 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  Search, 
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms analyze RFQ requirements, identify key compliance factors, and suggest optimal strategies.",
    benefits: ["90% faster requirement analysis", "Automated compliance checking", "Smart risk assessment"],
    color: "bg-blue-500"
  },
  {
    icon: Search,
    title: "Intelligent Supplier Matching", 
    description: "Automatically match opportunities with qualified suppliers based on capabilities, past performance, and certifications.",
    benefits: ["15,000+ verified suppliers", "Real-time capability matching", "Performance-based scoring"],
    color: "bg-green-500"
  },
  {
    icon: FileText,
    title: "Automated Quote Generation",
    description: "Generate professional, compliant quotes with pricing optimization and requirement mapping.",
    benefits: ["Template-based generation", "Pricing intelligence", "Compliance validation"],
    color: "bg-purple-500"
  },
  {
    icon: BarChart3,
    title: "Market Intelligence",
    description: "Real-time market data, pricing trends, and competitive analysis to optimize your bidding strategy.",
    benefits: ["Historical pricing data", "Competitor analysis", "Win probability scoring"],
    color: "bg-orange-500"
  },
  {
    icon: Clock,
    title: "Process Automation",
    description: "Streamline your entire procurement workflow from opportunity discovery to contract award.",
    benefits: ["80% time reduction", "Workflow automation", "Status tracking"],
    color: "bg-red-500"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "FedRAMP authorized platform with end-to-end encryption and comprehensive audit trails.",
    benefits: ["FedRAMP compliance", "SOC 2 certification", "End-to-end encryption"],
    color: "bg-indigo-500"
  }
];

const integrations = [
  { name: "SAM.gov", description: "Direct integration with federal opportunities" },
  { name: "GSA eLibrary", description: "Access to GSA schedule pricing" },
  { name: "FPDS-NG", description: "Federal procurement data system" },
  { name: "Beta.SAM.gov", description: "Entity registration validation" }
];

export function Features() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Enterprise Platform
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Everything you need to win government contracts
          </p>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 dark:text-gray-300 px-4 sm:px-0">
            Our comprehensive platform combines AI intelligence with industry expertise to give you a competitive edge in government contracting.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mx-auto mt-12 sm:mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-900">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                    <div className={`rounded-lg ${feature.color} p-2.5 sm:p-3 text-white w-fit`}>
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="sm:ml-4 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="mt-4 sm:mt-6 space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform Integration Section */}
        <div className="mx-auto mt-24 max-w-7xl">
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Seamless Government System Integration
            </h3>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Direct connections to all major government procurement systems
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map((integration) => (
              <div key={integration.name} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {integration.name}
                </h4>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-24 max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-16 text-center shadow-2xl">
            <div className="relative">
              <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform your contracting process?
              </h3>
              <p className="mt-4 text-lg text-blue-100">
                Join thousands of contractors who have streamlined their government bidding process
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" variant="secondary" className="group">
                  <Link href="/sign-up">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Link href="/contact">
                    Schedule Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}