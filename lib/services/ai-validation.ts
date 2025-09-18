import { z } from 'zod';
import { convertAndCallClaude, extractJSON } from '@/lib/claude-helper';

// Validation schemas
const quoteRequestValidationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  passesValidation: z.boolean(),
  criticalIssues: z.array(z.object({
    category: z.string(),
    description: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    suggestion: z.string(),
    location: z.string().optional()
  })),
  qualityMetrics: z.object({
    completeness: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    compliance: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    professionalism: z.number().min(0).max(100)
  }),
  complianceChecks: z.object({
    hasRequiredSections: z.boolean(),
    hasEvaluationCriteria: z.boolean(),
    hasDeadlines: z.boolean(),
    hasContactInfo: z.boolean(),
    followsGovStandards: z.boolean(),
    hasAccessibilityCompliance: z.boolean()
  }),
  improvements: z.array(z.object({
    category: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    estimatedImpact: z.string(),
    implementationEffort: z.enum(['low', 'medium', 'high'])
  })),
  readabilityAnalysis: z.object({
    readingLevel: z.string(),
    avgSentenceLength: z.number(),
    complexWords: z.number(),
    recommendedChanges: z.array(z.string())
  }),
  riskAssessment: z.object({
    ambiguityRisk: z.enum(['low', 'medium', 'high']),
    legalRisk: z.enum(['low', 'medium', 'high']),
    responseRisk: z.enum(['low', 'medium', 'high']),
    mitigationStrategies: z.array(z.string())
  })
});

const supplierResponseValidationSchema = z.object({
  isValid: z.boolean(),
  validationScore: z.number().min(0).max(100),
  completenessCheck: z.object({
    hasAllRequiredFields: z.boolean(),
    missingFields: z.array(z.string()),
    completenessPercentage: z.number()
  }),
  pricingValidation: z.object({
    calculationsCorrect: z.boolean(),
    pricingReasonable: z.boolean(),
    totalsMatch: z.boolean(),
    pricingIssues: z.array(z.string())
  }),
  complianceValidation: z.object({
    meetsRequirements: z.boolean(),
    complianceGaps: z.array(z.string()),
    riskFactors: z.array(z.string())
  }),
  qualityIndicators: z.object({
    professionalPresentation: z.number().min(0).max(100),
    technicalDetail: z.number().min(0).max(100),
    experienceRelevance: z.number().min(0).max(100)
  })
});

export type QuoteRequestValidation = z.infer<typeof quoteRequestValidationSchema>;
export type SupplierResponseValidation = z.infer<typeof supplierResponseValidationSchema>;

/**
 * Validate a complete quote request for quality and compliance
 */
