"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Mail, 
  MapPin, 
  Phone,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users
} from "lucide-react";
import Link from "next/link";

interface SupplierMatch {
  supplier: {
    id: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    gsaSchedule: boolean;
    rating: number;
    certifications?: string[];
    capabilities?: string[];
  };
  matchScore: number;
  estimatedPrice?: number;
  deliveryTime?: number;
  reasoning: string[];
}

interface PricingEstimate {
  category: string;
  estimatedPrice: number;
  confidence: "Low" | "Medium" | "High";
  priceRange: {
    min: number;
    max: number;
  };
}

interface ComplianceItem {
  requirement: string;
  required: boolean;
  notes: string;
}

interface ComplianceCategory {
  category: string;
  items: ComplianceItem[];
}

interface Risk {
  category: string;
  level: "Low" | "Medium" | "High";
  description: string;
  impact: string;
  mitigation: string;
}

interface RiskAssessment {
  overallRisk: "Low" | "Medium" | "High";
  risks: Risk[];
  summary: string;
}

interface Recommendation {
  category: string;
  priority: "Low" | "Medium" | "High";
  recommendation: string;
  details: string;
  actionItems: string[];
}

interface Opportunity {
  noticeId: string;
  title: string;
  department: string;
  office?: string;
  postedDate: string;
  responseDeadline: string;
  naicsCode?: string;
  setAsideCode?: string;
  description?: string;
  solicitationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  place?: string;
  estimatedValue?: number;
  contractType?: string;
  link?: string;
}

interface AnalysisData {
  opportunityId: string;
  opportunity: Opportunity;
  matchedSuppliers: SupplierMatch[];
  estimatedPricing: PricingEstimate[];
  complianceChecklist: ComplianceCategory[];
  riskAssessment: RiskAssessment;
  recommendations: Recommendation[];
  analysisDate: string;
  source: string;
}

interface OpportunityAnalysisProps {
  opportunityId: string;
}

