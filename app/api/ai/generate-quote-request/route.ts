import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  generateQuoteRequest,
  generateQuoteRequestSuggestions,
  analyzeOpportunity,
  validateAIConfiguration,
  type OpportunityData,
  type AIGenerationOptions
} from '@/lib/services/ai-quote-generation';
import { getOpportunityById } from '@/lib/services/sam-gov';
import { z } from 'zod';

// Validation schemas
const generateRequestSchema = z.object({
  opportunityId: z.string().min(1).optional(),
  opportunityData: z.object({
    title: z.string(),
    description: z.string(),
    naicsCode: z.string().optional(),
    setAsideCode: z.string().optional(),
    estimatedValue: z.string().optional(),
    contractType: z.string().optional(),
    department: z.string().optional(),
    office: z.string().optional(),
  }).optional(),
  options: z.object({
    includeDetailedRequirements: z.boolean().optional().default(true),
    includeBudgetEstimate: z.boolean().optional().default(false),
    includeRiskAssessment: z.boolean().optional().default(false),
    tone: z.enum(['formal', 'conversational', 'technical']).optional().default('formal'),
    complexity: z.enum(['basic', 'intermediate', 'advanced']).optional().default('intermediate'),
    customInstructions: z.string().max(500).optional()
  }).optional().default({})
});

const suggestionsRequestSchema = z.object({
  quoteRequest: z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.object({
      category: z.string(),
      items: z.array(z.string())
    }))
  }),
  opportunityData: z.object({
    title: z.string(),
    description: z.string(),
    naicsCode: z.string().optional(),
    setAsideCode: z.string().optional(),
    estimatedValue: z.string().optional(),
    contractType: z.string().optional(),
    department: z.string().optional(),
    office: z.string().optional(),
  })
});

const analyzeRequestSchema = z.object({
  opportunityText: z.string().min(50, 'Opportunity text must be at least 50 characters')
});

// POST /api/ai/generate-quote-request - Generate AI-powered quote request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check AI service configuration
    const configValidation = validateAIConfiguration();
    if (!configValidation.isValid) {
      return NextResponse.json({
        error: 'AI service not configured',
        details: configValidation.errors
      }, { status: 503 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'generate';

    switch (action) {
      case 'generate':
        return await handleGenerate(body);
      
      case 'suggestions':
        return await handleSuggestions(body);
      
      case 'analyze':
        return await handleAnalyze(body);
      
      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: generate, suggestions, analyze'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in AI quote generation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to process AI request'
    }, { status: 500 });
  }
}

async function handleGenerate(body: any) {
  const validatedData = generateRequestSchema.parse(body);
  let opportunityData: OpportunityData;

  // Get opportunity data either from provided data or by fetching from SAM.gov
  if (validatedData.opportunityData) {
    opportunityData = validatedData.opportunityData;
  } else if (validatedData.opportunityId) {
    // Fetch opportunity from SAM.gov or database
    const opportunity = await getOpportunityById(validatedData.opportunityId);
    if (!opportunity) {
      return NextResponse.json({
        error: 'Opportunity not found'
      }, { status: 404 });
    }
    
    opportunityData = {
      title: opportunity.title,
      description: opportunity.description,
      naicsCode: opportunity.naicsCode,
      setAsideCode: opportunity.setAsideCode,
      estimatedValue: opportunity.estimatedValue,
      contractType: opportunity.contractType,
      department: opportunity.department,
      office: opportunity.office,
    };
  } else {
    return NextResponse.json({
      error: 'Either opportunityId or opportunityData is required'
    }, { status: 400 });
  }

  // Generate the quote request
  const generatedQuoteRequest = await generateQuoteRequest(
    opportunityData,
    validatedData.options as AIGenerationOptions
  );

  return NextResponse.json({
    success: true,
    data: {
      ...generatedQuoteRequest,
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'gpt-4o',
        prompt: 'Quote request generated from opportunity data',
        options: validatedData.options
      }
    }
  });
}

async function handleSuggestions(body: any) {
  const validatedData = suggestionsRequestSchema.parse(body);

  const suggestions = await generateQuoteRequestSuggestions(
    validatedData.quoteRequest,
    validatedData.opportunityData
  );

  return NextResponse.json({
    success: true,
    data: {
      ...suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'gpt-4o',
        type: 'suggestions'
      }
    }
  });
}

async function handleAnalyze(body: any) {
  const validatedData = analyzeRequestSchema.parse(body);

  const analysis = await analyzeOpportunity(validatedData.opportunityText);

  return NextResponse.json({
    success: true,
    data: {
      ...analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        aiModel: 'gpt-4o',
        type: 'opportunity_analysis',
        inputLength: validatedData.opportunityText.length
      }
    }
  });
}

// GET /api/ai/generate-quote-request - Check AI service health
export async function GET() {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configValidation = validateAIConfiguration();
    
    return NextResponse.json({
      success: true,
      data: {
        configured: configValidation.isValid,
        errors: configValidation.errors,
        availableActions: ['generate', 'suggestions', 'analyze'],
        supportedModels: ['gpt-4o'],
        features: {
          quoteGeneration: true,
          opportunityAnalysis: true,
          suggestionEngine: true,
          supplierMatching: true
        }
      }
    });

  } catch (error) {
    console.error('Error checking AI service:', error);
    return NextResponse.json({
      error: 'Failed to check AI service status'
    }, { status: 500 });
  }
}