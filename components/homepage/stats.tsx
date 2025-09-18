"use client";

import { useEffect, useState } from "react";

const stats = [
  { 
    id: 1, 
    name: 'Contract Opportunities Processed', 
    value: '125,000+',
    description: 'Federal contracts analyzed and processed through our platform',
    suffix: ''
  },
  { 
    id: 2, 
    name: 'Average Time Savings', 
    value: '87',
    description: 'Reduction in procurement processing time',
    suffix: '%'
  },
  { 
    id: 3, 
    name: 'Verified Suppliers', 
    value: '15,000+',
    description: 'Pre-qualified government contractors in our network',
    suffix: ''
  },
  { 
    id: 4, 
    name: 'Success Rate Improvement', 
    value: '43',
    description: 'Average increase in bid win rates for our clients',
    suffix: '%'
  },
  { 
    id: 5, 
    name: 'Government Agencies', 
    value: '250+',
    description: 'Federal and state agencies using our platform',
    suffix: ''
  },
  { 
    id: 6, 
    name: 'Annual Contract Value', 
    value: '$2.8B',
    description: 'Total value of contracts processed annually',
    suffix: ''
  },
];

function AnimatedNumber({ value, suffix }: { value: string; suffix: string }) {
  const [displayValue, setDisplayValue] = useState('0');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`stat-${value}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (!isVisible) return;

    // Extract numeric value
    const numericValue = value.replace(/[^0-9.]/g, '');
    const finalValue = parseFloat(numericValue);

    if (isNaN(finalValue)) {
      setDisplayValue(value);
      return;
    }

    let startValue = 0;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (finalValue - startValue) * easeOutQuart;

      if (value.includes('$')) {
        setDisplayValue(`$${currentValue.toFixed(1)}B`);
      } else if (value.includes('+')) {
        setDisplayValue(`${Math.floor(currentValue).toLocaleString()}+`);
      } else {
        setDisplayValue(Math.floor(currentValue).toString());
      }

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setDisplayValue(value);
      }
    };

    animateValue();
  }, [isVisible, value]);

  return (
    <div id={`stat-${value}`} className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
      {displayValue}{suffix}
    </div>
  );
}

export function Stats() {
  return (
    <section className="bg-white dark:bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Trusted by government contractors nationwide
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Our platform has transformed how government contracting works, delivering measurable results across all sectors.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                <div className="mt-2 text-lg font-semibold leading-8 text-gray-900 dark:text-white">
                  {stat.name}
                </div>
                <div className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-8">
              Certified & Compliant
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FedRAMP Authorized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SOC 2 Type II</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-purple-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NIST Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-red-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FISMA Moderate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}