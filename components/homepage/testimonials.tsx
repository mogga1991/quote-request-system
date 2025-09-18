import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    content: "GovBid AI transformed our procurement process completely. We went from spending weeks on RFQ analysis to getting comprehensive insights in hours. Our win rate increased by 60% in the first quarter.",
    author: {
      name: "Sarah Chen",
      role: "Director of Government Contracts",
      company: "TechDefense Solutions",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      initials: "SC"
    },
    rating: 5,
    highlight: "60% win rate increase"
  },
  {
    content: "The AI-powered supplier matching is incredible. It connected us with qualified contractors we never would have found otherwise. The platform paid for itself with just one successful project.",
    author: {
      name: "Michael Rodriguez",
      role: "Procurement Manager", 
      company: "Federal Solutions Inc",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      initials: "MR"
    },
    rating: 5,
    highlight: "ROI in first project"
  },
  {
    content: "Before GovBid AI, our team was drowning in manual processes. Now we can focus on strategy while the platform handles the heavy lifting. It's like having a team of experts working 24/7.",
    author: {
      name: "Jennifer Thompson",
      role: "VP of Business Development",
      company: "Defense Dynamics Corp",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      initials: "JT"
    },
    rating: 5,
    highlight: "24/7 automation"
  },
  {
    content: "The compliance checking feature alone has saved us from costly mistakes. The platform ensures every bid meets requirements before submission. It's essential for any serious government contractor.",
    author: {
      name: "David Park",
      role: "Chief Operations Officer",
      company: "Infrastructure Partners LLC",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      initials: "DP"
    },
    rating: 5,
    highlight: "Zero compliance errors"
  },
  {
    content: "The market intelligence features give us a competitive edge we never had before. Understanding pricing trends and competitor strategies has been game-changing for our bid decisions.",
    author: {
      name: "Lisa Wang",
      role: "Business Development Director",
      company: "Advanced Systems Group",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
      initials: "LW"
    },
    rating: 5,
    highlight: "Competitive intelligence"
  },
  {
    content: "Customer support is exceptional. The team understands government contracting inside and out. They're not just tech support - they're strategic partners in our success.",
    author: {
      name: "Robert Johnson",
      role: "Government Contracts Manager",
      company: "Aerospace Solutions",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      initials: "RJ"
    },
    rating: 5,
    highlight: "Expert support team"
  }
];

const companyLogos = [
  { name: "Defense Dynamics", width: "w-32" },
  { name: "TechDefense Solutions", width: "w-28" },
  { name: "Federal Solutions", width: "w-36" },
  { name: "Infrastructure Partners", width: "w-40" },
  { name: "Advanced Systems", width: "w-32" },
  { name: "Aerospace Solutions", width: "w-36" }
];

export function Testimonials() {
  return (
    <section className="bg-white dark:bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Client Success
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Trusted by leading government contractors
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            See how our platform has transformed procurement processes for companies of all sizes
          </p>
        </div>

        {/* Company Logos */}
        <div className="mx-auto mt-16 max-w-4xl">
          <p className="text-center text-sm font-semibold leading-6 text-gray-500 dark:text-gray-400">
            Trusted by industry leaders
          </p>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companyLogos.map((logo) => (
              <div key={logo.name} className={`${logo.width} h-8 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center`}>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto mt-20 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-8">
                  {/* Quote Icon */}
                  <Quote className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                  
                  {/* Rating */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Testimonial Content */}
                  <blockquote className="text-gray-700 dark:text-gray-300 mb-6">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Highlight */}
                  <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Key Result: {testimonial.highlight}
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.author.image} alt={testimonial.author.name} />
                      <AvatarFallback>{testimonial.author.initials}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.author.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.author.role}
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {testimonial.author.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mx-auto mt-20 max-w-2xl text-center">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Join our community of successful contractors
          </h3>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Over 2,000 government contractors trust our platform to win more contracts
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <div className="flex items-center justify-center gap-1">
              <div className="flex -space-x-2">
                {testimonials.slice(0, 4).map((testimonial, index) => (
                  <Avatar key={index} className="h-8 w-8 border-2 border-white dark:border-gray-900">
                    <AvatarImage src={testimonial.author.image} alt={testimonial.author.name} />
                    <AvatarFallback>{testimonial.author.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">2,000+ happy customers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}