export async function validateQuoteRequest(
  quoteRequest: {
    title: string;
    description: string;
    requirements: Array<{ category: string; items: string[] }>;
    deadline?: Date;
    attachments?: any[];
  },
  opportunity?: {
    naicsCode?: string;
    setAsideCode?: string;
    estimatedValue?: string;
  }
): Promise<QuoteRequestValidation> {
  try {
    const prompt = `
Perform a comprehensive validation and quality assessment of this government contracting RFQ:

QUOTE REQUEST:
Title: ${quoteRequest.title}
Description: ${quoteRequest.description}

Requirements:
${quoteRequest.requirements.map(req => 
  `${req.category}:\n${req.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

Deadline: ${quoteRequest.deadline ? quoteRequest.deadline.toLocaleDateString() : 'Not specified'}
Attachments: ${quoteRequest.attachments?.length || 0} files

${opportunity ? `
Opportunity Context:
NAICS Code: ${opportunity.naicsCode || 'Not specified'}
Set-Aside: ${opportunity.setAsideCode || 'Not specified'}
Estimated Value: ${opportunity.estimatedValue || 'Not specified'}
` : ''}

Evaluate this RFQ across all dimensions of quality, compliance, and effectiveness. Provide detailed feedback and actionable recommendations.

Return validation results in this JSON format:
{
  "overallScore": 85,
  "passesValidation": true,
  "criticalIssues": [
    {
      "category": "compliance",
      "description": "Missing evaluation criteria section",
      "severity": "critical",
      "suggestion": "Add detailed evaluation criteria explaining how responses will be scored",
      "location": "main document"
    }
  ],
  "qualityMetrics": {
    "completeness": 90,
    "clarity": 85,
    "compliance": 80,
    "consistency": 88,
    "professionalism": 92
  },
  "complianceChecks": {
    "hasRequiredSections": true,
    "hasEvaluationCriteria": false,
    "hasDeadlines": true,
    "hasContactInfo": true,
    "followsGovStandards": true,
    "hasAccessibilityCompliance": false
  },
  "improvements": [
    {
      "category": "clarity",
      "description": "Simplify technical language in requirements section",
      "priority": "medium",
      "estimatedImpact": "Improved supplier understanding and response quality",
      "implementationEffort": "low"
    }
  ],
  "readabilityAnalysis": {
    "readingLevel": "College level",
    "avgSentenceLength": 18.5,
    "complexWords": 15,
    "recommendedChanges": ["Break down complex sentences", "Define technical terms"]
  },
  "riskAssessment": {
    "ambiguityRisk": "medium",
    "legalRisk": "low",
    "responseRisk": "low",
    "mitigationStrategies": ["Add clarification section", "Provide examples where helpful"]
  }
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert government procurement compliance reviewer and quality assurance specialist. Provide detailed, actionable validation feedback for RFQs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = extractJSON(responseContent);
    return quoteRequestValidationSchema.parse(parsedResponse);

  } catch (error) {
    console.error('Error validating quote request:', error);
    throw new Error(`Failed to validate quote request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate supplier response for completeness and compliance
 */
export async function validateSupplierResponse(
  response: {
    lineItems: Array<{
      item: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
    }>;
    totalPriceCents: number;
    deliveryTimeDays: number;
    notes?: string;
  },
  requirements: Array<{ category: string; items: string[] }>,
  supplierCapabilities: string[] = []
): Promise<SupplierResponseValidation> {
  try {
    const prompt = `
Validate this supplier response to a government RFQ for completeness, accuracy, and compliance:

SUPPLIER RESPONSE:
Line Items:
${response.lineItems.map(item => 
  `- ${item.item}: ${item.quantity} x $${(item.unitPriceCents / 100).toFixed(2)} = $${(item.totalCents / 100).toFixed(2)}`
).join('\n')}

Total Price: $${(response.totalPriceCents / 100).toFixed(2)}
Delivery Time: ${response.deliveryTimeDays} days
Notes: ${response.notes || 'None provided'}

ORIGINAL REQUIREMENTS:
${requirements.map(req => 
  `${req.category}:\n${req.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

SUPPLIER CAPABILITIES:
${supplierCapabilities.join(', ')}

Validate the response for completeness, pricing accuracy, and requirement compliance.

Return validation results in this JSON format:
{
  "isValid": true,
  "validationScore": 85,
  "completenessCheck": {
    "hasAllRequiredFields": true,
    "missingFields": [],
    "completenessPercentage": 90
  },
  "pricingValidation": {
    "calculationsCorrect": true,
    "pricingReasonable": true,
    "totalsMatch": true,
    "pricingIssues": []
  },
  "complianceValidation": {
    "meetsRequirements": true,
    "complianceGaps": [],
    "riskFactors": []
  },
  "qualityIndicators": {
    "professionalPresentation": 85,
    "technicalDetail": 80,
    "experienceRelevance": 90
  }
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert procurement evaluation specialist. Validate supplier responses for accuracy, completeness, and compliance with government contracting standards.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = extractJSON(responseContent);
    return supplierResponseValidationSchema.parse(parsedResponse);

  } catch (error) {
    console.error('Error validating supplier response:', error);
    throw new Error(`Failed to validate supplier response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check for bias and fairness in requirements and evaluation criteria
 */
export async function validateFairnessAndBias(
  quoteRequest: {
    title: string;
    description: string;
    requirements: Array<{ category: string; items: string[] }>;
  },
  evaluationCriteria?: Array<{ criterion: string; weight: number }>
): Promise<{
  biasScore: number; // 0-100, higher is better (less biased)
  fairnessAssessment: {
    hasInclusiveLanguage: boolean;
    avoidsDiscriminatoryTerms: boolean;
    requirementsAreRelevant: boolean;
    accessibilityConsidered: boolean;
  };
  potentialIssues: Array<{
    type: 'bias' | 'discrimination' | 'exclusion' | 'accessibility';
    description: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  inclusivityRecommendations: string[];
}> {
  try {
    const prompt = `
Review this government contracting RFQ for potential bias, discrimination, and fairness issues:

RFQ CONTENT:
Title: ${quoteRequest.title}
Description: ${quoteRequest.description}

Requirements:
${quoteRequest.requirements.map(req => 
  `${req.category}:\n${req.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

${evaluationCriteria ? `
Evaluation Criteria:
${evaluationCriteria.map(crit => `- ${crit.criterion} (Weight: ${crit.weight})`).join('\n')}
` : ''}

Analyze for:
1. Biased or discriminatory language
2. Requirements that unfairly exclude qualified suppliers
3. Accessibility considerations
4. Inclusive language usage
5. Fair competition promotion

Return assessment in this JSON format:
{
  "biasScore": 85,
  "fairnessAssessment": {
    "hasInclusiveLanguage": true,
    "avoidsDiscriminatoryTerms": true,
    "requirementsAreRelevant": true,
    "accessibilityConsidered": false
  },
  "potentialIssues": [
    {
      "type": "exclusion",
      "description": "Requirement may exclude small businesses",
      "suggestion": "Consider allowing alternative qualification methods",
      "severity": "medium"
    }
  ],
  "inclusivityRecommendations": [
    "Add accessibility compliance requirements",
    "Consider small business participation opportunities"
  ]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in fair and inclusive government procurement practices. Identify potential bias, discrimination, and accessibility issues in RFQs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error validating fairness and bias:', error);
    throw new Error(`Failed to validate fairness and bias: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate compliance with government procurement regulations
 */
export async function validateRegulatoryCompliance(
  quoteRequest: {
    title: string;
    description: string;
    requirements: Array<{ category: string; items: string[] }>;
  },
  contractType: string = 'standard',
  estimatedValue?: string
): Promise<{
  complianceScore: number;
  requiredElements: Array<{
    element: string;
    present: boolean;
    required: boolean;
    guidance: string;
  }>;
  regulatoryGaps: Array<{
    regulation: string;
    requirement: string;
    missing: string;
    remedy: string;
  }>;
  recommendations: string[];
}> {
  try {
    const prompt = `
Validate this government RFQ for compliance with federal procurement regulations:

RFQ DETAILS:
Title: ${quoteRequest.title}
Description: ${quoteRequest.description}
Contract Type: ${contractType}
Estimated Value: ${estimatedValue || 'Not specified'}

Requirements:
${quoteRequest.requirements.map(req => 
  `${req.category}:\n${req.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

Check compliance with:
- FAR (Federal Acquisition Regulation) requirements
- Small business participation requirements
- Equal opportunity provisions
- Required clauses and certifications
- Disclosure requirements
- Evaluation criteria standards

Return compliance assessment in this JSON format:
{
  "complianceScore": 85,
  "requiredElements": [
    {
      "element": "Small Business Subcontracting Plan",
      "present": false,
      "required": true,
      "guidance": "Required for contracts over $750,000"
    }
  ],
  "regulatoryGaps": [
    {
      "regulation": "FAR 52.219-9",
      "requirement": "Small Business Subcontracting Plan",
      "missing": "Subcontracting plan requirements not specified",
      "remedy": "Add clause requiring subcontracting plan if applicable"
    }
  ],
  "recommendations": [
    "Include required FAR clauses for contract type",
    "Add equal opportunity provisions"
  ]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a government procurement regulation expert specializing in FAR compliance and federal contracting requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error validating regulatory compliance:', error);
    throw new Error(`Failed to validate regulatory compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Perform automated quality checks on generated content
 */
export async function performQualityChecks(
  content: string,
  contentType: 'quote_request' | 'supplier_response' | 'template',
  context?: any
): Promise<{
  qualityScore: number;
  readabilityScore: number;
  grammarIssues: Array<{ issue: string; suggestion: string; location: string }>;
  consistencyIssues: Array<{ issue: string; suggestion: string }>;
  improvementAreas: string[];
}> {
  try {
    const prompt = `
Perform quality checks on this ${contentType.replace('_', ' ')} content:

CONTENT:
${content}

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

Analyze for:
1. Grammar and spelling
2. Readability and clarity
3. Consistency in terminology
4. Professional tone
5. Completeness and logic

Return quality assessment in this JSON format:
{
  "qualityScore": 85,
  "readabilityScore": 80,
  "grammarIssues": [
    {
      "issue": "Passive voice usage",
      "suggestion": "Use active voice for clarity",
      "location": "paragraph 2"
    }
  ],
  "consistencyIssues": [
    {
      "issue": "Inconsistent terminology",
      "suggestion": "Use 'vendor' or 'supplier' consistently"
    }
  ],
  "improvementAreas": [
    "Simplify complex sentences",
    "Add more specific examples"
  ]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional editor and quality assurance specialist for government documents. Provide detailed quality feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error performing quality checks:', error);
    throw new Error(`Failed to perform quality checks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}