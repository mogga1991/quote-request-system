'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, Clock, DollarSign } from 'lucide-react';

export function QuoteRequestsDemo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [opportunityText, setOpportunityText] = useState(
    `The U.S. Department of Education seeks a contractor to provide comprehensive IT support services for our regional offices. This includes help desk support, network maintenance, software updates, and cybersecurity monitoring. The contract period is 12 months with potential for renewal. Estimated value: $250,000. Requirements include 24/7 support availability, certified technicians, and compliance with federal security standards.`
  );
  const [generatedQuote, setGeneratedQuote] = useState<any>(null);

  const handleGenerate = async () => {
    if (!useAI) {
      // Manual mode - just show a basic template
      setGeneratedQuote({
        title: 'Manual Quote Request',
        description: 'Basic quote request template',
        requirements: [
          { category: 'General', items: ['Define requirements manually'] }
        ],
        suggestedDeadline: 30,
        estimatedBudget: { min: 0, max: 0 }
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-quote-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunity: {
            title: 'IT Support Services Contract',
            description: opportunityText,
            department: 'Department of Education',
            estimatedValue: '$250,000'
          },
          options: {
            includeCompliance: true,
            includePricing: true,
            detailLevel: 'comprehensive'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quote request');
      }

      const result = await response.json();
      setGeneratedQuote(result);
    } catch (error) {
      console.error('Error generating quote request:', error);
      // Fallback to demo data
      setGeneratedQuote({
        title: 'Request for Quotation (RFQ) - Enterprise IT Support Services',
        description: 'Comprehensive IT support services for federal agency including help desk, network maintenance, and cybersecurity monitoring with 24/7 availability and federal compliance requirements.',
        requirements: [
          {
            category: 'Technical Requirements',
            items: [
              '24/7 help desk support with <2 hour response time',
              'Network monitoring and maintenance services',
              'Software update and patch management',
              'Cybersecurity monitoring and incident response'
            ]
          },
          {
            category: 'Compliance Requirements', 
            items: [
              'Federal security clearance for all technicians',
              'FISMA compliance documentation',
              'SOC 2 Type II certification',
              'Regular security assessments and reporting'
            ]
          },
          {
            category: 'Staffing Requirements',
            items: [
              'Certified IT professionals (CompTIA, Cisco, Microsoft)',
              'Minimum 5 years federal contracting experience',
              'On-site presence during business hours',
              'Escalation procedures for critical incidents'
            ]
          }
        ],
        suggestedDeadline: 45,
        estimatedBudget: {
          min: 200000,
          max: 300000,
          confidence: 'medium'
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Government Opportunity
          </CardTitle>
          <CardDescription>
            Enter a government contract opportunity description to generate a professional quote request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="opportunity">Opportunity Description</Label>
            <Textarea
              id="opportunity"
              value={opportunityText}
              onChange={(e) => setOpportunityText(e.target.value)}
              rows={6}
              className="mt-1"
              placeholder="Paste government contract description here..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="ai-mode"
                checked={useAI}
                onCheckedChange={setUseAI}
              />
              <Label htmlFor="ai-mode" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate with Claude AI
              </Label>
            </div>
            
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !opportunityText.trim()}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Quote Request
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {generatedQuote && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Quote Request
              {useAI && <Badge variant="secondary" className="ml-2">Claude AI Generated</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{generatedQuote.title}</h3>
              <p className="text-gray-600">{generatedQuote.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Requirements</h4>
              <div className="space-y-4">
                {generatedQuote.requirements.map((req: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm text-blue-900 mb-2">{req.category}</h5>
                    <ul className="space-y-1">
                      {req.items.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Suggested Deadline:</strong> {generatedQuote.suggestedDeadline} days
                </span>
              </div>
              
              {generatedQuote.estimatedBudget && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Budget Range:</strong> ${(generatedQuote.estimatedBudget.min || 0).toLocaleString()} - ${(generatedQuote.estimatedBudget.max || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}