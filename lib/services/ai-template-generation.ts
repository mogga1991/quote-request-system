import { z } from 'zod';
import { convertAndCallClaude, extractJSON } from '@/lib/claude-helper';

// Validation schemas
const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  industry: z.string(),
  complexity: z.enum(['basic', 'intermediate', 'advanced']),
  estimatedTimeToComplete: z.number(), // minutes
  sections: z.array(z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    required: z.boolean(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'textarea', 'select', 'multiselect', 'date', 'number', 'checkbox']),
      label: z.string(),
      placeholder: z.string().optional(),
      required: z.boolean(),
      options: z.array(z.string()).optional(), // for select/multiselect
      validation: z.object({
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional()
      }).optional()
    }))
  })),
  defaultRequirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  })),
  suggestedSupplierCriteria: z.object({
    naicsCodes: z.array(z.string()),
    certifications: z.array(z.string()),
    capabilities: z.array(z.string())
  }),
  metadata: z.object({
    createdBy: z.string(),
    lastUpdated: z.string(),
    usage: z.object({
      timesUsed: z.number(),
      averageRating: z.number(),
      successRate: z.number()
    })
  }).optional()
});

const templateRequestSchema = z.object({
  opportunityType: z.string(),
  industry: z.string().optional(),
  naicsCode: z.string().optional(),
  contractType: z.string().optional(),
  estimatedValue: z.string().optional(),
  complexity: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  specificRequirements: z.array(z.string()).optional(),
  customInstructions: z.string().optional()
});

export type QuoteRequestTemplate = z.infer<typeof templateSchema>;
export type TemplateRequest = z.infer<typeof templateRequestSchema>;

/**
 * Generate a customized quote request template using AI
 */
