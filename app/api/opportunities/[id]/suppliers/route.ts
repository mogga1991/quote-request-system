import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { SamGovService } from '@/lib/services/sam-gov';
import { SupplierMatchingService } from '@/lib/services/supplier-matching';
import { db } from '@/db/drizzle';
import { opportunities, opportunityAnalysis } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const opportunityId = params.id;
    const userId = result.session.userId;

    // Check if we have existing analysis for this opportunity and user
    const existingAnalysis = await db
      .select()
      .from(opportunityAnalysis)
      .where(
        and(
          eq(opportunityAnalysis.opportunityId, opportunityId),
          eq(opportunityAnalysis.userId, userId)
        )
      )
      .limit(1);

    if (existingAnalysis.length > 0) {
      const analysis = existingAnalysis[0];
      return NextResponse.json({
        opportunityId,
        matchedSuppliers: analysis.matchedSuppliers || [],
        estimatedPricing: analysis.estimatedPricing || [],
        complianceChecklist: analysis.complianceChecklist || [],
        riskAssessment: analysis.riskAssessment || {},
        recommendations: analysis.recommendations || [],
        analysisDate: analysis.createdAt,
        source: 'cached',
      });
    }

    // Get opportunity details
    let opportunity;
    
    // First try to get from database
    const dbOpportunity = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.noticeId, opportunityId))
      .limit(1);

    if (dbOpportunity.length > 0) {
      const opp = dbOpportunity[0];
      opportunity = {
        noticeId: opp.noticeId,
        title: opp.title,
        department: opp.department,
        office: opp.office,
        postedDate: opp.postedDate.toISOString(),
        responseDeadline: opp.responseDeadline.toISOString(),
        naicsCode: opp.naicsCode,
        setAsideCode: opp.setAsideCode,
        classificationCode: opp.classificationCode,
        description: opp.description,
        solicitationNumber: opp.solicitationNumber,
        contactEmail: opp.contactEmail,
        contactPhone: opp.contactPhone,
        place: opp.place,
        additionalInfo: opp.additionalInfo,
        link: opp.link,
        estimatedValue: opp.estimatedValue ? parseFloat(opp.estimatedValue) : undefined,
        contractType: opp.contractType,
      };
    } else {
      // Fallback to SAM.gov API
      const samGovService = new SamGovService();
      opportunity = await samGovService.getOpportunityDetails(opportunityId);
      
      if (!opportunity) {
        return NextResponse.json(
          { error: 'Opportunity not found' },
          { status: 404 }
        );
      }
    }

    // Perform supplier matching analysis
    const supplierMatchingService = new SupplierMatchingService();
    const matchedSuppliers = await supplierMatchingService.findMatchingSuppliers(
      opportunity,
      userId,
      15
    );

    const estimatedPricing = await supplierMatchingService.generatePricingEstimates(
      opportunity
    );

    // Generate compliance checklist based on opportunity requirements
    const complianceChecklist = generateComplianceChecklist(opportunity);

    // Generate risk assessment
    const riskAssessment = generateRiskAssessment(opportunity, matchedSuppliers);

    // Generate recommendations
    const recommendations = generateRecommendations(opportunity, matchedSuppliers);

    // Store analysis in database for future reference
    try {
      await db.insert(opportunityAnalysis).values({
        id: nanoid(),
        opportunityId,
        userId,
        analysisData: {
          opportunity,
          analysisTimestamp: new Date().toISOString(),
        },
        matchedSuppliers,
        estimatedPricing,
        complianceChecklist,
        riskAssessment,
        recommendations,
      });
    } catch (error) {
      console.error('Error storing opportunity analysis:', error);
      // Continue even if storage fails
    }

    return NextResponse.json({
      opportunityId,
      opportunity,
      matchedSuppliers,
      estimatedPricing,
      complianceChecklist,
      riskAssessment,
      recommendations,
      analysisDate: new Date().toISOString(),
      source: 'fresh',
    });
  } catch (error) {
    console.error('Error analyzing opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to analyze opportunity' },
      { status: 500 }
    );
  }
}

function generateComplianceChecklist(opportunity: any) {
  const checklist = [];

  // Basic federal contract requirements
  checklist.push({
    category: 'Basic Requirements',
    items: [
      { requirement: 'Active SAM.gov registration', required: true, notes: 'Must be registered and active in SAM.gov' },
      { requirement: 'DUNS number', required: true, notes: 'Valid DUNS number required for federal contracting' },
      { requirement: 'Valid CAGE code', required: true, notes: 'Commercial and Government Entity code' },
    ],
  });

  // Set-aside specific requirements
  if (opportunity.setAsideCode) {
    const setAsideItems = [];
    
    switch (opportunity.setAsideCode) {
      case 'SBA':
        setAsideItems.push(
          { requirement: 'Small Business certification', required: true, notes: 'SBA size standard compliance' },
          { requirement: 'Small business size certification', required: true, notes: 'Meet size standards for NAICS code' }
        );
        break;
      case 'SDVOSB':
        setAsideItems.push(
          { requirement: 'Service-Disabled Veteran-Owned certification', required: true, notes: 'VA verification required' },
          { requirement: 'Veteran disability documentation', required: true, notes: 'Service-connected disability proof' }
        );
        break;
      case 'WOSB':
        setAsideItems.push(
          { requirement: 'Women-Owned Small Business certification', required: true, notes: 'SBA WOSB certification' },
          { requirement: 'Women ownership documentation', required: true, notes: 'Proof of 51% women ownership' }
        );
        break;
    }
    
    if (setAsideItems.length > 0) {
      checklist.push({
        category: `Set-Aside Requirements (${opportunity.setAsideCode})`,
        items: setAsideItems,
      });
    }
  }

  // Industry-specific requirements
  if (opportunity.naicsCode) {
    const industryItems = [];
    
    if (opportunity.naicsCode.startsWith('541')) {
      industryItems.push(
        { requirement: 'Professional liability insurance', required: true, notes: 'Minimum coverage as specified' },
        { requirement: 'Professional certifications', required: false, notes: 'Industry-specific certifications preferred' }
      );
    }
    
    if (opportunity.naicsCode.startsWith('5415')) {
      industryItems.push(
        { requirement: 'Security clearance capability', required: false, notes: 'May be required for classified work' },
        { requirement: 'IT security compliance', required: true, notes: 'FISMA, NIST frameworks' }
      );
    }
    
    if (industryItems.length > 0) {
      checklist.push({
        category: 'Industry-Specific Requirements',
        items: industryItems,
      });
    }
  }

  // Standard compliance items
  checklist.push({
    category: 'Standard Compliance',
    items: [
      { requirement: 'Buy American Act compliance', required: true, notes: 'Domestic product requirements' },
      { requirement: 'Equal Employment Opportunity', required: true, notes: 'EEO compliance certification' },
      { requirement: 'Drug-free workplace', required: true, notes: 'Drug-free workplace certification' },
      { requirement: 'Debarment certification', required: true, notes: 'Not debarred, suspended, or excluded' },
    ],
  });

  return checklist;
}

