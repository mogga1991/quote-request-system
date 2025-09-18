import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  validateQuoteRequest,
  validateSupplierResponse,
  validateFairnessAndBias,
  validateRegulatoryCompliance,
  performQualityChecks
} from '@/lib/services/ai-validation';
import { z } from 'zod';

// Validation schemas
const quoteRequestValidationRequestSchema = z.object({
  quoteRequest: z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.object({
      category: z.string(),
      items: z.array(z.string())
    })),
    deadline: z.string().datetime().optional(),
    attachments: z.array(z.any()).optional()
  }),
  opportunity: z.object({
    naicsCode: z.string().optional(),
    setAsideCode: z.string().optional(),
    estimatedValue: z.string().optional()
  }).optional(),
  validationLevel: z.enum(['basic', 'comprehensive', 'compliance']).optional().default('comprehensive')
});

const supplierResponseValidationRequestSchema = z.object({
  response: z.object({
    lineItems: z.array(z.object({
      item: z.string(),
      quantity: z.number(),
      unitPriceCents: z.number(),
      totalCents: z.number()
    })),
    totalPriceCents: z.number(),
    deliveryTimeDays: z.number(),
    notes: z.string().optional()
  }),
  requirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  })),
  supplierCapabilities: z.array(z.string()).optional().default([])
});

const fairnessValidationRequestSchema = z.object({
  quoteRequest: z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.object({
      category: z.string(),
      items: z.array(z.string())
    }))
  }),
  evaluationCriteria: z.array(z.object({
    criterion: z.string(),
    weight: z.number()
  })).optional()
});

const complianceValidationRequestSchema = z.object({
  quoteRequest: z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.object({
      category: z.string(),
      items: z.array(z.string())
    }))
  }),
  contractType: z.string().optional().default('standard'),
  estimatedValue: z.string().optional()
});

const qualityCheckRequestSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  contentType: z.enum(['quote_request', 'supplier_response', 'template']),
  context: z.any().optional()
});

// POST /api/ai/validate - Validate content using AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const validationType = searchParams.get('type') || 'quote-request';

    switch (validationType) {
      case 'quote-request':
        return await handleQuoteRequestValidation(body);
      
      case 'supplier-response':
        return await handleSupplierResponseValidation(body);
      
      case 'fairness':
        return await handleFairnessValidation(body);
      
      case 'compliance':
        return await handleComplianceValidation(body);
      
      case 'quality':
        return await handleQualityCheck(body);
      
      case 'comprehensive':
        return await handleComprehensiveValidation(body);
      
      default:
        return NextResponse.json({
          error: 'Invalid validation type. Supported types: quote-request, supplier-response, fairness, compliance, quality, comprehensive'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in validation service:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to perform validation'
    }, { status: 500 });
  }
}

