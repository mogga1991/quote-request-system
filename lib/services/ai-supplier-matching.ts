import OpenAI from 'openai';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { suppliers } from '@/db/schema';
import { and, or, ilike, inArray, sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const supplierMatchSchema = z.object({
  supplierId: z.string(),
  matchScore: z.number().min(0).max(1),
  matchReasons: z.array(z.string()),
  strengthsAlignment: z.array(z.object({
    requirement: z.string(),
    supplierCapability: z.string(),
    score: z.number().min(0).max(1)
  })),
  gapsIdentified: z.array(z.object({
    requirement: z.string(),
    gap: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    mitigation: z.string().optional()
  })),
  riskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    likelihood: z.enum(['low', 'medium', 'high'])
  })),
  recommendation: z.enum(['highly_recommended', 'recommended', 'consider', 'not_recommended']),
  estimatedFit: z.object({
    technical: z.number().min(0).max(1),
    experience: z.number().min(0).max(1),
    capacity: z.number().min(0).max(1),
    pricing: z.number().min(0).max(1)
  })
});

const matchingCriteriaSchema = z.object({
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
  pastPerformanceWeight: z.number().min(0).max(1).optional().default(0.3)
});

export type SupplierMatch = z.infer<typeof supplierMatchSchema>;
export type MatchingCriteria = z.infer<typeof matchingCriteriaSchema>;

export interface SupplierData {
  id: string;
  name: string;
  capabilities: string[];
  naicsCodes: string[];
  certifications: string[];
  pastPerformance: any[];
  rating: string;
  gsaSchedule: boolean;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}

/**
 * Find and rank suppliers based on opportunity requirements using AI
 */
