import { nanoid } from 'nanoid';

export interface SamGovOpportunity {
  noticeId: string;
  title: string;
  department: string;
  office?: string;
  postedDate: string;
  responseDeadline: string;
  naicsCode?: string;
  setAsideCode?: string;
  classificationCode?: string;
  description?: string;
  solicitationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  place?: string;
  additionalInfo?: string;
  link?: string;
  estimatedValue?: number;
  contractType?: string;
}

export interface SamGovApiResponse {
  opportunities: SamGovOpportunity[];
  totalRecords: number;
  page: number;
  size: number;
}

export class SamGovService {
  private apiKey: string;
  private baseUrl = 'https://api.sam.gov/opportunities/v2/search';

  constructor() {
    this.apiKey = process.env.SAM_GOV_API_KEY || '';
    if (!this.apiKey) {
      console.warn('SAM_GOV_API_KEY not found in environment variables');
    }
  }

  async fetchOpportunities(params: {
    limit?: number;
    offset?: number;
    naicsCode?: string;
    setAsideCode?: string;
    department?: string;
    postedFrom?: string;
    postedTo?: string;
  } = {}): Promise<SamGovApiResponse> {
    // Require API key - no mock data fallback
    if (!this.apiKey) {
      throw new Error('SAM.gov API key is required. Please configure SAM_GOV_API_KEY environment variable.');
    }

    try {
      // SAM.gov requires date range within 1 year, mandatory postedFrom and postedTo
      const defaultPostedTo = new Date();
      const defaultPostedFrom = new Date();
      defaultPostedFrom.setDate(defaultPostedFrom.getDate() - 30); // Last 30 days

      const searchParams = new URLSearchParams({
        api_key: this.apiKey,
        limit: (params.limit || 25).toString(),
        offset: (params.offset || 0).toString(),
        // Required date parameters in MM/dd/yyyy format
        postedFrom: params.postedFrom || this.formatDateForSAM(defaultPostedFrom),
        postedTo: params.postedTo || this.formatDateForSAM(defaultPostedTo),
        // Optional parameters with correct parameter names
        ...(params.naicsCode && { ncode: params.naicsCode }),
        ...(params.setAsideCode && { typeOfSetAside: params.setAsideCode }),
        ...(params.department && { organizationName: params.department }),
      });

      console.log('SAM.gov API Request:', `${this.baseUrl}?${searchParams.toString()}`);

      const response = await fetch(`${this.baseUrl}?${searchParams}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GovBid-AI/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SAM.gov API Error Response:', errorText);
        
        // Provide helpful error messages for common issues
        let errorMessage = `SAM.gov API error: ${response.status} ${response.statusText}`;
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'SAM.gov API key is invalid or not authorized for opportunities API. Please verify your API key and ensure it has access to the opportunities service.';
        } else if (response.status === 429) {
          errorMessage = 'SAM.gov API rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'SAM.gov API is currently unavailable. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('SAM.gov API Success - Total Records:', data.totalRecords);
      return this.transformApiResponse(data);
    } catch (error) {
      console.error('Error fetching opportunities from SAM.gov:', error);
      // Re-throw the error instead of falling back to mock data
      throw new Error(`SAM.gov API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatDateForSAM(date: Date): string {
    // Format date as MM/dd/yyyy for SAM.gov API
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private transformApiResponse(data: Record<string, unknown>): SamGovApiResponse {
    // Transform the actual SAM.gov API response format to our internal format
    console.log('Transforming SAM.gov API response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    const opportunities = (data.opportunitiesData as unknown[] || []).map((item: Record<string, unknown>) => {
      // Handle SAM.gov response structure
      const orgInfo = item.organizationInformation as Record<string, unknown> || {};
      const pointOfContact = Array.isArray(item.pointOfContact) ? item.pointOfContact[0] as Record<string, unknown> : {};
      const placeOfPerformance = item.placeOfPerformance as Record<string, unknown> || {};
      const award = item.award as Record<string, unknown> || {};
      
      return {
        noticeId: item.noticeId as string || nanoid(),
        title: item.title as string || 'Untitled Opportunity',
        department: (orgInfo.organizationName as string) || (item.fullParentPathName as string) || 'Unknown Department',
        office: orgInfo.office as string,
        postedDate: item.postedDate as string || new Date().toISOString(),
        responseDeadline: item.responseDeadLine as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: item.naicsCode as string,
        setAsideCode: item.setAsideCode as string,
        classificationCode: item.classificationCode as string,
        description: item.description as string,
        solicitationNumber: item.solicitationNumber as string,
        contactEmail: pointOfContact.email as string,
        contactPhone: pointOfContact.phone as string,
        place: (placeOfPerformance.streetAddress as string) || (placeOfPerformance.city as string) || (placeOfPerformance.state as string),
        additionalInfo: item.additionalInfoText as string,
        link: item.uiLink as string,
        estimatedValue: award.amount ? parseFloat(award.amount as string) : undefined,
        contractType: item.type as string,
      };
    });

    return {
      opportunities,
      totalRecords: (data.totalRecords as number) || opportunities.length,
      page: Math.floor(((data.offset as number) || 0) / ((data.limit as number) || 25)) + 1,
      size: (data.limit as number) || 25,
    };
  }


  async getOpportunityDetails(noticeId: string): Promise<SamGovOpportunity | null> {
    // Require API key - no mock data fallback
    if (!this.apiKey) {
      throw new Error('SAM.gov API key is required. Please configure SAM_GOV_API_KEY environment variable.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${noticeId}?api_key=${this.apiKey}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GovBid-AI/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const transformed = this.transformApiResponse({ opportunitiesData: [data] });
      return transformed.opportunities[0] || null;
    } catch (error) {
      console.error('Error fetching opportunity details from SAM.gov:', error);
      return null;
    }
  }
}

// Create and export service instance
export const samGovService = new SamGovService();

// Export convenience function
export async function getOpportunityById(id: string): Promise<SamGovOpportunity | null> {
  return await samGovService.getOpportunityDetails(id);
}