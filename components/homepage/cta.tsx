import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Shield, Users, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Clock,
    title: "Start in Minutes",
    description: "Get up and running with our platform in under 10 minutes"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "FedRAMP authorized and SOC 2 compliant from day one"
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "Dedicated success team with government contracting expertise"
  }
];

const contactMethods = [
  {
    icon: Phone,
    title: "Sales Team",
    description: "Speak with our experts",
    contact: "(555) 123-4567",
    action: "Call Now"
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Get answers to your questions",
    contact: "sales@govbidai.com",
    action: "Send Email"
  },
  {
    icon: MapPin,
    title: "Schedule Demo",
    description: "See the platform in action",
    contact: "30-minute demo",
    action: "Book Now"
  }
];

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-gray-900 py-24 sm:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"></div>
      <div className="absolute inset-0 bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main CTA Section */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Ready to win more 
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> government contracts?</span>
          </h2>
          <p className="mt-6 text-xl leading-8 text-gray-300">
            Join thousands of contractors who have streamlined their procurement process and increased their win rates with our AI-powered platform.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              <Link href="/sign-up">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg">
              <Link href="#demo">
                Schedule Live Demo
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-sm text-gray-400">
            ✓ No credit card required • ✓ Cancel anytime • ✓ 30-day money-back guarantee
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <benefit.icon className="mx-auto h-12 w-12 text-blue-400" />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-gray-300">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Methods */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white">
              Prefer to talk to someone?
            </h3>
            <p className="mt-4 text-lg text-gray-300">
              Our team of government contracting experts is here to help
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {contactMethods.map((method) => (
              <Card key={method.title} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <method.icon className="mx-auto h-10 w-10 text-blue-400 mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {method.title}
                  </h4>
                  <p className="text-gray-300 mb-3">
                    {method.description}
                  </p>
                  <p className="text-blue-400 font-medium mb-4">
                    {method.contact}
                  </p>
                  <Button variant="outline" size="sm" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final Push */}
        <div className="mx-auto mt-20 max-w-3xl text-center">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Don't let another opportunity slip away
            </h3>
            <p className="text-blue-100 mb-6">
              Every day you wait is potential revenue lost. Start winning more contracts today.
            </p>
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/sign-up">
                Get Started Now - It's Free
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom Contact Info */}
        <div className="mt-20 border-t border-gray-700 pt-12 text-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">Sales Inquiries</h4>
              <p>sales@govbidai.com</p>
              <p>(555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Customer Support</h4>
              <p>support@govbidai.com</p>
              <p>24/7 Support Available</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Partnership</h4>
              <p>partners@govbidai.com</p>
              <p>Channel Partner Program</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}