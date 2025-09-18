import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  extractRequirements,
  classifyOpportunity,
  analyzeBidDecision,
  generateCompetitiveIntelligence,
  extractKeyDates,
  type RequirementExtraction,
  type OpportunityClassification,
  type BidDecisionAnalysis
} from '@/lib/services/opportunity-analysis';
import { getOpportunityById } from '@/lib/services/sam-gov';
import { z } from 'zod';

// Validation schemas
const baseAnalysisSchema = z.object({
  opportunityId: z.string().min(1).optional(),
  opportunityText: z.string().min(50).optional(),
  context: z.object({
    naicsCode: z.string().optional(),
    setAsideCode: z.string().optional(),
    contractType: z.string().optional(),
    estimatedValue: z.string().optional(),
    department: z.string().optional(),
    deadline: z.string().optional()
  }).optional()
});

const bidAnalysisSchema = baseAnalysisSchema.extend({
  companyProfile: z.object({
    capabilities: z.array(z.string()),
    pastPerformance: z.array(z.string()),
    teamSize: z.number().positive(),
    certifications: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string())
  })
});

const competitiveAnalysisSchema = baseAnalysisSchema.extend({
  knownCompetitors: z.array(z.string()).optional().default([])
});

// POST /api/ai/analyze-opportunity - Comprehensive opportunity analysis
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'comprehensive';

    // Get opportunity text
    let opportunityText: string;
    let context: any = {};

    if (body.opportunityId) {
      const opportunity = await getOpportunityById(body.opportunityId);
      if (!opportunity) {
        return NextResponse.json({
          error: 'Opportunity not found'
        }, { status: 404 });
      }
      
      opportunityText = `${opportunity.title}\n\n${opportunity.description}`;
      context = {
        naicsCode: opportunity.naicsCode,
        setAsideCode: opportunity.setAsideCode,
        contractType: opportunity.contractType,
        estimatedValue: opportunity.estimatedValue,
        department: opportunity.department
      };
    } else if (body.opportunityText) {
      opportunityText = body.opportunityText;
      context = body.context || {};
    } else {
      return NextResponse.json({
        error: 'Either opportunityId or opportunityText is required'
      }, { status: 400 });
    }

    switch (analysisType) {
      case 'requirements':
        return await handleRequirementExtraction(opportunityText, context);
      
      case 'classification':
        return await handleClassification(opportunityText, context);
      
      case 'bid-decision':
        return await handleBidDecision(opportunityText, body, context);
      
      case 'competitive':
        return await handleCompetitiveAnalysis(opportunityText, body);
      
      case 'dates':
        return await handleDateExtraction(opportunityText);
      
      case 'comprehensive':
      default:
        return await handleComprehensiveAnalysis(opportunityText, context);
    }

  } catch (error) {
    console.error('Error in opportunity analysis:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to analyze opportunity'
    }, { status: 500 });
  }
}

async function handleRequirementExtraction(opportunityText: string, context: any) {
  const requirements = await extractRequirements(opportunityText, context);
  
  return NextResponse.json({
    success: true,
    data: {
      requirements,
      metadata: {
        analysisType: 'requirements',
        analyzedAt: new Date().toISOString(),
        inputLength: opportunityText.length
      }
    }
  });
}

async function handleClassification(opportunityText: string, context: any) {
  const classification = await classifyOpportunity(opportunityText, context);
  
  return NextResponse.json({
    success: true,
    data: {
      classification,
      metadata: {
        analysisType: 'classification',
        analyzedAt: new Date().toISOString(),
        inputLength: opportunityText.length
      }
    }
  });
}

async function handleBidDecision(opportunityText: string, body: any, context: any) {
  const validatedData = bidAnalysisSchema.parse(body);
  
  const analysis = await analyzeBidDecision(
    opportunityText,
    validatedData.companyProfile,
    context
  );
  
  return NextResponse.json({
    success: true,
    data: {
      bidDecision: analysis,
      metadata: {
        analysisType: 'bid-decision',
        analyzedAt: new Date().toISOString(),
        inputLength: opportunityText.length
      }
    }
  });
}

async function handleCompetitiveAnalysis(opportunityText: string, body: any) {
  const validatedData = competitiveAnalysisSchema.parse(body);
  
  const intelligence = await generateCompetitiveIntelligence(
    opportunityText,
    validatedData.knownCompetitors
  );
  
  return NextResponse.json({
    success: true,
    data: {
      competitiveIntelligence: intelligence,
      metadata: {
        analysisType: 'competitive',
        analyzedAt: new Date().toISOString(),
        inputLength: opportunityText.length
      }
    }
  });
}