export async function generateTemplate(
  request: TemplateRequest
): Promise<QuoteRequestTemplate> {
  try {
    const validatedRequest = templateRequestSchema.parse(request);
    
    const prompt = buildTemplatePrompt(validatedRequest);
    
    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getTemplateSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = extractJSON(responseContent);
    
    // Add metadata
    parsedResponse.metadata = {
      createdBy: 'ai_template_generator',
      lastUpdated: new Date().toISOString(),
      usage: {
        timesUsed: 0,
        averageRating: 0,
        successRate: 0
      }
    };

    return templateSchema.parse(parsedResponse);

  } catch (error) {
    console.error('Error generating template:', error);
    throw new Error(`Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple template variations
 */
export async function generateTemplateVariations(
  baseRequest: TemplateRequest,
  variationCount: number = 3
): Promise<QuoteRequestTemplate[]> {
  try {
    const variations = await Promise.all(
      Array.from({ length: variationCount }, (_, index) => {
        const variationRequest = {
          ...baseRequest,
          customInstructions: `${baseRequest.customInstructions || ''} Variation ${index + 1}: Focus on ${getVariationFocus(index)}`
        };
        return generateTemplate(variationRequest);
      })
    );

    return variations;

  } catch (error) {
    console.error('Error generating template variations:', error);
    throw new Error(`Failed to generate template variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Customize an existing template for specific opportunity
 */
export async function customizeTemplate(
  baseTemplate: QuoteRequestTemplate,
  opportunityData: {
    title: string;
    description: string;
    naicsCode?: string;
    estimatedValue?: string;
    requirements?: string[];
  }
): Promise<QuoteRequestTemplate> {
  try {
    const prompt = `
Customize this quote request template for a specific government contracting opportunity:

BASE TEMPLATE:
${JSON.stringify(baseTemplate, null, 2)}

OPPORTUNITY DATA:
Title: ${opportunityData.title}
Description: ${opportunityData.description}
NAICS Code: ${opportunityData.naicsCode || 'Not specified'}
Estimated Value: ${opportunityData.estimatedValue || 'Not specified'}
Specific Requirements: ${opportunityData.requirements?.join(', ') || 'None specified'}

Customize the template to better fit this specific opportunity. Modify sections, fields, requirements, and supplier criteria as needed.

Return the customized template in the same JSON format as the base template.
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in government procurement template customization. Adapt templates to specific opportunities while maintaining best practices.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const customizedTemplate = JSON.parse(responseContent);
    
    // Update metadata
    customizedTemplate.metadata = {
      ...baseTemplate.metadata,
      lastUpdated: new Date().toISOString(),
      customizedFor: opportunityData.title
    };

    return templateSchema.parse(customizedTemplate);

  } catch (error) {
    console.error('Error customizing template:', error);
    throw new Error(`Failed to customize template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate template recommendations based on past successful RFQs
 */
export async function recommendTemplates(
  opportunityContext: {
    type: string;
    industry?: string;
    naicsCode?: string;
    estimatedValue?: string;
  },
  pastSuccessfulRFQs?: Array<{
    title: string;
    industry: string;
    outcome: 'successful' | 'unsuccessful';
    responseRate: number;
  }>
): Promise<{
  recommendedTemplates: Array<{
    templateName: string;
    matchScore: number;
    reasons: string[];
    customizations: string[];
  }>;
  insights: {
    industryBestPractices: string[];
    commonSuccessFactors: string[];
    avoidancePatterns: string[];
  };
}> {
  try {
    const prompt = `
Analyze this opportunity context and recommend the best quote request template approach:

OPPORTUNITY CONTEXT:
Type: ${opportunityContext.type}
Industry: ${opportunityContext.industry || 'Not specified'}
NAICS Code: ${opportunityContext.naicsCode || 'Not specified'}
Estimated Value: ${opportunityContext.estimatedValue || 'Not specified'}

${pastSuccessfulRFQs ? `
PAST RFQ PERFORMANCE:
${pastSuccessfulRFQs.map(rfq => `
- ${rfq.title} (${rfq.industry}): ${rfq.outcome}, Response Rate: ${rfq.responseRate}%
`).join('')}
` : ''}

AVAILABLE TEMPLATE TYPES:
1. Standard IT Services Template - For technology procurement
2. Professional Services Template - For consulting and advisory services
3. Construction Services Template - For construction and facilities
4. Medical Equipment Template - For healthcare equipment and supplies
5. Research & Development Template - For R&D and innovation projects
6. Training Services Template - For education and training programs
7. Maintenance Services Template - For ongoing support and maintenance
8. Custom Requirements Template - For unique or complex procurements

Recommend the best template(s) and provide customization guidance.

Return recommendations in this JSON format:
{
  "recommendedTemplates": [
    {
      "templateName": "template name",
      "matchScore": 0.85,
      "reasons": ["reason 1", "reason 2"],
      "customizations": ["customization 1", "customization 2"]
    }
  ],
  "insights": {
    "industryBestPractices": ["practice 1", "practice 2"],
    "commonSuccessFactors": ["factor 1", "factor 2"],
    "avoidancePatterns": ["pattern 1", "pattern 2"]
  }
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in government procurement template selection and optimization. Provide data-driven recommendations based on best practices and historical performance.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error recommending templates:', error);
    throw new Error(`Failed to recommend templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and score a template for completeness and quality
 */
export async function validateTemplate(
  template: QuoteRequestTemplate
): Promise<{
  overallScore: number;
  completenessScore: number;
  clarityScore: number;
  complianceScore: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    recommendation: string;
  }>;
  improvements: string[];
}> {
  try {
    const prompt = `
Evaluate this quote request template for quality, completeness, and compliance with government procurement best practices:

TEMPLATE TO EVALUATE:
${JSON.stringify(template, null, 2)}

Assess the template across these dimensions:
1. Completeness - Are all necessary sections and fields included?
2. Clarity - Are instructions and requirements clear and unambiguous?
3. Compliance - Does it follow government procurement regulations and best practices?
4. Usability - Is it user-friendly and logical in structure?

Provide detailed feedback and recommendations for improvement.

Return evaluation in this JSON format:
{
  "overallScore": 85,
  "completenessScore": 90,
  "clarityScore": 80,
  "complianceScore": 85,
  "issues": [
    {
      "severity": "medium",
      "category": "clarity",
      "description": "issue description",
      "recommendation": "how to fix"
    }
  ],
  "improvements": ["improvement 1", "improvement 2"]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert government procurement compliance reviewer specializing in RFQ template evaluation and optimization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error validating template:', error);
    throw new Error(`Failed to validate template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions

function getTemplateSystemPrompt(): string {
  return `
You are an expert government procurement specialist with extensive experience in creating Request for Quotation (RFQ) templates. 

Your task is to generate professional, comprehensive, and compliant RFQ templates based on opportunity requirements.

Guidelines:
- Follow government procurement regulations and best practices
- Create clear, actionable sections and fields
- Include appropriate validation and requirements
- Structure templates logically for ease of use
- Ensure compliance with relevant NAICS codes and industry standards
- Include helpful placeholder text and instructions

Always return valid JSON in the specified template format.
`;
}

function buildTemplatePrompt(request: TemplateRequest): string {
  return `
Generate a comprehensive RFQ template for the following government contracting opportunity:

OPPORTUNITY DETAILS:
Type: ${request.opportunityType}
Industry: ${request.industry || 'Not specified'}
NAICS Code: ${request.naicsCode || 'Not specified'}
Contract Type: ${request.contractType || 'Not specified'}
Estimated Value: ${request.estimatedValue || 'Not specified'}
Complexity Level: ${request.complexity || 'intermediate'}

${request.specificRequirements ? `
Specific Requirements to Include:
${request.specificRequirements.join('\n')}
` : ''}

${request.customInstructions ? `
Custom Instructions:
${request.customInstructions}
` : ''}

Create a professional RFQ template with the following structure:
{
  "id": "unique_template_id",
  "name": "descriptive template name",
  "description": "template description and use case",
  "category": "category (e.g., IT Services, Professional Services)",
  "industry": "target industry",
  "complexity": "basic|intermediate|advanced",
  "estimatedTimeToComplete": 60,
  "sections": [
    {
      "title": "Section Title",
      "description": "Section description",
      "order": 1,
      "required": true,
      "fields": [
        {
          "name": "field_name",
          "type": "text|textarea|select|multiselect|date|number|checkbox",
          "label": "Field Label",
          "placeholder": "placeholder text",
          "required": true,
          "options": ["option1", "option2"],
          "validation": {
            "minLength": 10,
            "maxLength": 500
          }
        }
      ]
    }
  ],
  "defaultRequirements": [
    {
      "category": "Technical Requirements",
      "items": ["requirement 1", "requirement 2"]
    }
  ],
  "suggestedSupplierCriteria": {
    "naicsCodes": ["541511", "541512"],
    "certifications": ["Small Business", "GSA Schedule"],
    "capabilities": ["capability 1", "capability 2"]
  }
}
`;
}

function getVariationFocus(index: number): string {
  const focuses = [
    'simplified process and reduced complexity',
    'enhanced technical requirements and specifications',
    'comprehensive evaluation criteria and past performance focus'
  ];
  return focuses[index] || 'balanced approach';
}