import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const requirementExtractionSchema = z.object({
  technicalRequirements: z.array(z.object({
    requirement: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.string(),
    compliance: z.boolean().optional()
  })),
  performanceRequirements: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    measurement: z.string()
  })),
  deliverables: z.array(z.object({
    item: z.string(),
    deadline: z.string().optional(),
    format: z.string().optional()
  })),
  qualifications: z.array(z.object({
    requirement: z.string(),
    type: z.enum(['education', 'experience', 'certification', 'clearance']),
    mandatory: z.boolean()
  })),
  complianceRequirements: z.array(z.string()),
  estimatedScope: z.object({
    duration: z.string(),
    teamSize: z.string(),
    complexity: z.enum(['low', 'medium', 'high']),
    budget: z.object({
      range: z.string(),
      confidence: z.enum(['low', 'medium', 'high'])
    }).optional()
  })
});

const opportunityClassificationSchema = z.object({
  primaryCategory: z.string(),
  subcategories: z.array(z.string()),
  industryVertical: z.string(),
  serviceType: z.enum(['products', 'services', 'both']),
  contractVehicle: z.string(),
  competitionLevel: z.enum(['low', 'medium', 'high']),
  strategicImportance: z.enum(['low', 'medium', 'high']),
  riskLevel: z.enum(['low', 'medium', 'high'])
});

