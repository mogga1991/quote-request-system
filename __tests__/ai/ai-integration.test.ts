import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateQuoteRequest,
  generateQuoteRequestSuggestions,
  analyzeOpportunity
} from '@/lib/services/ai-quote-generation';
import {
  extractRequirements,
  classifyOpportunity,
  analyzeBidDecision
} from '@/lib/services/opportunity-analysis';
import {
  findMatchingSuppliers,
  generateSupplierSelectionStrategy
} from '@/lib/services/ai-supplier-matching';
import {
  generateTemplate,
  recommendTemplates
} from '@/lib/services/ai-template-generation';
import {
  validateQuoteRequest,
  validateSupplierResponse
} from '@/lib/services/ai-validation';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

// Mock database
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    })
  }
}));

describe('AI Integration Tests', () => {
  const mockOpenAIResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          title: 'AI Generated Quote Request',
          description: 'Comprehensive quote request for IT services',
          requirements: [
            {
              category: 'Technical Requirements',
              items: ['Cloud infrastructure setup', 'Security compliance']
            }
          ],
          suggestedDeadline: 14,
          successCriteria: ['On-time delivery', 'Quality assurance']
        })
      }
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock response
    const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse);
    vi.doMock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))
    }));
  });

  describe('Quote Request Generation', () => {
    it('should generate quote request from opportunity data', async () => {
      const opportunityData = {
        title: 'IT Support Services',
        description: 'Comprehensive IT support for federal agency',
        naicsCode: '541511',
        estimatedValue: '$100,000',
        contractType: 'Firm Fixed Price',
        department: 'Department of Defense'
      };

      const result = await generateQuoteRequest(opportunityData);

      expect(result).toBeDefined();
      expect(result.title).toBe('AI Generated Quote Request');
      expect(result.description).toBe('Comprehensive quote request for IT services');
      expect(result.requirements).toHaveLength(1);
      expect(result.requirements[0].category).toBe('Technical Requirements');
      expect(result.suggestedDeadline).toBe(14);
    });

    it('should handle AI generation options', async () => {
      const opportunityData = {
        title: 'Cybersecurity Assessment',
        description: 'Security evaluation and penetration testing',
        naicsCode: '541512'
      };

      const options = {
        includeDetailedRequirements: true,
        includeBudgetEstimate: true,
        tone: 'technical' as const,
        complexity: 'advanced' as const
      };

      const result = await generateQuoteRequest(opportunityData, options);

      expect(result).toBeDefined();
      expect(result.title).toContain('AI Generated');
    });

    it('should generate suggestions for existing quote requests', async () => {
      const mockSuggestionsResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              titleSuggestions: ['Alternative Title 1', 'Alternative Title 2'],
              additionalRequirements: [{
                category: 'Performance Requirements',
                items: ['Response time < 4 hours', 'Uptime > 99.5%']
              }],
              improvementTips: ['Be more specific about deliverables'],
              missingElements: ['Evaluation criteria']
            })
          }
        }]
      };

      // Mock specific response for suggestions
      const mockCreate = vi.fn().mockResolvedValue(mockSuggestionsResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const quoteRequest = {
        title: 'Basic IT Support',
        description: 'Need IT support',
        requirements: [{
          category: 'Basic',
          items: ['Help desk']
        }]
      };

      const opportunity = {
        title: 'IT Support Services',
        description: 'Comprehensive IT support',
        naicsCode: '541511'
      };

      const suggestions = await generateQuoteRequestSuggestions(quoteRequest, opportunity);

      expect(suggestions.titleSuggestions).toHaveLength(2);
      expect(suggestions.additionalRequirements).toHaveLength(1);
      expect(suggestions.improvementTips).toContain('Be more specific about deliverables');
    });
  });

  describe('Opportunity Analysis', () => {
    it('should extract requirements from opportunity text', async () => {
      const mockRequirementsResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalRequirements: [{
                requirement: 'Cloud-based solution',
                priority: 'high',
                category: 'Infrastructure',
                compliance: true
              }],
              performanceRequirements: [{
                metric: 'Response Time',
                target: '< 2 seconds',
                measurement: 'Average response time during peak hours'
              }],
              deliverables: [{
                item: 'System documentation',
                deadline: 'Within 30 days',
                format: 'PDF'
              }],
              qualifications: [{
                requirement: 'Security clearance',
                type: 'clearance',
                mandatory: true
              }],
              complianceRequirements: ['SOC 2 compliance', 'FISMA certification'],
              estimatedScope: {
                duration: '6 months',
                teamSize: '3-5 people',
                complexity: 'medium',
                budget: {
                  range: '$50,000 - $150,000',
                  confidence: 'medium'
                }
              }
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockRequirementsResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const opportunityText = `
        The Department of Defense requires a cloud-based IT support solution 
        with 24/7 monitoring, response time under 2 seconds, and SOC 2 compliance.
        Security clearance required for all personnel.
      `;

      const requirements = await extractRequirements(opportunityText);

      expect(requirements.technicalRequirements).toHaveLength(1);
      expect(requirements.technicalRequirements[0].requirement).toBe('Cloud-based solution');
      expect(requirements.performanceRequirements).toHaveLength(1);
      expect(requirements.deliverables).toHaveLength(1);
      expect(requirements.estimatedScope.complexity).toBe('medium');
    });

    it('should classify opportunities correctly', async () => {
      const mockClassificationResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              primaryCategory: 'IT Services',
              subcategories: ['Cloud Services', 'System Administration'],
              industryVertical: 'Government',
              serviceType: 'services',
              contractVehicle: 'GSA Schedule',
              competitionLevel: 'high',
              strategicImportance: 'medium',
              riskLevel: 'low'
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockClassificationResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const opportunityText = 'IT infrastructure services for government agency';
      const classification = await classifyOpportunity(opportunityText);

      expect(classification.primaryCategory).toBe('IT Services');
      expect(classification.industryVertical).toBe('Government');
      expect(classification.competitionLevel).toBe('high');
    });

    it('should perform bid decision analysis', async () => {
      const mockBidAnalysisResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              recommendation: 'pursue',
              confidence: 0.8,
              strengths: ['Strong technical capabilities', 'Relevant experience'],
              weaknesses: ['Limited government contracting experience'],
              opportunities: ['Growing market segment'],
              threats: ['Strong competition'],
              requiredCapabilities: ['Cloud expertise', 'Security clearance'],
              estimatedWinProbability: 0.65,
              resourceRequirements: {
                timeInvestment: '40 hours for proposal',
                teamSize: 3,
                budgetNeeded: '$15,000 for proposal development',
                keyPersonnel: ['Technical lead', 'Project manager']
              },
              competitiveFactors: ['Technical innovation', 'Cost competitiveness'],
              nextSteps: ['Conduct capability assessment', 'Develop pricing strategy']
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockBidAnalysisResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const opportunityText = 'Cloud migration services for federal agency';
      const companyProfile = {
        capabilities: ['Cloud migration', 'AWS', 'Security'],
        pastPerformance: ['Successfully migrated 5 enterprise systems'],
        teamSize: 25,
        certifications: ['AWS Partner', 'ISO 27001'],
        strengths: ['Technical expertise', 'Industry experience'],
        weaknesses: ['Small team size']
      };

      const analysis = await analyzeBidDecision(opportunityText, companyProfile);

      expect(analysis.recommendation).toBe('pursue');
      expect(analysis.confidence).toBe(0.8);
      expect(analysis.estimatedWinProbability).toBe(0.65);
      expect(analysis.resourceRequirements.teamSize).toBe(3);
    });
  });

  describe('Supplier Matching', () => {
    it('should find matching suppliers', async () => {
      // Mock database response
      const mockSuppliers = [
        {
          id: 'supplier1',
          name: 'TechFlow Solutions',
          capabilities: ['IT Support', 'Cloud Services'],
          naicsCodes: ['541511'],
          certifications: ['Small Business'],
          pastPerformance: [],
          rating: '4.5',
          gsaSchedule: true,
          contactEmail: 'contact@techflow.com',
          contactPhone: '555-0123',
          isActive: true
        }
      ];

      vi.doMock('@/db/drizzle', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockSuppliers)
              })
            })
          })
        }
      }));

      const mockMatchResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              supplierId: 'supplier1',
              matchScore: 0.85,
              matchReasons: ['Strong IT capabilities', 'GSA Schedule holder'],
              strengthsAlignment: [{
                requirement: 'IT Support Services',
                supplierCapability: 'IT Support',
                score: 0.9
              }],
              gapsIdentified: [],
              riskFactors: [],
              recommendation: 'highly_recommended',
              estimatedFit: {
                technical: 0.9,
                experience: 0.8,
                capacity: 0.85,
                pricing: 0.8
              }
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockMatchResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const criteria = {
        requirements: [{
          category: 'Technical',
          items: ['IT Support Services', 'Cloud Migration'],
          weight: 1
        }],
        naicsCodes: ['541511'],
        gsaScheduleRequired: true
      };

      const matches = await findMatchingSuppliers(criteria, 5);

      expect(matches).toHaveLength(1);
      expect(matches[0].supplierId).toBe('supplier1');
      expect(matches[0].matchScore).toBe(0.85);
      expect(matches[0].recommendation).toBe('highly_recommended');
    });
  });

  describe('Template Generation', () => {
    it('should generate RFQ templates', async () => {
      const mockTemplateResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              id: 'template_001',
              name: 'IT Services RFQ Template',
              description: 'Template for IT service procurements',
              category: 'IT Services',
              industry: 'Government',
              complexity: 'intermediate',
              estimatedTimeToComplete: 60,
              sections: [{
                title: 'Technical Requirements',
                description: 'Specify technical requirements and specifications',
                order: 1,
                required: true,
                fields: [{
                  name: 'technical_specs',
                  type: 'textarea',
                  label: 'Technical Specifications',
                  placeholder: 'Describe detailed technical requirements...',
                  required: true,
                  validation: {
                    minLength: 50,
                    maxLength: 2000
                  }
                }]
              }],
              defaultRequirements: [{
                category: 'Technical Requirements',
                items: ['System specifications', 'Performance criteria']
              }],
              suggestedSupplierCriteria: {
                naicsCodes: ['541511'],
                certifications: ['GSA Schedule'],
                capabilities: ['IT Services', 'System Integration']
              }
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockTemplateResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const templateRequest = {
        opportunityType: 'IT Services',
        industry: 'Government',
        naicsCode: '541511',
        complexity: 'intermediate' as const
      };

      const template = await generateTemplate(templateRequest);

      expect(template.id).toBe('template_001');
      expect(template.name).toBe('IT Services RFQ Template');
      expect(template.complexity).toBe('intermediate');
      expect(template.sections).toHaveLength(1);
      expect(template.sections[0].fields).toHaveLength(1);
    });

    it('should recommend templates based on context', async () => {
      const mockRecommendationResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              recommendedTemplates: [{
                templateName: 'Professional Services Template',
                matchScore: 0.9,
                reasons: ['Perfect fit for consulting services', 'Includes required compliance sections'],
                customizations: ['Add security clearance requirements', 'Include past performance criteria']
              }],
              insights: {
                industryBestPractices: ['Include detailed SOW', 'Define clear deliverables'],
                commonSuccessFactors: ['Clear requirements', 'Realistic timelines'],
                avoidancePatterns: ['Overly restrictive criteria', 'Unclear evaluation methods']
              }
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockRecommendationResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const context = {
        type: 'Professional Services',
        industry: 'Government',
        naicsCode: '541611'
      };

      const recommendations = await recommendTemplates(context);

      expect(recommendations.recommendedTemplates).toHaveLength(1);
      expect(recommendations.recommendedTemplates[0].matchScore).toBe(0.9);
      expect(recommendations.insights.industryBestPractices).toContain('Include detailed SOW');
    });
  });

  describe('Validation Services', () => {
    it('should validate quote requests', async () => {
      const mockValidationResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallScore: 85,
              passesValidation: true,
              criticalIssues: [],
              qualityMetrics: {
                completeness: 90,
                clarity: 85,
                compliance: 80,
                consistency: 88,
                professionalism: 92
              },
              complianceChecks: {
                hasRequiredSections: true,
                hasEvaluationCriteria: true,
                hasDeadlines: true,
                hasContactInfo: true,
                followsGovStandards: true,
                hasAccessibilityCompliance: false
              },
              improvements: [{
                category: 'accessibility',
                description: 'Add accessibility compliance requirements',
                priority: 'medium',
                estimatedImpact: 'Ensures inclusive procurement',
                implementationEffort: 'low'
              }],
              readabilityAnalysis: {
                readingLevel: 'College level',
                avgSentenceLength: 18.5,
                complexWords: 15,
                recommendedChanges: ['Simplify technical jargon']
              },
              riskAssessment: {
                ambiguityRisk: 'low',
                legalRisk: 'low',
                responseRisk: 'low',
                mitigationStrategies: ['Add FAQ section']
              }
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockValidationResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const quoteRequest = {
        title: 'IT Support Services RFQ',
        description: 'Comprehensive IT support for federal agency',
        requirements: [{
          category: 'Technical',
          items: ['24/7 help desk', 'System monitoring']
        }],
        deadline: new Date('2024-12-31')
      };

      const validation = await validateQuoteRequest(quoteRequest);

      expect(validation.overallScore).toBe(85);
      expect(validation.passesValidation).toBe(true);
      expect(validation.qualityMetrics.completeness).toBe(90);
      expect(validation.complianceChecks.hasRequiredSections).toBe(true);
    });

    it('should validate supplier responses', async () => {
      const mockResponseValidationResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              isValid: true,
              validationScore: 88,
              completenessCheck: {
                hasAllRequiredFields: true,
                missingFields: [],
                completenessPercentage: 95
              },
              pricingValidation: {
                calculationsCorrect: true,
                pricingReasonable: true,
                totalsMatch: true,
                pricingIssues: []
              },
              complianceValidation: {
                meetsRequirements: true,
                complianceGaps: [],
                riskFactors: []
              },
              qualityIndicators: {
                professionalPresentation: 85,
                technicalDetail: 90,
                experienceRelevance: 85
              }
            })
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponseValidationResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const response = {
        lineItems: [{
          item: 'Help Desk Support',
          quantity: 1,
          unitPriceCents: 500000, // $5,000
          totalCents: 500000
        }],
        totalPriceCents: 500000,
        deliveryTimeDays: 30,
        notes: 'Experienced team with government contracting background'
      };

      const requirements = [{
        category: 'Service Requirements',
        items: ['24/7 help desk support', 'Response time < 4 hours']
      }];

      const validation = await validateSupplierResponse(response, requirements);

      expect(validation.isValid).toBe(true);
      expect(validation.validationScore).toBe(88);
      expect(validation.completenessCheck.hasAllRequiredFields).toBe(true);
      expect(validation.pricingValidation.calculationsCorrect).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('API rate limit exceeded'));
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const opportunityData = {
        title: 'Test Opportunity',
        description: 'Test description'
      };

      await expect(generateQuoteRequest(opportunityData)).rejects.toThrow('Failed to generate quote request');
    });

    it('should handle invalid JSON responses', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const opportunityData = {
        title: 'Test Opportunity',
        description: 'Test description'
      };

      await expect(generateQuoteRequest(opportunityData)).rejects.toThrow();
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should handle concurrent AI requests', async () => {
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse);
      vi.doMock('openai', () => ({
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      }));

      const opportunityData = {
        title: 'Concurrent Test',
        description: 'Testing concurrent requests'
      };

      // Run multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        generateQuoteRequest(opportunityData)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.title).toBe('AI Generated Quote Request');
      });
    });
  });
});