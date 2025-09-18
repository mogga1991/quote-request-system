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
    // For development/testing, return mock data if no API key
    if (!this.apiKey) {
      return this.getMockOpportunities(params);
    }

    try {
      const searchParams = new URLSearchParams({
        api_key: this.apiKey,
        limit: (params.limit || 25).toString(),
        offset: (params.offset || 0).toString(),
        ...(params.naicsCode && { naicsCode: params.naicsCode }),
        ...(params.setAsideCode && { setAsideCode: params.setAsideCode }),
        ...(params.department && { department: params.department }),
        ...(params.postedFrom && { postedFrom: params.postedFrom }),
        ...(params.postedTo && { postedTo: params.postedTo }),
      });

      const response = await fetch(`${this.baseUrl}?${searchParams}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GovBid-AI/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformApiResponse(data);
    } catch (error) {
      console.error('Error fetching opportunities from SAM.gov:', error);
      // Fallback to mock data if API fails
      return this.getMockOpportunities(params);
    }
  }

  private transformApiResponse(data: any): SamGovApiResponse {
    // Transform the actual SAM.gov API response format to our internal format
    const opportunities = (data.opportunitiesData || []).map((item: any) => ({
      noticeId: item.noticeId || nanoid(),
      title: item.title || 'Untitled Opportunity',
      department: item.organizationInformation?.organizationName || item.department || 'Unknown Department',
      office: item.organizationInformation?.office,
      postedDate: item.postedDate || new Date().toISOString(),
      responseDeadline: item.responseDeadLine || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      naicsCode: item.naicsCode,
      setAsideCode: item.setAsideCode,
      classificationCode: item.classificationCode,
      description: item.description,
      solicitationNumber: item.solicitationNumber,
      contactEmail: item.pointOfContact?.[0]?.email,
      contactPhone: item.pointOfContact?.[0]?.phone,
      place: item.placeOfPerformance?.streetAddress,
      additionalInfo: item.additionalInfoText,
      link: item.uiLink,
      estimatedValue: item.award?.amount ? parseFloat(item.award.amount) : undefined,
      contractType: item.type,
    }));

    return {
      opportunities,
      totalRecords: data.totalRecords || opportunities.length,
      page: Math.floor((data.offset || 0) / (data.limit || 25)) + 1,
      size: data.limit || 25,
    };
  }

  private getMockOpportunities(params: any): SamGovApiResponse {
    const mockOpportunities: SamGovOpportunity[] = [
      {
        noticeId: 'MOCK-001',
        title: 'IT Support Services for Federal Agency',
        department: 'Department of Veterans Affairs',
        office: 'Office of Information Technology',
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541511',
        setAsideCode: 'SBA',
        classificationCode: 'R',
        description: 'The Department of Veterans Affairs requires comprehensive IT support services including help desk, system administration, and technical support for 500+ users across multiple locations.',
        solicitationNumber: 'VA-2024-IT-001',
        contactEmail: 'contracting@va.gov',
        contactPhone: '555-123-4567',
        place: 'Washington, DC',
        additionalInfo: 'Security clearance may be required. FISMA compliance mandatory.',
        link: 'https://sam.gov/opportunities/mock-001',
        estimatedValue: 2500000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-002',
        title: 'Office Furniture and Equipment',
        department: 'General Services Administration',
        office: 'Public Buildings Service',
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '337214',
        setAsideCode: 'SDVOSB',
        classificationCode: 'U',
        description: 'GSA requires office furniture including desks, chairs, filing cabinets, and conference room equipment for new federal building in Atlanta, GA.',
        solicitationNumber: 'GSA-2024-FURN-002',
        contactEmail: 'furniture@gsa.gov',
        contactPhone: '555-987-6543',
        place: 'Atlanta, GA',
        additionalInfo: 'Must meet federal sustainability requirements. Delivery required within 60 days.',
        link: 'https://sam.gov/opportunities/mock-002',
        estimatedValue: 875000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-003',
        title: 'Professional Engineering Services',
        department: 'Department of Defense',
        office: 'Army Corps of Engineers',
        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541330',
        setAsideCode: 'WOSB',
        classificationCode: 'R',
        description: 'The Army Corps of Engineers seeks professional engineering services for environmental assessment and remediation planning at military installations.',
        solicitationNumber: 'USACE-2024-ENG-003',
        contactEmail: 'engineering@usace.army.mil',
        contactPhone: '555-456-7890',
        place: 'Multiple Locations',
        additionalInfo: 'PE license required. Previous federal experience preferred.',
        link: 'https://sam.gov/opportunities/mock-003',
        estimatedValue: 1200000,
        contractType: 'Cost Plus Fixed Fee',
      },
      {
        noticeId: 'MOCK-004',
        title: 'Cybersecurity Assessment Services',
        department: 'Department of Homeland Security',
        office: 'Cybersecurity and Infrastructure Security Agency',
        postedDate: new Date().toISOString(),
        responseDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541512',
        classificationCode: 'R',
        description: 'CISA requires cybersecurity assessment services including penetration testing, vulnerability assessments, and compliance auditing for critical infrastructure.',
        solicitationNumber: 'DHS-CISA-2024-CYB-004',
        contactEmail: 'cybersec@cisa.dhs.gov',
        contactPhone: '555-321-0987',
        place: 'Remote/Various',
        additionalInfo: 'Top Secret clearance required. Must have CISSP or equivalent certification.',
        link: 'https://sam.gov/opportunities/mock-004',
        estimatedValue: 3200000,
        contractType: 'Time and Materials',
      },
    ];

    // Apply basic filtering if params are provided
    let filteredOpportunities = mockOpportunities;
    if (params.naicsCode) {
      filteredOpportunities = filteredOpportunities.filter(opp => 
        opp.naicsCode?.includes(params.naicsCode)
      );
    }
    if (params.department) {
      filteredOpportunities = filteredOpportunities.filter(opp => 
        opp.department.toLowerCase().includes(params.department.toLowerCase())
      );
    }

    const limit = params.limit || 25;
    const offset = params.offset || 0;
    const paginatedOpportunities = filteredOpportunities.slice(offset, offset + limit);

    return {
      opportunities: paginatedOpportunities,
      totalRecords: filteredOpportunities.length,
      page: Math.floor(offset / limit) + 1,
      size: limit,
    };
  }

  async getOpportunityDetails(noticeId: string): Promise<SamGovOpportunity | null> {
    // For development/testing, return mock data
    if (!this.apiKey) {
      const mockData = await this.getMockOpportunities({});
      return mockData.opportunities.find(opp => opp.noticeId === noticeId) || null;
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