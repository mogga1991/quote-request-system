import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  generateQuoteRequestSuggestions 
} from '@/lib/services/ai-quote-generation';
import { 
  generateSupplierRequirements 
} from '@/lib/services/ai-quote-generation';
import { z } from 'zod';

// Validation schemas
const quoteSuggestionsSchema = z.object({
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
    office: z.string().optional()
  }),
  context: z.object({
    userExperience: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    previousRFQs: z.array(z.object({
      title: z.string(),
      responseRate: z.number(),
      successRate: z.number()
    })).optional(),
    organizationProfile: z.object({
      type: z.string(),
      size: z.string(),
      capabilities: z.array(z.string())
    }).optional()
  }).optional()
});

const supplierRequirementSuggestionsSchema = z.object({
  opportunityData: z.object({
    title: z.string(),
    description: z.string(),
    naicsCode: z.string().optional(),
    contractType: z.string().optional()
  }),
  supplierCapabilities: z.array(z.string()),
  existingRequirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  }))
});

const contextualSuggestionsSchema = z.object({
  currentStep: z.enum(['opportunity_selection', 'requirement_definition', 'supplier_selection', 'quote_creation', 'review_submission']),
  userInput: z.string(),
  sessionContext: z.object({
    previousActions: z.array(z.string()).optional(),
    timeSpent: z.number().optional(), // minutes
    completionRate: z.number().optional() // 0-1
  }).optional()
});

// POST /api/ai/suggestions - Get context-aware suggestions
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const suggestionType = searchParams.get('type') || 'quote';

    switch (suggestionType) {
      case 'quote':
        return await handleQuoteSuggestions(body);
      
      case 'supplier-requirements':
        return await handleSupplierRequirementSuggestions(body);
      
      case 'contextual':
        return await handleContextualSuggestions(body);
      
      case 'workflow':
        return await handleWorkflowSuggestions(body);
      
      default:
        return NextResponse.json({
          error: 'Invalid suggestion type. Supported types: quote, supplier-requirements, contextual, workflow'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to generate suggestions'
    }, { status: 500 });
  }
}

async function handleQuoteSuggestions(body: any) {
  const validatedData = quoteSuggestionsSchema.parse(body);
  
  const suggestions = await generateQuoteRequestSuggestions(
    validatedData.quoteRequest,
    validatedData.opportunityData
  );

  // Add contextual enhancements based on user experience and history
  const enhancedSuggestions = await enhanceSuggestionsWithContext(
    suggestions,
    validatedData.context
  );

  return NextResponse.json({
    success: true,
    data: {
      suggestions: enhancedSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        suggestionType: 'quote',
        aiModel: 'gpt-4o',
        contextConsidered: !!validatedData.context
      }
    }
  });
}

async function handleSupplierRequirementSuggestions(body: any) {
  const validatedData = supplierRequirementSuggestionsSchema.parse(body);
  
  const supplierRequirements = await generateSupplierRequirements(
    validatedData.opportunityData,
    validatedData.supplierCapabilities,
    validatedData.existingRequirements
  );

  return NextResponse.json({
    success: true,
    data: {
      supplierRequirements,
      metadata: {
        generatedAt: new Date().toISOString(),
        suggestionType: 'supplier-requirements',
        aiModel: 'gpt-4o',
        capabilitiesConsidered: validatedData.supplierCapabilities.length
      }
    }
  });
}