export function OpportunityAnalysis({ opportunityId }: OpportunityAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/opportunities/${opportunityId}/suppliers`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAnalysis(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching analysis:", error);
        setError("Failed to load opportunity analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [opportunityId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High": return "text-red-600 bg-red-50 border-red-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-600";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || "No analysis data available"}</p>
              <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { opportunity } = analysis;
  const daysUntilDeadline = getDaysUntilDeadline(opportunity.responseDeadline);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {opportunity.title}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {opportunity.department}
              {opportunity.office && ` • ${opportunity.office}`}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due: {formatDate(opportunity.responseDeadline)}
            </div>
            <Badge className={daysUntilDeadline > 7 ? "bg-green-100 text-green-800" : 
                            daysUntilDeadline > 3 ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800"}>
              <Clock className="h-3 w-3 mr-1" />
              {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : "Expired"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Value</p>
                <p className="text-2xl font-bold">
                  {opportunity.estimatedValue ? formatCurrency(opportunity.estimatedValue) : "Not specified"}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matched Suppliers</p>
                <p className="text-2xl font-bold">{analysis.matchedSuppliers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                <p className={`text-2xl font-bold ${getRiskColor(analysis.riskAssessment.overallRisk).split(' ')[0]}`}>
                  {analysis.riskAssessment.overallRisk}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Set-Aside</p>
                <p className="text-2xl font-bold">
                  {opportunity.setAsideCode || "Open"}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunity.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Solicitation:</span><br />
                    <span className="text-muted-foreground">{opportunity.solicitationNumber || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-medium">NAICS Code:</span><br />
                    <span className="text-muted-foreground">{opportunity.naicsCode || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-medium">Contract Type:</span><br />
                    <span className="text-muted-foreground">{opportunity.contractType || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-medium">Place:</span><br />
                    <span className="text-muted-foreground">{opportunity.place || "Not specified"}</span>
                  </div>
                </div>

                {(opportunity.contactEmail || opportunity.contactPhone) && (
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      {opportunity.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${opportunity.contactEmail}`} className="text-blue-600 hover:underline">
                            {opportunity.contactEmail}
                          </a>
                        </div>
                      )}
                      {opportunity.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${opportunity.contactPhone}`} className="text-blue-600 hover:underline">
                            {opportunity.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {opportunity.link && (
                  <div>
                    <a 
                      href={opportunity.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      View on SAM.gov
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg border-2 ${getRiskColor(analysis.riskAssessment.overallRisk)} mb-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Overall Risk: {analysis.riskAssessment.overallRisk}</span>
                  </div>
                  <p className="text-sm">{analysis.riskAssessment.summary}</p>
                </div>

                <div className="space-y-3">
                  {analysis.riskAssessment.risks.map((risk, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{risk.category}</span>
                        <Badge className={getRiskColor(risk.level)}>{risk.level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                      <div className="text-xs">
                        <span className="font-medium">Impact:</span> {risk.impact}<br />
                        <span className="font-medium">Mitigation:</span> {risk.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Matched Suppliers ({analysis.matchedSuppliers.length})</CardTitle>
              <CardDescription>
                Suppliers ranked by compatibility with opportunity requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.matchedSuppliers.map((match, index) => (
                  <div key={match.supplier.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{match.supplier.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {match.supplier.gsaSchedule && (
                            <Badge variant="outline">GSA Schedule</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {match.supplier.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{match.matchScore}%</div>
                        <div className="text-sm text-muted-foreground">Match Score</div>
                      </div>
                    </div>

                    <Progress value={match.matchScore} className="mb-3" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      {match.estimatedPrice && (
                        <div>
                          <span className="text-sm font-medium">Estimated Price:</span>
                          <div className="text-lg font-semibold">{formatCurrency(match.estimatedPrice)}</div>
                        </div>
                      )}
                      
                      {match.deliveryTime && (
                        <div>
                          <span className="text-sm font-medium">Delivery Time:</span>
                          <div className="text-lg font-semibold">{match.deliveryTime} days</div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium">Contact:</span>
                        <div className="space-y-1">
                          {match.supplier.contactEmail && (
                            <div className="text-sm">
                              <a href={`mailto:${match.supplier.contactEmail}`} className="text-blue-600 hover:underline">
                                {match.supplier.contactEmail}
                              </a>
                            </div>
                          )}
                          {match.supplier.contactPhone && (
                            <div className="text-sm">
                              <a href={`tel:${match.supplier.contactPhone}`} className="text-blue-600 hover:underline">
                                {match.supplier.contactPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Match Reasons:</span>
                      <div className="flex flex-wrap gap-2">
                        {match.reasoning.map((reason, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {match.supplier.certifications && match.supplier.certifications.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium">Certifications:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {match.supplier.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button size="sm">Request Quote</Button>
                      {match.supplier.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={match.supplier.website} target="_blank" rel="noopener noreferrer">
                            Visit Website
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Estimates</CardTitle>
              <CardDescription>
                AI-generated pricing analysis based on historical data and market trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.estimatedPricing.map((estimate, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{estimate.category}</h3>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(estimate.estimatedPrice)}
                        </div>
                      </div>
                      
                      <Badge className={
                        estimate.confidence === "High" ? "bg-green-100 text-green-800" :
                        estimate.confidence === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {estimate.confidence} Confidence
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Range:</span> {formatCurrency(estimate.priceRange.min)} - {formatCurrency(estimate.priceRange.max)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="space-y-6">
            {analysis.complianceChecklist.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          item.required ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"
                        }`}>
                          {item.required ? (
                            <div className="h-2 w-2 rounded-full bg-red-600" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.requirement}</span>
                            <Badge variant={item.required ? "destructive" : "secondary"} className="text-xs">
                              {item.required ? "Required" : "Optional"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {analysis.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rec.category}</CardTitle>
                    <Badge className={`${getPriorityColor(rec.priority)} border-current`} variant="outline">
                      {rec.priority} Priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Recommendation</h4>
                      <p className="text-sm">{rec.recommendation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Details</h4>
                      <p className="text-sm text-muted-foreground">{rec.details}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Action Items</h4>
                      <ul className="space-y-1">
                        {rec.actionItems.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}