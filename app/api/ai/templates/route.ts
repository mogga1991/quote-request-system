import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  generateTemplate,
  generateTemplateVariations,
  customizeTemplate,
  recommendTemplates,
  validateTemplate,
  type TemplateRequest,
  type QuoteRequestTemplate
} from '@/lib/services/ai-template-generation';
import { z } from 'zod';

// Validation schemas
const generateTemplateSchema = z.object({
  opportunityType: z.string().min(1, 'Opportunity type is required'),
  industry: z.string().optional(),
  naicsCode: z.string().optional(),
  contractType: z.string().optional(),
  estimatedValue: z.string().optional(),
  complexity: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  specificRequirements: z.array(z.string()).optional(),
  customInstructions: z.string().max(1000).optional(),
  variationCount: z.number().min(1).max(5).optional().default(1)
});

const customizeTemplateSchema = z.object({
  baseTemplate: z.object({
    id: z.string(),
    name: z.string(),
    sections: z.array(z.any())
  }),
  opportunityData: z.object({
    title: z.string(),
    description: z.string(),
    naicsCode: z.string().optional(),
    estimatedValue: z.string().optional(),
    requirements: z.array(z.string()).optional()
  })
});

const recommendTemplatesSchema = z.object({
  opportunityContext: z.object({
    type: z.string(),
    industry: z.string().optional(),
    naicsCode: z.string().optional(),
    estimatedValue: z.string().optional()
  }),
  pastSuccessfulRFQs: z.array(z.object({
    title: z.string(),
    industry: z.string(),
    outcome: z.enum(['successful', 'unsuccessful']),
    responseRate: z.number().min(0).max(100)
  })).optional()
});

const validateTemplateSchema = z.object({
  template: z.object({
    id: z.string(),
    name: z.string(),
    sections: z.array(z.any()),
    defaultRequirements: z.array(z.any())
  })
});

// POST /api/ai/templates - Generate and manage RFQ templates
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'generate';

    switch (action) {
      case 'generate':
        return await handleTemplateGeneration(body);
      
      case 'customize':
        return await handleTemplateCustomization(body);
      
      case 'recommend':
        return await handleTemplateRecommendations(body);
      
      case 'validate':
        return await handleTemplateValidation(body);
      
      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: generate, customize, recommend, validate'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in template service:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to process template request'
    }, { status: 500 });
  }
}

async function handleTemplateGeneration(body: any) {
  const validatedData = generateTemplateSchema.parse(body);
  
  const templateRequest: TemplateRequest = {
    opportunityType: validatedData.opportunityType,
    industry: validatedData.industry,
    naicsCode: validatedData.naicsCode,
    contractType: validatedData.contractType,
    estimatedValue: validatedData.estimatedValue,
    complexity: validatedData.complexity,
    specificRequirements: validatedData.specificRequirements,
    customInstructions: validatedData.customInstructions
  };

  let templates: QuoteRequestTemplate[];

  if (validatedData.variationCount > 1) {
    templates = await generateTemplateVariations(templateRequest, validatedData.variationCount);
  } else {
    const template = await generateTemplate(templateRequest);
    templates = [template];
  }

  return NextResponse.json({
    success: true,
    data: {
      templates,
      request: templateRequest,
      metadata: {
        generatedAt: new Date().toISOString(),
        templateCount: templates.length,
        aiModel: 'gpt-4o',
        userId: body.userId || 'anonymous'
      }
    }
  });
}

async function handleTemplateCustomization(body: any) {
  const validatedData = customizeTemplateSchema.parse(body);
  
  const customizedTemplate = await customizeTemplate(
    validatedData.baseTemplate as QuoteRequestTemplate,
    validatedData.opportunityData
  );

  return NextResponse.json({
    success: true,
    data: {
      customizedTemplate,
      baseTemplate: validatedData.baseTemplate,
      opportunityData: validatedData.opportunityData,
      metadata: {
        customizedAt: new Date().toISOString(),
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleTemplateRecommendations(body: any) {
  const validatedData = recommendTemplatesSchema.parse(body);
  
  const recommendations = await recommendTemplates(
    validatedData.opportunityContext,
    validatedData.pastSuccessfulRFQs
  );

  return NextResponse.json({
    success: true,
    data: {
      recommendations,
      context: validatedData.opportunityContext,
      metadata: {
        recommendedAt: new Date().toISOString(),
        aiModel: 'gpt-4o',
        historyConsidered: validatedData.pastSuccessfulRFQs?.length || 0
      }
    }
  });
}

async function handleTemplateValidation(body: any) {
  const validatedData = validateTemplateSchema.parse(body);
  
  const validation = await validateTemplate(validatedData.template as QuoteRequestTemplate);

  return NextResponse.json({
    success: true,
    data: {
      validation,
      template: validatedData.template,
      metadata: {
        validatedAt: new Date().toISOString(),
        aiModel: 'gpt-4o'
      }
    }
  });
}

// GET /api/ai/templates - Get available template types and options
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
            action: 'generate',
            description: 'Generate new RFQ templates based on opportunity requirements',
            parameters: {
              required: ['opportunityType'],
              optional: ['industry', 'naicsCode', 'contractType', 'estimatedValue', 'complexity', 'specificRequirements', 'customInstructions', 'variationCount']
            }
          },
          {
            action: 'customize',
            description: 'Customize existing template for specific opportunity',
            parameters: {
              required: ['baseTemplate', 'opportunityData'],
              optional: []
            }
          },
          {
            action: 'recommend',
            description: 'Get template recommendations based on context',
            parameters: {
              required: ['opportunityContext'],
              optional: ['pastSuccessfulRFQs']
            }
          },
          {
            action: 'validate',
            description: 'Validate template quality and compliance',
            parameters: {
              required: ['template'],
              optional: []
            }
          }
        ],
        templateCategories: [
          'IT Services',
          'Professional Services',
          'Construction Services', 
          'Medical Equipment',
          'Research & Development',
          'Training Services',
          'Maintenance Services',
          'Custom Requirements'
        ],
        complexityLevels: [
          {
            level: 'basic',
            description: 'Simple procurements with standard requirements',
            estimatedTime: '30-60 minutes'
          },
          {
            level: 'intermediate',
            description: 'Moderate complexity with multiple requirements',
            estimatedTime: '60-120 minutes'
          },
          {
            level: 'advanced',
            description: 'Complex procurements with detailed specifications',
            estimatedTime: '120+ minutes'
          }
        ],
        supportedFieldTypes: [
          'text',
          'textarea',
          'select',
          'multiselect',
          'date',
          'number',
          'checkbox'
        ],
        validationOptions: {
          completenessCheck: true,
          clarityAssessment: true,
          complianceReview: true,
          usabilityEvaluation: true
        }
      }
    });

  } catch (error) {
    console.error('Error getting template options:', error);
    return NextResponse.json({
      error: 'Failed to get template options'
    }, { status: 500 });
  }
}