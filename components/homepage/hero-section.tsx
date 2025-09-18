import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Shield, Users, Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
      
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-2xl text-center">
          {/* Trust Badge */}
          <Badge variant="secondary" className="mb-6 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Shield className="mr-2 h-3 w-3" />
            Enterprise-Grade Security
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Transform Government 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Contracting</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            AI-powered platform that automates RFQ analysis, supplier matching, and competitive bidding for federal opportunities. 
            Reduce procurement time by 80% and increase win rates by 45%.
          </p>

          {/* Key Benefits */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>10x Faster Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span>500+ Verified Suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>FedRAMP Compliant</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="group">
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="group">
              <Link href="#demo">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            Trusted by 200+ government agencies and contractors
          </div>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-gray-900/10">
            <div className="bg-gray-800 px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="px-6 py-8">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0"
                alt="Dashboard Preview"
                width={1200}
                height={800}
                className="rounded-lg object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 hidden rounded-lg bg-white p-3 shadow-lg dark:bg-gray-800 lg:block">
            <div className="text-xs font-medium text-gray-900 dark:text-white">Live Opportunities</div>
            <div className="text-lg font-bold text-green-600">2,847</div>
          </div>
          
          <div className="absolute -top-4 -right-4 hidden rounded-lg bg-white p-3 shadow-lg dark:bg-gray-800 lg:block">
            <div className="text-xs font-medium text-gray-900 dark:text-white">Active Quotes</div>
            <div className="text-lg font-bold text-blue-600">156</div>
          </div>
        </div>
      </div>
    </section>
  );
}