async function handleDateExtraction(opportunityText: string) {
  const dates = await extractKeyDates(opportunityText);
  
  return NextResponse.json({
    success: true,
    data: {
      keyDates: dates,
      metadata: {
        analysisType: 'dates',
        analyzedAt: new Date().toISOString(),
        inputLength: opportunityText.length
      }
    }
  });
}

async function handleComprehensiveAnalysis(opportunityText: string, context: any) {
  // Run all analyses in parallel for comprehensive view
  const [
    requirements,
    classification,
    dates,
    competitiveIntelligence
  ] = await Promise.all([
    extractRequirements(opportunityText, context),
    classifyOpportunity(opportunityText, context),
    extractKeyDates(opportunityText),
    generateCompetitiveIntelligence(opportunityText)
  ]);

  // Calculate overall opportunity score
  const opportunityScore = calculateOpportunityScore(
    requirements,
    classification,
    competitiveIntelligence
  );

  return NextResponse.json({
    success: true,
    data: {
      requirements,
      classification,
      keyDates: dates,
      competitiveIntelligence,
      opportunityScore,
      metadata: {
        analysisType: 'comprehensive',
        analyzedAt: new Date().toISOString(),
        inputLength: opportunityText.length,
        analysisComponents: ['requirements', 'classification', 'dates', 'competitive']
      }
    }
  });
}

// Helper function to calculate opportunity score
function calculateOpportunityScore(
  requirements: RequirementExtraction,
  classification: OpportunityClassification,
  competitive: any
): {
  overall: number;
  breakdown: {
    complexity: number;
    competition: number;
    strategic: number;
    risk: number;
  };
  recommendation: string;
} {
  // Calculate component scores (0-100)
  const complexityScore = requirements.estimatedScope.complexity === 'low' ? 80 : 
                         requirements.estimatedScope.complexity === 'medium' ? 60 : 40;
  
  const competitionScore = classification.competitionLevel === 'low' ? 80 :
                          classification.competitionLevel === 'medium' ? 60 : 40;
  
  const strategicScore = classification.strategicImportance === 'high' ? 80 :
                        classification.strategicImportance === 'medium' ? 60 : 40;
  
  const riskScore = classification.riskLevel === 'low' ? 80 :
                   classification.riskLevel === 'medium' ? 60 : 40;

  // Weight the scores
  const overall = Math.round(
    (complexityScore * 0.25) +
    (competitionScore * 0.3) +
    (strategicScore * 0.25) +
    (riskScore * 0.2)
  );

  let recommendation: string;
  if (overall >= 70) {
    recommendation = 'Highly recommended - strong opportunity with good win potential';
  } else if (overall >= 50) {
    recommendation = 'Consider pursuing - moderate opportunity with some challenges';
  } else {
    recommendation = 'Proceed with caution - challenging opportunity with low win probability';
  }

  return {
    overall,
    breakdown: {
      complexity: complexityScore,
      competition: competitionScore,
      strategic: strategicScore,
      risk: riskScore
    },
    recommendation
  };
}

// GET /api/ai/analyze-opportunity - Get available analysis types
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        availableAnalysisTypes: [
          {
            type: 'comprehensive',
            description: 'Full analysis including all components',
            components: ['requirements', 'classification', 'dates', 'competitive', 'scoring']
          },
          {
            type: 'requirements',
            description: 'Extract detailed technical and performance requirements',
            components: ['technical', 'performance', 'deliverables', 'qualifications']
          },
          {
            type: 'classification',
            description: 'Classify opportunity by category, industry, and risk level',
            components: ['category', 'industry', 'competition', 'risk']
          },
          {
            type: 'bid-decision',
            description: 'Bid/no-bid recommendation with SWOT analysis',
            components: ['recommendation', 'swot', 'win-probability', 'resources'],
            requiresCompanyProfile: true
          },
          {
            type: 'competitive',
            description: 'Competitive intelligence and differentiation strategies',
            components: ['competitors', 'advantages', 'pricing', 'strategy']
          },
          {
            type: 'dates',
            description: 'Extract all important dates and deadlines',
            components: ['deadlines', 'milestones', 'performance-period']
          }
        ],
        supportedInputs: ['opportunityId', 'opportunityText'],
        requiredFields: {
          'bid-decision': ['companyProfile'],
          'competitive': ['knownCompetitors (optional)']
        }
      }
    });

  } catch (error) {
    console.error('Error getting analysis types:', error);
    return NextResponse.json({
      error: 'Failed to get analysis types'
    }, { status: 500 });
  }
}