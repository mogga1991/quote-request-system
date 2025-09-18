import { db } from '@/db/drizzle';
import { suppliers, quotes } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { SamGovOpportunity } from './sam-gov';

export interface SupplierMatch {
  supplier: {
    id: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    gsaSchedule: boolean;
    rating: number;
    certifications?: string[];
    capabilities?: string[];
  };
  matchScore: number;
  estimatedPrice?: number;
  deliveryTime?: number;
  reasoning: string[];
}

export interface PricingEstimate {
  category: string;
  estimatedPrice: number;
  confidence: 'Low' | 'Medium' | 'High';
  priceRange: {
    min: number;
    max: number;
  };
}

export class SupplierMatchingService {
  async findMatchingSuppliers(
    opportunity: SamGovOpportunity,
    userId: string,
    limit: number = 10
  ): Promise<SupplierMatch[]> {
    try {
      // Get all active suppliers
      const allSuppliers = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.isActive, true));

      // Score each supplier based on various criteria
      const scoredSuppliers = allSuppliers.map(supplier => {
        const matchScore = this.calculateMatchScore(opportunity, supplier);
        const pricing = this.estimateSupplierPricing(opportunity, supplier);
        
        return {
          supplier: {
            id: supplier.id,
            name: supplier.name,
            contactEmail: supplier.contactEmail || undefined,
            contactPhone: supplier.contactPhone || undefined,
            website: supplier.website || undefined,
            gsaSchedule: supplier.gsaSchedule,
            rating: parseFloat(supplier.rating || '0'),
            certifications: supplier.certifications as string[] || [],
            capabilities: supplier.capabilities as string[] || [],
          },
          matchScore,
          estimatedPrice: pricing.estimatedPrice,
          deliveryTime: this.estimateDeliveryTime(opportunity, supplier),
          reasoning: this.getMatchingReasoning(opportunity, supplier, matchScore),
        };
      });