async function handleQuoteRequestValidation(body: any) {
  const validatedData = quoteRequestValidationRequestSchema.parse(body);
  
  const quoteRequest = {
    ...validatedData.quoteRequest,
    deadline: validatedData.quoteRequest.deadline ? new Date(validatedData.quoteRequest.deadline) : undefined
  };

  const validation = await validateQuoteRequest(quoteRequest, validatedData.opportunity);

  return NextResponse.json({
    success: true,
    data: {
      validation,
      metadata: {
        validatedAt: new Date().toISOString(),
        validationType: 'quote-request',
        validationLevel: validatedData.validationLevel,
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleSupplierResponseValidation(body: any) {
  const validatedData = supplierResponseValidationRequestSchema.parse(body);
  
  const validation = await validateSupplierResponse(
    validatedData.response,
    validatedData.requirements,
    validatedData.supplierCapabilities
  );

  return NextResponse.json({
    success: true,
    data: {
      validation,
      metadata: {
        validatedAt: new Date().toISOString(),
        validationType: 'supplier-response',
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleFairnessValidation(body: any) {
  const validatedData = fairnessValidationRequestSchema.parse(body);
  
  const validation = await validateFairnessAndBias(
    validatedData.quoteRequest,
    validatedData.evaluationCriteria
  );

  return NextResponse.json({
    success: true,
    data: {
      fairnessValidation: validation,
      metadata: {
        validatedAt: new Date().toISOString(),
        validationType: 'fairness',
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleComplianceValidation(body: any) {
  const validatedData = complianceValidationRequestSchema.parse(body);
  
  const validation = await validateRegulatoryCompliance(
    validatedData.quoteRequest,
    validatedData.contractType,
    validatedData.estimatedValue
  );

  return NextResponse.json({
    success: true,
    data: {
      complianceValidation: validation,
      metadata: {
        validatedAt: new Date().toISOString(),
        validationType: 'compliance',
        contractType: validatedData.contractType,
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleQualityCheck(body: any) {
  const validatedData = qualityCheckRequestSchema.parse(body);
  
  const qualityCheck = await performQualityChecks(
    validatedData.content,
    validatedData.contentType,
    validatedData.context
  );

  return NextResponse.json({
    success: true,
    data: {
      qualityCheck,
      metadata: {
        checkedAt: new Date().toISOString(),
        validationType: 'quality',
        contentType: validatedData.contentType,
        contentLength: validatedData.content.length,
        aiModel: 'gpt-4o'
      }
    }
  });
}

async function handleComprehensiveValidation(body: any) {
  const validatedData = quoteRequestValidationRequestSchema.parse(body);
  
  const quoteRequest = {
    ...validatedData.quoteRequest,
    deadline: validatedData.quoteRequest.deadline ? new Date(validatedData.quoteRequest.deadline) : undefined
  };

  // Run all validations in parallel
  const [
    basicValidation,
    fairnessValidation,
    complianceValidation,
    qualityCheck
  ] = await Promise.all([
    validateQuoteRequest(quoteRequest, validatedData.opportunity),
    validateFairnessAndBias(validatedData.quoteRequest),
    validateRegulatoryCompliance(
      validatedData.quoteRequest,
      'standard',
      validatedData.opportunity?.estimatedValue
    ),
    performQualityChecks(
      `${validatedData.quoteRequest.title}\n\n${validatedData.quoteRequest.description}`,
      'quote_request'
    )
  ]);

  // Calculate overall assessment
  const overallAssessment = calculateOverallAssessment({
    basicValidation,
    fairnessValidation,
    complianceValidation,
    qualityCheck
  });

  return NextResponse.json({
    success: true,
    data: {
      comprehensiveValidation: {
        basicValidation,
        fairnessValidation,
        complianceValidation,
        qualityCheck,
        overallAssessment
      },
      metadata: {
        validatedAt: new Date().toISOString(),
        validationType: 'comprehensive',
        componentsChecked: ['basic', 'fairness', 'compliance', 'quality'],
        aiModel: 'gpt-4o'
      }
    }
  });
}

function calculateOverallAssessment(validations: {
  basicValidation: any;
  fairnessValidation: any;
  complianceValidation: any;
  qualityCheck: any;
}): {
  overallScore: number;
  readinessLevel: 'not_ready' | 'needs_improvement' | 'good' | 'excellent';
  criticalIssueCount: number;
  recommendedActions: string[];
  strengthAreas: string[];
  improvementPriorities: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }>;
} {
  const { basicValidation, fairnessValidation, complianceValidation, qualityCheck } = validations;

  // Calculate weighted overall score
  const overallScore = Math.round(
    (basicValidation.overallScore * 0.4) +
    (fairnessValidation.biasScore * 0.2) +
    (complianceValidation.complianceScore * 0.25) +
    (qualityCheck.qualityScore * 0.15)
  );

  // Count critical issues
  const criticalIssueCount = 
    basicValidation.criticalIssues.filter((issue: any) => issue.severity === 'critical').length +
    complianceValidation.regulatoryGaps.length +
    fairnessValidation.potentialIssues.filter((issue: any) => issue.severity === 'high').length;

  // Determine readiness level
  let readinessLevel: 'not_ready' | 'needs_improvement' | 'good' | 'excellent';
  if (overallScore >= 90 && criticalIssueCount === 0) {
    readinessLevel = 'excellent';
  } else if (overallScore >= 75 && criticalIssueCount <= 1) {
    readinessLevel = 'good';
  } else if (overallScore >= 60) {
    readinessLevel = 'needs_improvement';
  } else {
    readinessLevel = 'not_ready';
  }

  // Generate recommended actions
  const recommendedActions: string[] = [];
  if (criticalIssueCount > 0) {
    recommendedActions.push('Address all critical issues before proceeding');
  }
  if (complianceValidation.complianceScore < 80) {
    recommendedActions.push('Review and improve regulatory compliance');
  }
  if (fairnessValidation.biasScore < 70) {
    recommendedActions.push('Review content for bias and fairness issues');
  }
  if (qualityCheck.qualityScore < 75) {
    recommendedActions.push('Improve content quality and readability');
  }

  return {
    overallScore,
    readinessLevel,
    criticalIssueCount,
    recommendedActions,
    strengthAreas: [
      ...(basicValidation.overallScore >= 80 ? ['Well-structured requirements'] : []),
      ...(fairnessValidation.biasScore >= 80 ? ['Fair and inclusive language'] : []),
      ...(complianceValidation.complianceScore >= 80 ? ['Good regulatory compliance'] : []),
      ...(qualityCheck.qualityScore >= 80 ? ['High content quality'] : [])
    ],
    improvementPriorities: [
      ...(basicValidation.overallScore < 70 ? [{
        area: 'Basic structure and completeness',
        priority: 'high' as const,
        impact: 'Essential for supplier understanding and response quality'
      }] : []),
      ...(complianceValidation.complianceScore < 70 ? [{
        area: 'Regulatory compliance',
        priority: 'high' as const,
        impact: 'Required for legal procurement process'
      }] : []),
      ...(fairnessValidation.biasScore < 70 ? [{
        area: 'Fairness and inclusivity',
        priority: 'medium' as const,
        impact: 'Important for equal opportunity and competition'
      }] : [])
    ]
  };
}

// GET /api/ai/validate - Get available validation types and options
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        availableValidationTypes: [
          {
            type: 'quote-request',
            description: 'Comprehensive validation of RFQ documents',
            checks: ['completeness', 'clarity', 'compliance', 'consistency', 'professionalism']
          },
          {
            type: 'supplier-response',
            description: 'Validation of supplier responses to RFQs',
            checks: ['completeness', 'pricing accuracy', 'requirement compliance', 'quality']
          },
          {
            type: 'fairness',
            description: 'Bias and fairness assessment',
            checks: ['inclusive language', 'discriminatory terms', 'accessibility', 'fair competition']
          },
          {
            type: 'compliance',
            description: 'Regulatory and legal compliance check',
            checks: ['FAR compliance', 'required clauses', 'procurement regulations', 'disclosure requirements']
          },
          {
            type: 'quality',
            description: 'Content quality and readability assessment',
            checks: ['grammar', 'readability', 'consistency', 'professional tone']
          },
          {
            type: 'comprehensive',
            description: 'Complete validation across all dimensions',
            checks: ['all validation types combined with overall assessment']
          }
        ],
        validationLevels: [
          'basic',
          'comprehensive', 
          'compliance'
        ],
        qualityMetrics: [
          'completeness',
          'clarity',
          'compliance',
          'consistency',
          'professionalism',
          'readability',
          'fairness'
        ],
        severityLevels: [
          'critical',
          'high',
          'medium',
          'low'
        ]
      }
    });

  } catch (error) {
    console.error('Error getting validation options:', error);
    return NextResponse.json({
      error: 'Failed to get validation options'
    }, { status: 500 });
  }
}