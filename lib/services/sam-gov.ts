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

  private transformApiResponse(data: Record<string, unknown>): SamGovApiResponse {
    // Transform the actual SAM.gov API response format to our internal format
    const opportunities = (data.opportunitiesData as unknown[] || []).map((item: Record<string, unknown>) => ({
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

  private getMockOpportunities(params: Record<string, unknown>): SamGovApiResponse {
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
      {
        noticeId: 'MOCK-005',
        title: 'Cloud Migration Services',
        department: 'Department of Education',
        office: 'Office of the Chief Information Officer',
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541511',
        setAsideCode: 'HUBZone',
        classificationCode: 'R',
        description: 'Department of Education seeks cloud migration services for legacy systems to AWS GovCloud. Must include data migration, security implementation, and staff training.',
        solicitationNumber: 'ED-2024-CLOUD-005',
        contactEmail: 'cloudmigration@ed.gov',
        contactPhone: '555-234-5678',
        place: 'Washington, DC',
        additionalInfo: 'FedRAMP authorization required. Previous DoED experience preferred.',
        link: 'https://sam.gov/opportunities/mock-005',
        estimatedValue: 1800000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-006',
        title: 'Medical Equipment Maintenance',
        department: 'Department of Veterans Affairs',
        office: 'Veterans Health Administration',
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '811219',
        setAsideCode: 'VOSB',
        classificationCode: 'U',
        description: 'VA Medical Centers require preventive and corrective maintenance for medical imaging equipment including MRI, CT, and X-ray machines.',
        solicitationNumber: 'VA-VHA-2024-MED-006',
        contactEmail: 'medical.contracts@va.gov',
        contactPhone: '555-345-6789',
        place: 'Multiple VA Medical Centers',
        additionalInfo: 'Biomedical equipment certification required. 24/7 emergency response capability needed.',
        link: 'https://sam.gov/opportunities/mock-006',
        estimatedValue: 950000,
        contractType: 'Time and Materials',
      },
      {
        noticeId: 'MOCK-007',
        title: 'Construction Management Services',
        department: 'General Services Administration',
        office: 'Public Buildings Service',
        postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541330',
        classificationCode: 'R',
        description: 'GSA requires construction management services for federal courthouse renovation project. Project includes seismic upgrades, security enhancements, and HVAC modernization.',
        solicitationNumber: 'GSA-PBS-2024-CM-007',
        contactEmail: 'construction@gsa.gov',
        contactPhone: '555-456-7890',
        place: 'San Francisco, CA',
        additionalInfo: 'Licensed General Contractor required. LEED Gold certification preferred.',
        link: 'https://sam.gov/opportunities/mock-007',
        estimatedValue: 4200000,
        contractType: 'Cost Plus Fixed Fee',
      },
      {
        noticeId: 'MOCK-008',
        title: 'Logistics and Transportation Services',
        department: 'Department of Defense',
        office: 'Defense Logistics Agency',
        postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '488510',
        setAsideCode: 'SBA',
        classificationCode: 'U',
        description: 'DLA requires comprehensive logistics services including warehousing, inventory management, and freight transportation for military supplies and equipment.',
        solicitationNumber: 'DLA-2024-LOG-008',
        contactEmail: 'logistics@dla.mil',
        contactPhone: '555-567-8901',
        place: 'Norfolk, VA',
        additionalInfo: 'DOD contractor registration required. Previous military logistics experience essential.',
        link: 'https://sam.gov/opportunities/mock-008',
        estimatedValue: 3500000,
        contractType: 'Indefinite Delivery',
      },
      {
        noticeId: 'MOCK-009',
        title: 'Environmental Consulting Services',
        department: 'Environmental Protection Agency',
        office: 'Office of Research and Development',
        postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541620',
        setAsideCode: 'WOSB',
        classificationCode: 'R',
        description: 'EPA seeks environmental consulting services for superfund site assessment and remediation planning. Includes soil and water quality testing, risk assessment, and remediation design.',
        solicitationNumber: 'EPA-ORD-2024-ENV-009',
        contactEmail: 'environmental@epa.gov',
        contactPhone: '555-678-9012',
        place: 'Multiple Sites Nationwide',
        additionalInfo: 'Professional Engineer license required. Hazmat certification preferred.',
        link: 'https://sam.gov/opportunities/mock-009',
        estimatedValue: 2100000,
        contractType: 'Cost Plus Fixed Fee',
      },
      {
        noticeId: 'MOCK-010',
        title: 'Software Development and Maintenance',
        department: 'Department of Health and Human Services',
        office: 'Centers for Medicare & Medicaid Services',
        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541511',
        classificationCode: 'R',
        description: 'CMS requires software development and maintenance services for healthcare data management systems. Includes HIPAA-compliant database design, web application development, and system integration.',
        solicitationNumber: 'CMS-2024-SW-010',
        contactEmail: 'software@cms.hhs.gov',
        contactPhone: '555-789-0123',
        place: 'Baltimore, MD',
        additionalInfo: 'HIPAA compliance mandatory. Healthcare IT experience required.',
        link: 'https://sam.gov/opportunities/mock-010',
        estimatedValue: 2800000,
        contractType: 'Time and Materials',
      },
      {
        noticeId: 'MOCK-011',
        title: 'Fleet Vehicle Maintenance Services',
        department: 'Department of Agriculture',
        office: 'Forest Service',
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '811111',
        setAsideCode: 'SDVOSB',
        classificationCode: 'U',
        description: 'Forest Service requires comprehensive fleet maintenance services for 200+ vehicles including trucks, SUVs, and specialized forestry equipment across 15 ranger districts.',
        solicitationNumber: 'USFS-2024-FLEET-011',
        contactEmail: 'fleet@fs.usda.gov',
        contactPhone: '555-890-1234',
        place: 'Pacific Northwest Region',
        additionalInfo: 'ASE certification required. Remote location service capability essential.',
        link: 'https://sam.gov/opportunities/mock-011',
        estimatedValue: 1350000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-012',
        title: 'Training and Development Services',
        department: 'Department of Justice',
        office: 'Federal Bureau of Investigation',
        postedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '611430',
        classificationCode: 'R',
        description: 'FBI requires professional training services including cybersecurity awareness, leadership development, and specialized investigative techniques for federal agents and staff.',
        solicitationNumber: 'FBI-2024-TRAIN-012',
        contactEmail: 'training@fbi.gov',
        contactPhone: '555-901-2345',
        place: 'Quantico, VA',
        additionalInfo: 'Top Secret clearance required. Adult education certification preferred.',
        link: 'https://sam.gov/opportunities/mock-012',
        estimatedValue: 1650000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-013',
        title: 'Telecommunications Infrastructure Upgrade',
        department: 'Department of Treasury',
        office: 'Bureau of Engraving and Printing',
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '517110',
        setAsideCode: 'HUBZone',
        classificationCode: 'U',
        description: 'Bureau of Engraving and Printing requires telecommunications infrastructure upgrade including fiber optic installation, network equipment, and security systems for production facilities.',
        solicitationNumber: 'BEP-2024-TELECOM-013',
        contactEmail: 'telecom@bep.treasury.gov',
        contactPhone: '555-012-3456',
        place: 'Washington, DC & Fort Worth, TX',
        additionalInfo: 'High-security facility clearance required. Previous Treasury experience preferred.',
        link: 'https://sam.gov/opportunities/mock-013',
        estimatedValue: 3800000,
        contractType: 'Cost Plus Fixed Fee',
      },
      {
        noticeId: 'MOCK-014',
        title: 'Research and Development Services',
        department: 'National Science Foundation',
        office: 'Office of Advanced Cyberinfrastructure',
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541712',
        classificationCode: 'R',
        description: 'NSF seeks R&D services for advanced computing research including quantum computing, artificial intelligence, and high-performance computing infrastructure development.',
        solicitationNumber: 'NSF-OAC-2024-RD-014',
        contactEmail: 'research@nsf.gov',
        contactPhone: '555-123-4567',
        place: 'Arlington, VA',
        additionalInfo: 'PhD in Computer Science or related field required. Publication record preferred.',
        link: 'https://sam.gov/opportunities/mock-014',
        estimatedValue: 5200000,
        contractType: 'Cost Plus Fixed Fee',
      },
      {
        noticeId: 'MOCK-015',
        title: 'Food Service Management',
        department: 'Department of Defense',
        office: 'Defense Commissary Agency',
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '722310',
        setAsideCode: 'VOSB',
        classificationCode: 'U',
        description: 'Defense Commissary Agency requires food service management for military base dining facilities serving 2,000+ personnel daily. Includes menu planning, food preparation, and nutritional compliance.',
        solicitationNumber: 'DCA-2024-FOOD-015',
        contactEmail: 'foodservice@commissaries.com',
        contactPhone: '555-234-5678',
        place: 'Fort Bragg, NC',
        additionalInfo: 'Food service management certification required. Military dietary standards compliance essential.',
        link: 'https://sam.gov/opportunities/mock-015',
        estimatedValue: 2400000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-016',
        title: 'Facility Security Services',
        department: 'Department of Energy',
        office: 'National Nuclear Security Administration',
        postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '561612',
        classificationCode: 'R',
        description: 'NNSA requires comprehensive security services for nuclear facilities including armed security, access control, and emergency response for highly classified government installations.',
        solicitationNumber: 'NNSA-2024-SEC-016',
        contactEmail: 'security@nnsa.doe.gov',
        contactPhone: '555-345-6789',
        place: 'Multiple Secure Locations',
        additionalInfo: 'Q clearance required. Law enforcement background preferred.',
        link: 'https://sam.gov/opportunities/mock-016',
        estimatedValue: 6800000,
        contractType: 'Cost Plus Award Fee',
      },
      {
        noticeId: 'MOCK-017',
        title: 'Financial Audit Services',
        department: 'Department of Commerce',
        office: 'Office of Inspector General',
        postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541211',
        setAsideCode: 'WOSB',
        classificationCode: 'R',
        description: 'Commerce OIG requires independent financial audit services for departmental programs including GAGAS compliance, risk assessment, and internal control evaluation.',
        solicitationNumber: 'DOC-OIG-2024-AUDIT-017',
        contactEmail: 'audit@oig.doc.gov',
        contactPhone: '555-456-7890',
        place: 'Washington, DC',
        additionalInfo: 'CPA license required. Government audit experience essential.',
        link: 'https://sam.gov/opportunities/mock-017',
        estimatedValue: 1550000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-018',
        title: 'Laboratory Equipment Services',
        department: 'Centers for Disease Control and Prevention',
        office: 'Office of Laboratory Science and Safety',
        postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '423450',
        classificationCode: 'U',
        description: 'CDC requires laboratory equipment including PCR machines, centrifuges, microscopes, and biosafety cabinets for infectious disease research and public health laboratories.',
        solicitationNumber: 'CDC-OLSS-2024-LAB-018',
        contactEmail: 'lab.equipment@cdc.gov',
        contactPhone: '555-567-8901',
        place: 'Atlanta, GA',
        additionalInfo: 'FDA registration required. Biomedical equipment certification preferred.',
        link: 'https://sam.gov/opportunities/mock-018',
        estimatedValue: 3100000,
        contractType: 'Firm Fixed Price',
      },
      {
        noticeId: 'MOCK-019',
        title: 'Legal Support Services',
        department: 'Department of Justice',
        office: 'Office of the Solicitor General',
        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541110',
        classificationCode: 'R',
        description: 'Office of the Solicitor General requires legal support services including case research, brief writing, and litigation support for Supreme Court and appellate court cases.',
        solicitationNumber: 'OSG-2024-LEGAL-019',
        contactEmail: 'legal.support@usdoj.gov',
        contactPhone: '555-678-9012',
        place: 'Washington, DC',
        additionalInfo: 'J.D. degree required. Supreme Court bar admission preferred.',
        link: 'https://sam.gov/opportunities/mock-019',
        estimatedValue: 1900000,
        contractType: 'Time and Materials',
      },
      {
        noticeId: 'MOCK-020',
        title: 'Data Analytics and Visualization Services',
        department: 'Department of Health and Human Services',
        office: 'Centers for Disease Control and Prevention',
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responseDeadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
        naicsCode: '541511',
        setAsideCode: 'SBA',
        classificationCode: 'R',
        description: 'CDC requires data analytics services for epidemiological surveillance including dashboard development, statistical analysis, and predictive modeling for disease outbreak monitoring.',
        solicitationNumber: 'CDC-2024-DATA-020',
        contactEmail: 'data.analytics@cdc.gov',
        contactPhone: '555-789-0123',
        place: 'Atlanta, GA',
        additionalInfo: 'Master\'s degree in Data Science or Statistics required. Public health experience preferred.',
        link: 'https://sam.gov/opportunities/mock-020',
        estimatedValue: 2300000,
        contractType: 'Cost Plus Fixed Fee',
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

// Create and export service instance
export const samGovService = new SamGovService();

// Export convenience function
export async function getOpportunityById(id: string): Promise<SamGovOpportunity | null> {
  return await samGovService.getOpportunityDetails(id);
}