async function handleContextualSuggestions(body: any) {
  const validatedData = contextualSuggestionsSchema.parse(body);
  
  const contextualSuggestions = await generateContextualGuidance(
    validatedData.currentStep,
    validatedData.userInput,
    validatedData.sessionContext
  );

  return NextResponse.json({
    success: true,
    data: {
      contextualSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        suggestionType: 'contextual',
        currentStep: validatedData.currentStep,
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleWorkflowSuggestions(body: any) {
  const workflowSuggestions = await generateWorkflowOptimizations(body);

  return NextResponse.json({
    success: true,
    data: {
      workflowSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        suggestionType: 'workflow',
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function enhanceSuggestionsWithContext(
  baseSuggestions: any,
  context?: any
): Promise<any> {
  if (!context) return baseSuggestions;

  const enhanced = { ...baseSuggestions };

  // Adjust based on user experience level
  if (context.userExperience === 'beginner') {
    enhanced.additionalGuidance = [
      'Consider starting with a simple, clear requirements structure',
      'Include detailed specifications to avoid ambiguity',
      'Set realistic deadlines to allow adequate response time'
    ];
  } else if (context.userExperience === 'expert') {
    enhanced.advancedOptimizations = [
      'Consider performance-based contracting approaches',
      'Include value engineering opportunities',
      'Add strategic evaluation criteria for long-term partnerships'
    ];
  }

  // Learn from previous RFQs
  if (context.previousRFQs && context.previousRFQs.length > 0) {
    const avgResponseRate = context.previousRFQs.reduce((sum: number, rfq: any) => sum + rfq.responseRate, 0) / context.previousRFQs.length;
    
    if (avgResponseRate < 50) {
      enhanced.responseRateImprovements = [
        'Consider expanding supplier outreach',
        'Review requirement complexity - may be too restrictive',
        'Ensure adequate response time (minimum 14 days recommended)'
      ];
    }
  }

  return enhanced;
}

async function generateContextualGuidance(
  currentStep: string,
  userInput: string,
  sessionContext?: any
): Promise<{
  nextStepSuggestions: string[];
  inputValidation: {
    isValid: boolean;
    issues: string[];
    improvements: string[];
  };
  processOptimizations: string[];
  timeEstimate: string;
}> {
  const stepGuidance = {
    opportunity_selection: {
      nextSteps: [
        'Review opportunity requirements thoroughly',
        'Analyze NAICS code alignment with your capabilities',
        'Check set-aside requirements and eligibility'
      ],
      validationChecks: ['Opportunity fit assessment', 'Eligibility verification', 'Competition analysis'],
      timeEstimate: '15-30 minutes'
    },
    requirement_definition: {
      nextSteps: [
        'Break down requirements into clear categories',
        'Define measurable performance criteria',
        'Include compliance and quality standards'
      ],
      validationChecks: ['Requirement clarity', 'Measurability', 'Relevance to opportunity'],
      timeEstimate: '45-90 minutes'
    },
    supplier_selection: {
      nextSteps: [
        'Define supplier evaluation criteria',
        'Search for qualified suppliers',
        'Verify supplier capabilities and certifications'
      ],
      validationChecks: ['Capability alignment', 'Certification verification', 'Past performance review'],
      timeEstimate: '30-60 minutes'
    },
    quote_creation: {
      nextSteps: [
        'Compile all requirements into RFQ',
        'Set realistic response deadlines',
        'Include evaluation criteria'
      ],
      validationChecks: ['Completeness check', 'Clarity review', 'Compliance verification'],
      timeEstimate: '60-120 minutes'
    },
    review_submission: {
      nextSteps: [
        'Final review of all components',
        'Validate supplier contact information',
        'Schedule follow-up activities'
      ],
      validationChecks: ['Final completeness', 'Contact verification', 'Process readiness'],
      timeEstimate: '15-30 minutes'
    }
  };

  const guidance = stepGuidance[currentStep as keyof typeof stepGuidance] || stepGuidance.opportunity_selection;

  // Validate user input based on current step
  const inputValidation = validateStepInput(currentStep, userInput);

  // Generate process optimizations based on session context
  const processOptimizations = generateProcessOptimizations(sessionContext);

  return {
    nextStepSuggestions: guidance.nextSteps,
    inputValidation,
    processOptimizations,
    timeEstimate: guidance.timeEstimate
  };
}

function validateStepInput(step: string, input: string): {
  isValid: boolean;
  issues: string[];
  improvements: string[];
} {
  const issues: string[] = [];
  const improvements: string[] = [];

  // Basic validation
  if (!input || input.trim().length < 10) {
    issues.push('Input is too short or empty');
    improvements.push('Provide more detailed information');
  }

  // Step-specific validation
  switch (step) {
    case 'requirement_definition':
      if (!input.includes('requirement') && !input.includes('need')) {
        improvements.push('Include specific requirements or needs');
      }
      break;
    case 'supplier_selection':
      if (!input.includes('supplier') && !input.includes('vendor')) {
        improvements.push('Specify supplier-related criteria');
      }
      break;
  }

  return {
    isValid: issues.length === 0,
    issues,
    improvements
  };
}

function generateProcessOptimizations(sessionContext?: any): string[] {
  const optimizations: string[] = [];

  if (sessionContext?.timeSpent && sessionContext.timeSpent > 120) {
    optimizations.push('Consider breaking down complex tasks into smaller steps');
  }

  if (sessionContext?.completionRate && sessionContext.completionRate < 0.5) {
    optimizations.push('Use templates to speed up the process');
    optimizations.push('Focus on high-priority requirements first');
  }

  if (sessionContext?.previousActions && sessionContext.previousActions.length > 10) {
    optimizations.push('Review previous steps to avoid redundancy');
  }

  return optimizations;
}

async function generateWorkflowOptimizations(context: any): Promise<{
  processImprovements: string[];
  automationOpportunities: string[];
  timelineSuggestions: string[];
  qualityChecks: string[];
}> {
  return {
    processImprovements: [
      'Standardize requirement templates for common procurement types',
      'Create supplier shortlists for frequently used categories',
      'Implement progressive disclosure for complex forms'
    ],
    automationOpportunities: [
      'Auto-populate requirements based on NAICS code',
      'Suggest suppliers based on past successful procurements',
      'Generate compliance checklists automatically'
    ],
    timelineSuggestions: [
      'Allow 2-3 weeks for complex RFQ responses',
      'Schedule follow-up reminders 1 week before deadline',
      'Plan evaluation period based on number of expected responses'
    ],
    qualityChecks: [
      'Verify all requirements are measurable and specific',
      'Ensure evaluation criteria align with requirements',
      'Confirm all supplier contact information is current'
    ]
  };
}

// GET /api/ai/suggestions - Get available suggestion types
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        availableSuggestionTypes: [
          {
            type: 'quote',
            description: 'Suggestions for improving quote requests',
            parameters: ['quoteRequest', 'opportunityData', 'context (optional)']
          },
          {
            type: 'supplier-requirements',
            description: 'Generate supplier-specific requirements',
            parameters: ['opportunityData', 'supplierCapabilities', 'existingRequirements']
          },
          {
            type: 'contextual',
            description: 'Step-by-step guidance based on current context',
            parameters: ['currentStep', 'userInput', 'sessionContext (optional)']
          },
          {
            type: 'workflow',
            description: 'Process optimization recommendations',
            parameters: ['workflowContext']
          }
        ],
        workflowSteps: [
          'opportunity_selection',
          'requirement_definition',
          'supplier_selection',
          'quote_creation',
          'review_submission'
        ],
        contextFactors: [
          'userExperience',
          'previousRFQs',
          'organizationProfile',
          'timeConstraints',
          'budgetLimitations'
        ]
      }
    });

  } catch (error) {
    console.error('Error getting suggestion types:', error);
    return NextResponse.json({
      error: 'Failed to get suggestion types'
    }, { status: 500 });
  }
}