const bidDecisionAnalysisSchema = z.object({
  recommendation: z.enum(['pursue', 'consider', 'skip']),
  confidence: z.number().min(0).max(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  requiredCapabilities: z.array(z.string()),
  estimatedWinProbability: z.number().min(0).max(1),
  resourceRequirements: z.object({
    timeInvestment: z.string(),
    teamSize: z.number(),
    budgetNeeded: z.string(),
    keyPersonnel: z.array(z.string())
  }),
  competitiveFactors: z.array(z.string()),
  nextSteps: z.array(z.string())
});

export type RequirementExtraction = z.infer<typeof requirementExtractionSchema>;
export type OpportunityClassification = z.infer<typeof opportunityClassificationSchema>;
export type BidDecisionAnalysis = z.infer<typeof bidDecisionAnalysisSchema>;

/**
 * Extract detailed requirements from opportunity text
 */
export async function extractRequirements(
  opportunityText: string,
  context?: {
    naicsCode?: string;
    contractType?: string;
    estimatedValue?: string;
  }
): Promise<RequirementExtraction> {
  try {
    const prompt = `
Analyze this government contracting opportunity and extract detailed requirements:

Opportunity Text:
${opportunityText}

${context ? `
Additional Context:
- NAICS Code: ${context.naicsCode || 'Not specified'}
- Contract Type: ${context.contractType || 'Not specified'}
- Estimated Value: ${context.estimatedValue || 'Not specified'}
` : ''}

Extract and categorize all requirements found in the text. Be specific and actionable.

Return the analysis in this JSON format:
{
  "technicalRequirements": [
    {
      "requirement": "specific technical requirement",
      "priority": "high|medium|low",
      "category": "technology category",
      "compliance": true/false
    }
  ],
  "performanceRequirements": [
    {
      "metric": "performance metric name",
      "target": "target value or description",
      "measurement": "how it will be measured"
    }
  ],
  "deliverables": [
    {
      "item": "deliverable name",
      "deadline": "when it's due",
      "format": "expected format"
    }
  ],
  "qualifications": [
    {
      "requirement": "qualification requirement",
      "type": "education|experience|certification|clearance",
      "mandatory": true/false
    }
  ],
  "complianceRequirements": ["compliance requirement 1", "compliance requirement 2"],
  "estimatedScope": {
    "duration": "estimated project duration",
    "teamSize": "estimated team size needed",
    "complexity": "low|medium|high",
    "budget": {
      "range": "estimated budget range",
      "confidence": "low|medium|high"
    }
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert government contracting analyst specializing in requirement extraction and analysis. Extract detailed, actionable requirements from opportunity descriptions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = JSON.parse(responseContent);
    return requirementExtractionSchema.parse(parsedResponse);

  } catch (error) {
    console.error('Error extracting requirements:', error);
    throw new Error(`Failed to extract requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Classify and categorize opportunity
 */
export async function classifyOpportunity(
  opportunityText: string,
  metadata?: {
    naicsCode?: string;
    setAsideCode?: string;
    department?: string;
    estimatedValue?: string;
  }
): Promise<OpportunityClassification> {
  try {
    const prompt = `
Classify this government contracting opportunity into relevant categories:

Opportunity Text:
${opportunityText}

${metadata ? `
Metadata:
- NAICS Code: ${metadata.naicsCode || 'Not specified'}
- Set-Aside: ${metadata.setAsideCode || 'Not specified'}
- Department: ${metadata.department || 'Not specified'}
- Estimated Value: ${metadata.estimatedValue || 'Not specified'}
` : ''}

Analyze and classify this opportunity across multiple dimensions.

Return the classification in this JSON format:
{
  "primaryCategory": "main category (e.g., IT Services, Professional Services, Construction)",
  "subcategories": ["subcategory 1", "subcategory 2"],
  "industryVertical": "industry vertical (e.g., Healthcare, Defense, Education)",
  "serviceType": "products|services|both",
  "contractVehicle": "contract vehicle type",
  "competitionLevel": "low|medium|high",
  "strategicImportance": "low|medium|high",
  "riskLevel": "low|medium|high"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in government contracting classification and market analysis. Classify opportunities accurately across multiple dimensions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = JSON.parse(responseContent);
    return opportunityClassificationSchema.parse(parsedResponse);

  } catch (error) {
    console.error('Error classifying opportunity:', error);
    throw new Error(`Failed to classify opportunity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Perform bid/no-bid decision analysis
 */
export async function analyzeBidDecision(
  opportunityText: string,
  companyProfile: {
    capabilities: string[];
    pastPerformance: string[];
    teamSize: number;
    certifications: string[];
    strengths: string[];
    weaknesses: string[];
  },
  context?: {
    naicsCode?: string;
    estimatedValue?: string;
    deadline?: string;
  }
): Promise<BidDecisionAnalysis> {
  try {
    const prompt = `
Perform a bid/no-bid analysis for this government contracting opportunity:

Opportunity:
${opportunityText}

Company Profile:
- Capabilities: ${companyProfile.capabilities.join(', ')}
- Past Performance: ${companyProfile.pastPerformance.join(', ')}
- Team Size: ${companyProfile.teamSize}
- Certifications: ${companyProfile.certifications.join(', ')}
- Company Strengths: ${companyProfile.strengths.join(', ')}
- Company Weaknesses: ${companyProfile.weaknesses.join(', ')}

${context ? `
Opportunity Context:
- NAICS Code: ${context.naicsCode || 'Not specified'}
- Estimated Value: ${context.estimatedValue || 'Not specified'}
- Deadline: ${context.deadline || 'Not specified'}
` : ''}

Provide a comprehensive bid/no-bid recommendation with detailed analysis.

Return the analysis in this JSON format:
{
  "recommendation": "pursue|consider|skip",
  "confidence": 0.85,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "threats": ["threat 1", "threat 2"],
  "requiredCapabilities": ["capability 1", "capability 2"],
  "estimatedWinProbability": 0.65,
  "resourceRequirements": {
    "timeInvestment": "time needed for proposal",
    "teamSize": 5,
    "budgetNeeded": "budget estimate",
    "keyPersonnel": ["role 1", "role 2"]
  },
  "competitiveFactors": ["factor 1", "factor 2"],
  "nextSteps": ["step 1", "step 2"]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business development analyst specializing in government contracting bid decisions. Provide strategic, data-driven recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    const parsedResponse = JSON.parse(responseContent);
    return bidDecisionAnalysisSchema.parse(parsedResponse);

  } catch (error) {
    console.error('Error analyzing bid decision:', error);
    throw new Error(`Failed to analyze bid decision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate competitive intelligence insights
 */
export async function generateCompetitiveIntelligence(
  opportunityText: string,
  knownCompetitors: string[] = []
): Promise<{
  likelyCompetitors: string[];
  competitiveAdvantages: string[];
  differentiationStrategies: string[];
  pricingInsights: {
    estimatedRange: string;
    factors: string[];
    strategy: string;
  };
  winStrategy: string[];
}> {
  try {
    const prompt = `
Analyze this government contracting opportunity for competitive intelligence:

Opportunity:
${opportunityText}

${knownCompetitors.length > 0 ? `Known Competitors: ${knownCompetitors.join(', ')}` : ''}

Provide competitive intelligence and strategic insights.

Return analysis in this JSON format:
{
  "likelyCompetitors": ["competitor type 1", "competitor type 2"],
  "competitiveAdvantages": ["advantage 1", "advantage 2"],
  "differentiationStrategies": ["strategy 1", "strategy 2"],
  "pricingInsights": {
    "estimatedRange": "price range estimate",
    "factors": ["pricing factor 1", "pricing factor 2"],
    "strategy": "recommended pricing strategy"
  },
  "winStrategy": ["win strategy 1", "win strategy 2"]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a competitive intelligence expert specializing in government contracting markets. Provide strategic insights for winning contracts.'
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
    console.error('Error generating competitive intelligence:', error);
    throw new Error(`Failed to generate competitive intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract key dates and deadlines
 */
export async function extractKeyDates(
  opportunityText: string
): Promise<{
  submissionDeadline?: string;
  questionDeadline?: string;
  sitVisitDate?: string;
  awardDate?: string;
  performancePeriod?: {
    start: string;
    end: string;
  };
  otherImportantDates: Array<{
    date: string;
    description: string;
    type: string;
  }>;
}> {
  try {
    const prompt = `
Extract all dates and deadlines from this government contracting opportunity:

${opportunityText}

Find and extract all dates mentioned in the text, categorizing them appropriately.

Return in this JSON format:
{
  "submissionDeadline": "proposal submission deadline",
  "questionDeadline": "deadline for questions",
  "sitVisitDate": "site visit date if mentioned",
  "awardDate": "expected award date",
  "performancePeriod": {
    "start": "performance start date",
    "end": "performance end date"
  },
  "otherImportantDates": [
    {
      "date": "date string",
      "description": "what happens on this date",
      "type": "type of date"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting dates and deadlines from government contracting documents. Be precise and thorough.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI service');
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error('Error extracting key dates:', error);
    throw new Error(`Failed to extract key dates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}