export async function findMatchingSuppliers(
  criteria: MatchingCriteria,
  maxResults: number = 10
): Promise<SupplierMatch[]> {
  try {
    // Validate criteria
    const validatedCriteria = matchingCriteriaSchema.parse(criteria);
    
    // First, get potential suppliers from database using basic filters
    const candidateSuppliers = await getCandidateSuppliers(validatedCriteria);
    
    if (candidateSuppliers.length === 0) {
      return [];
    }

    // Use AI to perform detailed matching and scoring
    const matches = await Promise.all(
      candidateSuppliers.map(supplier => 
        evaluateSupplierMatch(supplier, validatedCriteria)
      )
    );

    // Sort by match score and return top results
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults);

  } catch (error) {
    console.error('Error finding matching suppliers:', error);
    throw new Error(`Failed to find matching suppliers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get candidate suppliers from database using basic filters
 */
async function getCandidateSuppliers(criteria: MatchingCriteria): Promise<SupplierData[]> {
  const filters = [];

  // Active suppliers only
  filters.push(sql`${suppliers.isActive} = true`);

  // NAICS code filter
  if (criteria.naicsCodes && criteria.naicsCodes.length > 0) {
    const naicsConditions = criteria.naicsCodes.map(code => 
      sql`${suppliers.naicsCodes}::text ILIKE ${'%' + code + '%'}`
    );
    filters.push(or(...naicsConditions));
  }

  // GSA Schedule requirement
  if (criteria.gsaScheduleRequired) {
    filters.push(sql`${suppliers.gsaSchedule} = true`);
  }

  // Minimum rating
  if (criteria.minimumRating) {
    filters.push(sql`CAST(${suppliers.rating} AS DECIMAL) >= ${criteria.minimumRating}`);
  }

  // Certification requirements
  if (criteria.certifications && criteria.certifications.length > 0) {
    const certConditions = criteria.certifications.map(cert =>
      sql`${suppliers.certifications}::text ILIKE ${'%' + cert + '%'}`
    );
    filters.push(or(...certConditions));
  }

  const results = await db
    .select()
    .from(suppliers)
    .where(and(...filters))
    .limit(50); // Limit to prevent overwhelming the AI

  return results.map(supplier => ({
    id: supplier.id,
    name: supplier.name,
    capabilities: supplier.capabilities || [],
    naicsCodes: supplier.naicsCodes || [],
    certifications: supplier.certifications || [],
    pastPerformance: supplier.pastPerformance || [],
    rating: supplier.rating || '0',
    gsaSchedule: supplier.gsaSchedule || false,
    contactEmail: supplier.contactEmail || '',
    contactPhone: supplier.contactPhone || '',
    isActive: supplier.isActive || false
  }));
}

/**
 * Use AI to evaluate how well a supplier matches the criteria
 */
async function evaluateSupplierMatch(
  supplier: SupplierData,
  criteria: MatchingCriteria
): Promise<SupplierMatch> {
  try {
    const prompt = `
Evaluate how well this supplier matches the given requirements for a government contracting opportunity:

SUPPLIER PROFILE:
Name: ${supplier.name}
Capabilities: ${supplier.capabilities.join(', ')}
NAICS Codes: ${supplier.naicsCodes.join(', ')}
Certifications: ${supplier.certifications.join(', ')}
Rating: ${supplier.rating}/5
GSA Schedule: ${supplier.gsaSchedule ? 'Yes' : 'No'}
Past Performance: ${JSON.stringify(supplier.pastPerformance, null, 2)}

OPPORTUNITY REQUIREMENTS:
${criteria.requirements.map(req => 
  `${req.category} (Weight: ${req.weight}): ${req.items.join(', ')}`
).join('\n')}

${criteria.naicsCodes ? `Required NAICS: ${criteria.naicsCodes.join(', ')}` : ''}
${criteria.certifications ? `Required Certifications: ${criteria.certifications.join(', ')}` : ''}
${criteria.gsaScheduleRequired ? 'GSA Schedule Required: Yes' : ''}
${criteria.minimumRating ? `Minimum Rating: ${criteria.minimumRating}/5` : ''}

Analyze the supplier's fit for this opportunity and provide a detailed evaluation.

Return analysis in this JSON format:
{
  "supplierId": "${supplier.id}",
  "matchScore": 0.85,
  "matchReasons": ["reason 1", "reason 2", "reason 3"],
  "strengthsAlignment": [
    {
      "requirement": "specific requirement",
      "supplierCapability": "matching capability",
      "score": 0.9
    }
  ],
  "gapsIdentified": [
    {
      "requirement": "requirement not fully met",
      "gap": "what's missing",
      "severity": "low|medium|high",
      "mitigation": "how to address this gap"
    }
  ],
  "riskFactors": [
    {
      "factor": "risk factor",
      "impact": "low|medium|high",
      "likelihood": "low|medium|high"
    }
  ],
  "recommendation": "highly_recommended|recommended|consider|not_recommended",
  "estimatedFit": {
    "technical": 0.8,
    "experience": 0.7,
    "capacity": 0.9,
    "pricing": 0.6
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert procurement analyst specializing in supplier evaluation and matching. Provide detailed, objective assessments based on capabilities alignment.'
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

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = JSON.parse(responseContent);
    return supplierMatchSchema.parse(parsedResponse);

  } catch (error) {
    console.error(`Error evaluating supplier ${supplier.id}:`, error);
    // Return a basic match if AI fails
    return {
      supplierId: supplier.id,
      matchScore: 0.5,
      matchReasons: ['Basic capability match'],
      strengthsAlignment: [],
      gapsIdentified: [],
      riskFactors: [],
      recommendation: 'consider',
      estimatedFit: {
        technical: 0.5,
        experience: 0.5,
        capacity: 0.5,
        pricing: 0.5
      }
    };
  }
}

/**
 * Generate supplier selection recommendations
 */
export async function generateSupplierSelectionStrategy(
  matches: SupplierMatch[],
  opportunityContext: {
    estimatedValue?: string;
    timeline?: string;
    riskTolerance?: 'low' | 'medium' | 'high';
    strategicImportance?: 'low' | 'medium' | 'high';
  }
): Promise<{
  recommendedSuppliers: string[];
  selectionStrategy: string;
  diversificationAdvice: string;
  riskMitigation: string[];
  negotiationInsights: Array<{
    supplierId: string;
    strengths: string[];
    leveragePoints: string[];
    concerns: string[];
  }>;
}> {
  try {
    const prompt = `
Analyze these supplier matches and provide a strategic supplier selection recommendation:

SUPPLIER MATCHES:
${matches.map(match => `
Supplier ID: ${match.supplierId}
Match Score: ${match.matchScore}
Recommendation: ${match.recommendation}
Technical Fit: ${match.estimatedFit.technical}
Experience Fit: ${match.estimatedFit.experience}
Gaps: ${match.gapsIdentified.map(g => g.gap).join(', ')}
Risk Factors: ${match.riskFactors.map(r => r.factor).join(', ')}
`).join('\n')}

OPPORTUNITY CONTEXT:
Estimated Value: ${opportunityContext.estimatedValue || 'Not specified'}
Timeline: ${opportunityContext.timeline || 'Not specified'}
Risk Tolerance: ${opportunityContext.riskTolerance || 'medium'}
Strategic Importance: ${opportunityContext.strategicImportance || 'medium'}

Provide strategic recommendations for supplier selection and engagement.

Return analysis in this JSON format:
{
  "recommendedSuppliers": ["supplier_id_1", "supplier_id_2"],
  "selectionStrategy": "recommended approach for supplier selection",
  "diversificationAdvice": "advice on supplier portfolio diversification",
  "riskMitigation": ["mitigation strategy 1", "mitigation strategy 2"],
  "negotiationInsights": [
    {
      "supplierId": "supplier_id",
      "strengths": ["strength 1", "strength 2"],
      "leveragePoints": ["leverage point 1", "leverage point 2"],
      "concerns": ["concern 1", "concern 2"]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic procurement expert specializing in supplier selection and negotiation strategy for government contracts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error generating selection strategy:', error);
    throw new Error(`Failed to generate selection strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze supplier market dynamics and competition
 */
export async function analyzeSupplierMarket(
  naicsCodes: string[],
  geographicScope?: string
): Promise<{
  marketOverview: string;
  competitionLevel: 'low' | 'medium' | 'high';
  pricingTrends: string;
  capacityInsights: string;
  emergingTrends: string[];
  recommendedApproach: string;
}> {
  try {
    // Get supplier data for market analysis
    const marketSuppliers = await db
      .select()
      .from(suppliers)
      .where(
        and(
          sql`${suppliers.isActive} = true`,
          or(...naicsCodes.map(code => 
            sql`${suppliers.naicsCodes}::text ILIKE ${'%' + code + '%'}`
          ))
        )
      )
      .limit(100);

    const prompt = `
Analyze the supplier market dynamics for these NAICS codes: ${naicsCodes.join(', ')}

MARKET DATA:
Total Active Suppliers: ${marketSuppliers.length}
Average Rating: ${calculateAverageRating(marketSuppliers)}
GSA Schedule Coverage: ${calculateGSAPercentage(marketSuppliers)}%
Geographic Scope: ${geographicScope || 'National'}

SUPPLIER BREAKDOWN:
${marketSuppliers.slice(0, 10).map(s => `
- ${s.name}: Rating ${s.rating}, GSA: ${s.gsaSchedule ? 'Yes' : 'No'}
  Capabilities: ${(s.capabilities || []).slice(0, 3).join(', ')}
`).join('')}

Provide market analysis and strategic insights.

Return analysis in this JSON format:
{
  "marketOverview": "comprehensive market overview",
  "competitionLevel": "low|medium|high",
  "pricingTrends": "pricing trend analysis",
  "capacityInsights": "market capacity insights",
  "emergingTrends": ["trend 1", "trend 2", "trend 3"],
  "recommendedApproach": "recommended procurement approach"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a market research expert specializing in government contracting supplier markets and procurement strategy.'
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

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error analyzing supplier market:', error);
    throw new Error(`Failed to analyze supplier market: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions
function calculateAverageRating(suppliers: any[]): string {
  const validRatings = suppliers
    .map(s => parseFloat(s.rating || '0'))
    .filter(r => !isNaN(r) && r > 0);
  
  if (validRatings.length === 0) return '0.0';
  
  const average = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
  return average.toFixed(1);
}

function calculateGSAPercentage(suppliers: any[]): number {
  if (suppliers.length === 0) return 0;
  
  const gsaSuppliers = suppliers.filter(s => s.gsaSchedule).length;
  return Math.round((gsaSuppliers / suppliers.length) * 100);
}