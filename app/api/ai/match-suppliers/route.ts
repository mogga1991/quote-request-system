import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  findMatchingSuppliers,
  generateSupplierSelectionStrategy,
  analyzeSupplierMarket,
  type MatchingCriteria,
  type SupplierMatch
} from '@/lib/services/ai-supplier-matching';
import { z } from 'zod';

// Validation schemas
const matchSuppliersSchema = z.object({
  requirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
    weight: z.number().min(0).max(1).optional().default(1)
  })),
  naicsCodes: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  minimumRating: z.number().min(0).max(5).optional(),
  gsaScheduleRequired: z.boolean().optional(),
  budgetRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  geographicPreferences: z.array(z.string()).optional(),
  pastPerformanceWeight: z.number().min(0).max(1).optional().default(0.3),
  maxResults: z.number().min(1).max(50).optional().default(10)
});

const selectionStrategySchema = z.object({
  supplierMatches: z.array(z.object({
    supplierId: z.string(),
    matchScore: z.number().min(0).max(1),
    recommendation: z.enum(['highly_recommended', 'recommended', 'consider', 'not_recommended']),
    estimatedFit: z.object({
      technical: z.number().min(0).max(1),
      experience: z.number().min(0).max(1),
      capacity: z.number().min(0).max(1),
      pricing: z.number().min(0).max(1)
    }),
    gapsIdentified: z.array(z.object({
      requirement: z.string(),
      gap: z.string(),
      severity: z.enum(['low', 'medium', 'high'])
    })),
    riskFactors: z.array(z.object({
      factor: z.string(),
      impact: z.enum(['low', 'medium', 'high']),
      likelihood: z.enum(['low', 'medium', 'high'])
    }))
  })),
  opportunityContext: z.object({
    estimatedValue: z.string().optional(),
    timeline: z.string().optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    strategicImportance: z.enum(['low', 'medium', 'high']).optional()
  }).optional().default({})
});

const marketAnalysisSchema = z.object({
  naicsCodes: z.array(z.string()).min(1, 'At least one NAICS code is required'),
  geographicScope: z.string().optional()
});

// POST /api/ai/match-suppliers - Find matching suppliers using AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'match';

    switch (action) {
      case 'match':
        return await handleSupplierMatching(body);
      
      case 'strategy':
        return await handleSelectionStrategy(body);
      
      case 'market-analysis':
        return await handleMarketAnalysis(body);
      
      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: match, strategy, market-analysis'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in supplier matching:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to process supplier matching request'
    }, { status: 500 });
  }
}

async function handleSupplierMatching(body: any) {
  const validatedData = matchSuppliersSchema.parse(body);
  
  const criteria: MatchingCriteria = {
    requirements: validatedData.requirements,
    naicsCodes: validatedData.naicsCodes,
    certifications: validatedData.certifications,
    minimumRating: validatedData.minimumRating,
    gsaScheduleRequired: validatedData.gsaScheduleRequired,
    budgetRange: validatedData.budgetRange,
    geographicPreferences: validatedData.geographicPreferences,
    pastPerformanceWeight: validatedData.pastPerformanceWeight
  };

  const matches = await findMatchingSuppliers(criteria, validatedData.maxResults);

  // Calculate summary statistics
  const summary = calculateMatchSummary(matches);

  return NextResponse.json({
    success: true,
    data: {
      matches,
      summary,
      criteria,
      metadata: {
        matchedAt: new Date().toISOString(),
        totalMatches: matches.length,
        searchCriteria: criteria,
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleSelectionStrategy(body: any) {
  const validatedData = selectionStrategySchema.parse(body);
  
  const strategy = await generateSupplierSelectionStrategy(
    validatedData.supplierMatches,
    validatedData.opportunityContext
  );

  return NextResponse.json({
    success: true,
    data: {
      selectionStrategy: strategy,
      metadata: {
        generatedAt: new Date().toISOString(),
        suppliersAnalyzed: validatedData.supplierMatches.length,
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleMarketAnalysis(body: any) {
  const validatedData = marketAnalysisSchema.parse(body);
  
  const marketAnalysis = await analyzeSupplierMarket(
    validatedData.naicsCodes,
    validatedData.geographicScope
  );

  return NextResponse.json({
    success: true,
    data: {
      marketAnalysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        naicsCodes: validatedData.naicsCodes,
        geographicScope: validatedData.geographicScope,
        aiModel: 'gpt-4o'
      }
    }
  });
}

function calculateMatchSummary(matches: SupplierMatch[]) {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      averageMatchScore: 0,
      recommendationBreakdown: {},
      topMatchScore: 0,
      gapAnalysis: {}
    };
  }

  const averageMatchScore = matches.reduce((sum, match) => sum + match.matchScore, 0) / matches.length;
  const topMatchScore = Math.max(...matches.map(m => m.matchScore));

  const recommendationBreakdown = matches.reduce((acc, match) => {
    acc[match.recommendation] = (acc[match.recommendation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Analyze common gaps
  const allGaps = matches.flatMap(match => match.gapsIdentified);
  const gapFrequency = allGaps.reduce((acc, gap) => {
    const key = gap.requirement;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topGaps = Object.entries(gapFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([requirement, frequency]) => ({
      requirement,
      frequency,
      percentage: Math.round((frequency / matches.length) * 100)
    }));

  return {
    totalMatches: matches.length,
    averageMatchScore: Math.round(averageMatchScore * 100) / 100,
    recommendationBreakdown,
    topMatchScore: Math.round(topMatchScore * 100) / 100,
    gapAnalysis: {
      commonGaps: topGaps,
      totalGapsIdentified: allGaps.length
    }
  };
}

// GET /api/ai/match-suppliers - Get matching capabilities and options
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        availableActions: [
          {
            action: 'match',
            description: 'Find and rank suppliers based on requirements',
            parameters: {
              required: ['requirements'],
              optional: ['naicsCodes', 'certifications', 'minimumRating', 'gsaScheduleRequired', 'budgetRange', 'maxResults']
            }
          },
          {
            action: 'strategy',
            description: 'Generate supplier selection strategy',
            parameters: {
              required: ['supplierMatches'],
              optional: ['opportunityContext']
            }
          },
          {
            action: 'market-analysis',
            description: 'Analyze supplier market dynamics',
            parameters: {
              required: ['naicsCodes'],
              optional: ['geographicScope']
            }
          }
        ],
        matchingCapabilities: {
          criteriaTypes: [
            'technical requirements',
            'performance requirements',
            'certifications',
            'past performance',
            'geographic location',
            'budget constraints',
            'NAICS code alignment'
          ],
          scoringFactors: [
            'technical fit',
            'experience alignment',
            'capacity availability',
            'pricing competitiveness',
            'risk assessment'
          ],
          recommendationLevels: [
            'highly_recommended',
            'recommended', 
            'consider',
            'not_recommended'
          ]
        },
        limits: {
          maxResults: 50,
          maxRequirements: 20,
          maxNAICSCodes: 10
        }
      }
    });

  } catch (error) {
    console.error('Error getting matching capabilities:', error);
    return NextResponse.json({
      error: 'Failed to get matching capabilities'
    }, { status: 500 });
  }
}