      // Sort by match score and return top matches
      return scoredSuppliers
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding matching suppliers:', error);
      return [];
    }
  }

  private calculateMatchScore(opportunity: SamGovOpportunity, supplier: any): number {
    let score = 0;
    const factors: { weight: number; points: number }[] = [];

    // NAICS Code Match (30% weight)
    if (opportunity.naicsCode && supplier.naicsCodes) {
      const supplierNaics = supplier.naicsCodes as string[];
      if (supplierNaics.includes(opportunity.naicsCode)) {
        factors.push({ weight: 0.3, points: 100 });
      } else {
        // Check for related NAICS codes (same first 3-4 digits)
        const oppPrefix = opportunity.naicsCode.substring(0, 4);
        const hasRelated = supplierNaics.some(code => code.startsWith(oppPrefix));
        if (hasRelated) {
          factors.push({ weight: 0.3, points: 70 });
        } else {
          factors.push({ weight: 0.3, points: 0 });
        }
      }
    } else {
      factors.push({ weight: 0.3, points: 50 }); // Neutral if no NAICS info
    }

    // GSA Schedule (20% weight)
    if (supplier.gsaSchedule) {
      factors.push({ weight: 0.2, points: 100 });
    } else {
      factors.push({ weight: 0.2, points: 70 }); // Still possible to bid without GSA
    }

    // Set-Aside Compliance (25% weight)
    if (opportunity.setAsideCode && supplier.certifications) {
      const certifications = supplier.certifications as string[];
      const hasMatchingCertification = this.checkSetAsideCompliance(
        opportunity.setAsideCode,
        certifications
      );
      factors.push({ weight: 0.25, points: hasMatchingCertification ? 100 : 0 });
    } else {
      factors.push({ weight: 0.25, points: 80 }); // Open competition
    }

    // Supplier Rating (15% weight)
    const rating = parseFloat(supplier.rating || '0');
    const ratingScore = (rating / 5) * 100; // Convert 0-5 rating to 0-100 scale
    factors.push({ weight: 0.15, points: ratingScore });

    // Capability Match (10% weight)
    if (opportunity.description && supplier.capabilities) {
      const capabilityScore = this.calculateCapabilityMatch(
        opportunity.description,
        supplier.capabilities as string[]
      );
      factors.push({ weight: 0.1, points: capabilityScore });
    } else {
      factors.push({ weight: 0.1, points: 50 });
    }

    // Calculate weighted score
    score = factors.reduce((total, factor) => {
      return total + (factor.weight * factor.points);
    }, 0);

    return Math.round(score);
  }

  private checkSetAsideCompliance(setAsideCode: string, certifications: string[]): boolean {
    const setAsideMap: Record<string, string[]> = {
      'SBA': ['Small Business', 'SBA Certified', '8(a)', 'HUBZone'],
      'SDVOSB': ['Service-Disabled Veteran-Owned', 'SDVOSB', 'Veteran-Owned'],
      'WOSB': ['Women-Owned Small Business', 'WOSB', 'EDWOSB'],
      'HUBZone': ['HUBZone', 'Historically Underutilized Business Zone'],
      '8A': ['8(a)', 'SBA 8(a) Program'],
    };

    const requiredCerts = setAsideMap[setAsideCode] || [];
    return requiredCerts.some(cert => 
      certifications.some(supplierCert => 
        supplierCert.toLowerCase().includes(cert.toLowerCase())
      )
    );
  }

  private calculateCapabilityMatch(description: string, capabilities: string[]): number {
    if (!description || !capabilities.length) return 50;

    const descriptionWords = description.toLowerCase().split(/\s+/);
    const matches = capabilities.filter(capability =>
      descriptionWords.some(word => 
        capability.toLowerCase().includes(word) || 
        word.includes(capability.toLowerCase())
      )
    );

    return Math.min((matches.length / capabilities.length) * 100, 100);
  }

  private estimateSupplierPricing(opportunity: SamGovOpportunity, supplier: any): { estimatedPrice?: number } {
    // Simple pricing estimation based on opportunity value and supplier rating
    if (!opportunity.estimatedValue) {
      return { estimatedPrice: undefined };
    }

    const basePrice = opportunity.estimatedValue;
    const rating = parseFloat(supplier.rating || '3');
    
    // Higher rated suppliers might charge slightly more
    const ratingMultiplier = 0.9 + (rating / 5) * 0.2; // 0.9 to 1.1 range
    
    // Add some randomness for realistic estimates
    const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15 range
    
    const estimatedPrice = Math.round(basePrice * ratingMultiplier * randomFactor);
    
    return { estimatedPrice };
  }

  private estimateDeliveryTime(opportunity: SamGovOpportunity, supplier: any): number {
    // Estimate delivery time based on opportunity type and supplier capabilities
    const baseDeliveryDays = 30; // Default 30 days
    
    // Adjust based on opportunity characteristics
    let deliveryTime = baseDeliveryDays;
    
    if (opportunity.contractType?.toLowerCase().includes('time and materials')) {
      deliveryTime = 14; // Faster for T&M contracts
    }
    
    if (opportunity.description?.toLowerCase().includes('urgent')) {
      deliveryTime = Math.round(deliveryTime * 0.7);
    }
    
    // GSA Schedule suppliers might be faster
    if (supplier.gsaSchedule) {
      deliveryTime = Math.round(deliveryTime * 0.8);
    }
    
    return deliveryTime;
  }

  private getMatchingReasoning(opportunity: SamGovOpportunity, supplier: any, score: number): string[] {
    const reasons: string[] = [];
    
    if (opportunity.naicsCode && supplier.naicsCodes) {
      const supplierNaics = supplier.naicsCodes as string[];
      if (supplierNaics.includes(opportunity.naicsCode)) {
        reasons.push('Exact NAICS code match');
      } else {
        const oppPrefix = opportunity.naicsCode.substring(0, 4);
        const hasRelated = supplierNaics.some(code => code.startsWith(oppPrefix));
        if (hasRelated) {
          reasons.push('Related NAICS code experience');
        }
      }
    }
    
    if (supplier.gsaSchedule) {
      reasons.push('GSA Schedule holder');
    }
    
    if (opportunity.setAsideCode && supplier.certifications) {
      const certifications = supplier.certifications as string[];
      const hasMatchingCertification = this.checkSetAsideCompliance(
        opportunity.setAsideCode,
        certifications
      );
      if (hasMatchingCertification) {
        reasons.push(`Qualified for ${opportunity.setAsideCode} set-aside`);
      }
    }
    
    const rating = parseFloat(supplier.rating || '0');
    if (rating >= 4) {
      reasons.push('High performance rating');
    }
    
    if (score >= 80) {
      reasons.push('Strong overall match');
    } else if (score >= 60) {
      reasons.push('Good potential match');
    }
    
    return reasons;
  }

  async generatePricingEstimates(opportunity: SamGovOpportunity): Promise<PricingEstimate[]> {
    // This would typically involve more sophisticated pricing models
    // For now, we'll provide basic estimates based on opportunity characteristics
    
    const estimates: PricingEstimate[] = [];
    
    if (opportunity.estimatedValue) {
      const baseValue = opportunity.estimatedValue;
      
      estimates.push({
        category: 'Total Contract Value',
        estimatedPrice: baseValue,
        confidence: 'Medium',
        priceRange: {
          min: Math.round(baseValue * 0.85),
          max: Math.round(baseValue * 1.15),
        },
      });
      
      // Add category-specific estimates based on NAICS code
      if (opportunity.naicsCode) {
        const categoryEstimates = this.getCategoryPricingEstimates(
          opportunity.naicsCode,
          baseValue
        );
        estimates.push(...categoryEstimates);
      }
    }
    
    return estimates;
  }

  private getCategoryPricingEstimates(naicsCode: string, totalValue: number): PricingEstimate[] {
    const estimates: PricingEstimate[] = [];
    
    // IT Services (541511, 541512, etc.)
    if (naicsCode.startsWith('5415')) {
      estimates.push({
        category: 'Labor Costs',
        estimatedPrice: Math.round(totalValue * 0.75),
        confidence: 'High',
        priceRange: {
          min: Math.round(totalValue * 0.65),
          max: Math.round(totalValue * 0.85),
        },
      });
      
      estimates.push({
        category: 'Technology/Equipment',
        estimatedPrice: Math.round(totalValue * 0.15),
        confidence: 'Medium',
        priceRange: {
          min: Math.round(totalValue * 0.10),
          max: Math.round(totalValue * 0.25),
        },
      });
    }
    
    // Furniture (337214, etc.)
    if (naicsCode.startsWith('3372')) {
      estimates.push({
        category: 'Materials',
        estimatedPrice: Math.round(totalValue * 0.60),
        confidence: 'High',
        priceRange: {
          min: Math.round(totalValue * 0.50),
          max: Math.round(totalValue * 0.70),
        },
      });
      
      estimates.push({
        category: 'Delivery/Installation',
        estimatedPrice: Math.round(totalValue * 0.25),
        confidence: 'Medium',
        priceRange: {
          min: Math.round(totalValue * 0.15),
          max: Math.round(totalValue * 0.35),
        },
      });
    }
    
    return estimates;
  }
}