function generateRiskAssessment(opportunity: any, matchedSuppliers: any[]) {
  const risks = [];

  // Timeline risk
  const deadline = new Date(opportunity.responseDeadline);
  const now = new Date();
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDeadline < 14) {
    risks.push({
      category: 'Timeline',
      level: 'High',
      description: 'Very short response timeframe',
      impact: 'Limited time for thorough proposal preparation',
      mitigation: 'Prioritize key requirements and consider partnering',
    });
  } else if (daysUntilDeadline < 21) {
    risks.push({
      category: 'Timeline',
      level: 'Medium',
      description: 'Limited response timeframe',
      impact: 'Tight schedule for proposal development',
      mitigation: 'Start immediately and focus on critical elements',
    });
  }

  // Competition risk
  if (matchedSuppliers.length > 8) {
    risks.push({
      category: 'Competition',
      level: 'High',
      description: 'High number of qualified suppliers',
      impact: 'Increased competition may reduce win probability',
      mitigation: 'Focus on unique differentiators and competitive pricing',
    });
  }

  // Set-aside compliance risk
  if (opportunity.setAsideCode) {
    const qualifiedSuppliers = matchedSuppliers.filter(s => 
      s.reasoning.some(r => r.includes('set-aside'))
    );
    
    if (qualifiedSuppliers.length < matchedSuppliers.length * 0.5) {
      risks.push({
        category: 'Compliance',
        level: 'Medium',
        description: 'Limited set-aside qualified suppliers',
        impact: 'Fewer suppliers meet set-aside requirements',
        mitigation: 'Verify certifications and consider prime-sub relationships',
      });
    }
  }

  // Value risk
  if (opportunity.estimatedValue && opportunity.estimatedValue > 1000000) {
    risks.push({
      category: 'Financial',
      level: 'Medium',
      description: 'High value contract',
      impact: 'Requires significant bonding and cash flow capability',
      mitigation: 'Ensure adequate bonding capacity and financial backing',
    });
  }

  return {
    overallRisk: risks.length > 2 ? 'High' : risks.length > 0 ? 'Medium' : 'Low',
    risks,
    summary: `Identified ${risks.length} risk factors requiring attention`,
  };
}

function generateRecommendations(opportunity: any, matchedSuppliers: any[]) {
  const recommendations = [];

  // Supplier selection recommendations
  const topSuppliers = matchedSuppliers.slice(0, 3);
  if (topSuppliers.length > 0) {
    recommendations.push({
      category: 'Supplier Selection',
      priority: 'High',
      recommendation: `Contact top ${topSuppliers.length} suppliers immediately`,
      details: topSuppliers.map(s => `${s.supplier.name} (${s.matchScore}% match)`).join(', '),
      actionItems: [
        'Send RFQ to top-matched suppliers',
        'Verify supplier certifications',
        'Check supplier availability for project timeline',
      ],
    });
  }

  // Timeline recommendations
  const deadline = new Date(opportunity.responseDeadline);
  const now = new Date();
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDeadline < 21) {
    recommendations.push({
      category: 'Timeline Management',
      priority: 'High',
      recommendation: 'Accelerate proposal development due to tight deadline',
      details: `Only ${daysUntilDeadline} days remaining until response deadline`,
      actionItems: [
        'Begin proposal outline immediately',
        'Parallelize supplier outreach and proposal writing',
        'Consider using pre-existing proposal templates',
      ],
    });
  }

  // Pricing strategy
  if (opportunity.estimatedValue) {
    recommendations.push({
      category: 'Pricing Strategy',
      priority: 'Medium',
      recommendation: 'Develop competitive pricing strategy',
      details: `Government estimate: $${opportunity.estimatedValue.toLocaleString()}`,
      actionItems: [
        'Obtain detailed pricing from multiple suppliers',
        'Include realistic contingency (5-10%)',
        'Consider value-added services for differentiation',
      ],
    });
  }

  // Compliance recommendations
  if (opportunity.setAsideCode) {
    recommendations.push({
      category: 'Compliance',
      priority: 'High',
      recommendation: `Ensure ${opportunity.setAsideCode} set-aside compliance`,
      details: 'Verify all certification requirements are met',
      actionItems: [
        'Review current certifications',
        'Update SAM.gov registration if needed',
        'Prepare compliance documentation',
      ],
    });
  }

  return recommendations;
}