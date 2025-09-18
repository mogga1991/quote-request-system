import { z } from 'zod';
import { convertAndCallClaude, extractJSON } from '@/lib/claude-helper';

// Validation schemas
const opportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  naicsCode: z.string().optional(),
  setAsideCode: z.string().optional(),
  estimatedValue: z.string().optional(),
  contractType: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
});

const generatedQuoteRequestSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  })),
  suggestedDeadline: z.number(), // days from now
  estimatedBudget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD')
  }).optional(),
  riskFactors: z.array(z.string()).optional(),
  successCriteria: z.array(z.string()).optional()
});

export type OpportunityData = z.infer<typeof opportunitySchema>;
export type GeneratedQuoteRequest = z.infer<typeof generatedQuoteRequestSchema>;

export interface AIGenerationOptions {
  includeDetailedRequirements?: boolean;
  includeBudgetEstimate?: boolean;
  includeRiskAssessment?: boolean;
  tone?: 'formal' | 'conversational' | 'technical';
  complexity?: 'basic' | 'intermediate' | 'advanced';
  customInstructions?: string;
}

/**
 * Generate a quote request using AI based on opportunity data
 */
export async function generateQuoteRequest(
  opportunity: OpportunityData,
  options: AIGenerationOptions = {}
): Promise<GeneratedQuoteRequest> {
  try {
    // Validate input
    const validatedOpportunity = opportunitySchema.parse(opportunity);
    
    // Build the prompt
    const prompt = buildGenerationPrompt(validatedOpportunity, options);
    
    // Call OpenAI API
    const responseContent = await convertAndCallClaude({
      model: 'claude-3-sonnet-20240229',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(options)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Parse and validate the response
    const parsedResponse = extractJSON(responseContent);
    const generatedQuoteRequest = generatedQuoteRequestSchema.parse(parsedResponse);

    return generatedQuoteRequest;

  } catch (error) {
    console.error('Error generating quote request:', error);
    throw new Error(`Failed to generate quote request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate supplier-specific requirements based on opportunity and supplier capabilities
 */
export async function generateSupplierRequirements(
  opportunity: OpportunityData,
  supplierCapabilities: string[],
  existingRequirements: Array<{ category: string; items: string[] }>
): Promise<Array<{ category: string; items: string[] }>> {
  try {
    const prompt = `
Based on this government opportunity and supplier capabilities, generate specific requirements that this supplier should address:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
NAICS Code: ${opportunity.naicsCode || 'Not specified'}
Contract Type: ${opportunity.contractType || 'Not specified'}

Supplier Capabilities: ${supplierCapabilities.join(', ')}

Existing Requirements:
${existingRequirements.map(req => `${req.category}: ${req.items.join(', ')}`).join('\n')}

Generate additional or refined requirements that are specific to this supplier's capabilities. Focus on:
1. Technical requirements that match their expertise
2. Performance metrics they should meet
3. Deliverables that align with their capabilities
4. Compliance requirements relevant to their services

Return as JSON in this format:
{
  "requirements": [
    {
      "category": "category name",
      "items": ["requirement 1", "requirement 2"]
    }
  ]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in government procurement and supplier evaluation. Generate specific, actionable requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude

    const parsedResponse = extractJSON(responseContent);
    return parsedResponse.requirements || [];

  } catch (error) {
    console.error('Error generating supplier requirements:', error);
    throw new Error(`Failed to generate supplier requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze opportunity text and extract key information
 */
export async function analyzeOpportunity(
  opportunityText: string
): Promise<{
  summary: string;
  keyRequirements: string[];
  suggestedNAICS: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  recommendedApproach: string;
  potentialChallenges: string[];
}> {
  try {
    const prompt = `
Analyze this government contracting opportunity and extract key information:

${opportunityText}

Provide analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary of the opportunity",
  "keyRequirements": ["requirement 1", "requirement 2", "requirement 3"],
  "suggestedNAICS": ["541511", "541512"],
  "estimatedComplexity": "low|medium|high",
  "recommendedApproach": "Recommended approach for responding to this opportunity",
  "potentialChallenges": ["challenge 1", "challenge 2"]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in government procurement analysis. Extract key information and provide strategic insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error analyzing opportunity:', error);
    throw new Error(`Failed to analyze opportunity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate contextual suggestions for improving quote requests
 */
export async function generateQuoteRequestSuggestions(
  quoteRequest: {
    title: string;
    description: string;
    requirements: Array<{ category: string; items: string[] }>;
  },
  opportunity: OpportunityData
): Promise<{
  titleSuggestions: string[];
  additionalRequirements: Array<{ category: string; items: string[] }>;
  improvementTips: string[];
  missingElements: string[];
}> {
  try {
    const prompt = `
Review this quote request for a government opportunity and provide suggestions for improvement:

Quote Request:
Title: ${quoteRequest.title}
Description: ${quoteRequest.description}
Requirements: ${JSON.stringify(quoteRequest.requirements, null, 2)}

Original Opportunity:
Title: ${opportunity.title}
Description: ${opportunity.description}
NAICS: ${opportunity.naicsCode || 'Not specified'}
Contract Type: ${opportunity.contractType || 'Not specified'}

Provide suggestions in this JSON format:
{
  "titleSuggestions": ["alternative title 1", "alternative title 2"],
  "additionalRequirements": [
    {
      "category": "category name",
      "items": ["requirement 1", "requirement 2"]
    }
  ],
  "improvementTips": ["tip 1", "tip 2"],
  "missingElements": ["missing element 1", "missing element 2"]
}
`;

    const responseContent = await convertAndCallClaude({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in government procurement and quote request optimization. Provide constructive suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    // Response content is already extracted by convertAndCallClaude

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions

function getSystemPrompt(options: AIGenerationOptions): string {
  const { tone = 'formal', complexity = 'intermediate' } = options;
  
  return `
You are an expert government procurement specialist with extensive experience in creating Request for Quotations (RFQs). 

Your task is to generate professional, comprehensive quote requests based on government contracting opportunities. 

Guidelines:
- Use ${tone} tone throughout
- Target ${complexity} level of detail
- Focus on clear, actionable requirements
- Include relevant government contracting terminology
- Ensure compliance with procurement best practices
- Structure requirements logically by category

Always return valid JSON in the specified format.
`;
}

function buildGenerationPrompt(
  opportunity: OpportunityData,
  options: AIGenerationOptions
): string {
  const {
    includeDetailedRequirements = true,
    includeBudgetEstimate = false,
    includeRiskAssessment = false,
    customInstructions = ''
  } = options;

  return `
Generate a comprehensive Request for Quotation (RFQ) based on this government contracting opportunity:

Opportunity Details:
- Title: ${opportunity.title}
- Description: ${opportunity.description}
- NAICS Code: ${opportunity.naicsCode || 'Not specified'}
- Set-Aside: ${opportunity.setAsideCode || 'Not specified'}
- Estimated Value: ${opportunity.estimatedValue || 'Not specified'}
- Contract Type: ${opportunity.contractType || 'Not specified'}
- Department: ${opportunity.department || 'Not specified'}
- Office: ${opportunity.office || 'Not specified'}

Requirements:
${includeDetailedRequirements ? '- Include detailed technical and performance requirements organized by category' : '- Include basic requirements'}
${includeBudgetEstimate ? '- Provide budget estimates based on the opportunity value' : ''}
${includeRiskAssessment ? '- Include risk factors and mitigation strategies' : ''}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Generate a professional RFQ with the following JSON structure:
{
  "title": "Professional RFQ title",
  "description": "Detailed description of what is being requested",
  "requirements": [
    {
      "category": "Technical Requirements",
      "items": ["specific requirement 1", "specific requirement 2"]
    },
    {
      "category": "Performance Requirements", 
      "items": ["performance metric 1", "performance metric 2"]
    }
  ],
  "suggestedDeadline": 14,
  ${includeBudgetEstimate ? '"estimatedBudget": { "min": 10000, "max": 50000, "currency": "USD" },' : ''}
  ${includeRiskAssessment ? '"riskFactors": ["risk 1", "risk 2"],' : ''}
  "successCriteria": ["success criterion 1", "success criterion 2"]
}
`;
}

/**
 * Validate AI service configuration
 */
export function validateAIConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY environment variable is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get AI service health status
 */
export async function getAIServiceHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    
    await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Health check' }],
      max_tokens: 10
    });

    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}