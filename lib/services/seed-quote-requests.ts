import { db } from '@/db/drizzle';
import { 
  quoteRequests, 
  quoteRequestSuppliers, 
  supplierResponses,
  opportunities,
  suppliers,
  user
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface SeedQuoteRequestsOptions {
  userCount?: number;
  opportunityCount?: number;
  supplierCount?: number;
  quoteRequestCount?: number;
  responseRate?: number; // 0-1, percentage of suppliers that respond
}

export async function seedQuoteRequestsData(options: SeedQuoteRequestsOptions = {}) {
  const {
    userCount = 3,
    opportunityCount = 5,
    supplierCount = 10,
    quoteRequestCount = 8,
    responseRate = 0.6
  } = options;

  console.log('🌱 Seeding Quote Request System data...');

  try {
    // Create test users if they don't exist
    const testUsers = await createTestUsers(userCount);
    console.log(`✅ Created ${testUsers.length} test users`);

    // Create test opportunities if they don't exist
    const testOpportunities = await createTestOpportunities(opportunityCount);
    console.log(`✅ Created ${testOpportunities.length} test opportunities`);

    // Create test suppliers if they don't exist
    const testSuppliers = await createTestSuppliers(supplierCount);
    console.log(`✅ Created ${testSuppliers.length} test suppliers`);

    // Create test quote requests
    const testQuoteRequests = await createTestQuoteRequests(
      quoteRequestCount,
      testUsers.map(u => u.id),
      testOpportunities.map(o => o.id)
    );
    console.log(`✅ Created ${testQuoteRequests.length} test quote requests`);

    // Invite suppliers to quote requests
    const invitations = await createTestSupplierInvitations(
      testQuoteRequests.map(q => q.id),
      testSuppliers.map(s => s.id)
    );
    console.log(`✅ Created ${invitations} supplier invitations`);

    // Create supplier responses
    const responses = await createTestSupplierResponses(
      testQuoteRequests.map(q => q.id),
      testSuppliers.map(s => s.id),
      responseRate
    );
    console.log(`✅ Created ${responses} supplier responses`);

    console.log('🎉 Quote Request System seeding completed successfully!');

    return {
      users: testUsers.length,
      opportunities: testOpportunities.length,
      suppliers: testSuppliers.length,
      quoteRequests: testQuoteRequests.length,
      invitations,
      responses,
    };
  } catch (error) {
    console.error('❌ Error seeding Quote Request System data:', error);
    throw error;
  }
}

async function createTestUsers(count: number) {
  const existingUsers = await db.select().from(user).limit(count);
  
  if (existingUsers.length >= count) {
    return existingUsers.slice(0, count);
  }

  const usersToCreate = count - existingUsers.length;
  const newUsers = [];

  for (let i = 0; i < usersToCreate; i++) {
    const userId = nanoid();
    const userData = {
      id: userId,
      name: `Test User ${existingUsers.length + i + 1}`,
      email: `testuser${existingUsers.length + i + 1}@example.com`,
      emailVerified: true,
    };

    await db.insert(user).values(userData);
    newUsers.push(userData);
  }

  return [...existingUsers, ...newUsers];
}

async function createTestOpportunities(count: number) {
  const existingOpportunities = await db.select().from(opportunities).limit(count);
  
  if (existingOpportunities.length >= count) {
    return existingOpportunities.slice(0, count);
  }

  const opportunitiesToCreate = count - existingOpportunities.length;
  const newOpportunities = [];

  const sampleOpportunities = [
    {
      title: 'IT Support Services for Federal Agency',
      department: 'Department of Veterans Affairs',
      office: 'Office of Information Technology',
      naicsCode: '541511',
      setAsideCode: 'SBA',
      description: 'Comprehensive IT support services including help desk, system administration, and technical support.',
      estimatedValue: '2500000',
      contractType: 'Firm Fixed Price',
    },
    {
      title: 'Office Furniture and Equipment',
      department: 'General Services Administration',
      office: 'Public Buildings Service',
      naicsCode: '337214',
      setAsideCode: 'SDVOSB',
      description: 'Office furniture including desks, chairs, filing cabinets, and conference room equipment.',
      estimatedValue: '875000',
      contractType: 'Firm Fixed Price',
    },
    {
      title: 'Professional Engineering Services',
      department: 'Department of Defense',
      office: 'Army Corps of Engineers',
      naicsCode: '541330',
      setAsideCode: 'WOSB',
      description: 'Professional engineering services for environmental assessment and remediation planning.',
      estimatedValue: '1200000',
      contractType: 'Cost Plus Fixed Fee',
    },
    {
      title: 'Cybersecurity Assessment Services',
      department: 'Department of Homeland Security',
      office: 'Cybersecurity and Infrastructure Security Agency',
      naicsCode: '541512',
      description: 'Cybersecurity assessment services including penetration testing and vulnerability assessments.',
      estimatedValue: '3200000',
      contractType: 'Time and Materials',
    },
    {
      title: 'Medical Equipment and Supplies',
      department: 'Department of Health and Human Services',
      office: 'Centers for Disease Control',
      naicsCode: '339112',
      setAsideCode: 'HUBZone',
      description: 'Medical equipment and laboratory supplies for research facilities.',
      estimatedValue: '1800000',
      contractType: 'Indefinite Delivery',
    },
  ];

  for (let i = 0; i < opportunitiesToCreate; i++) {
    const opportunityId = nanoid();
    const template = sampleOpportunities[i % sampleOpportunities.length];
    const uniqueIndex = existingOpportunities.length + i + 1;

    const opportunityData = {
      id: opportunityId,
      noticeId: `TEST-OPP-${uniqueIndex.toString().padStart(3, '0')}`,
      title: `${template.title} ${uniqueIndex}`,
      department: template.department,
      office: template.office,
      postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      responseDeadline: new Date(Date.now() + (14 + Math.random() * 30) * 24 * 60 * 60 * 1000), // 14-44 days from now
      naicsCode: template.naicsCode,
      setAsideCode: template.setAsideCode,
      description: template.description,
      estimatedValue: template.estimatedValue,
      contractType: template.contractType,
      status: 'active',
    };

    await db.insert(opportunities).values(opportunityData);
    newOpportunities.push(opportunityData);
  }

  return [...existingOpportunities, ...newOpportunities];
}

async function createTestSuppliers(count: number) {
  const existingSuppliers = await db.select().from(suppliers).limit(count);
  
  if (existingSuppliers.length >= count) {
    return existingSuppliers.slice(0, count);
  }

  const suppliersToCreate = count - existingSuppliers.length;
  const newSuppliers = [];

  const sampleSuppliers = [
    {
      name: 'TechSolutions Inc',
      contactEmail: 'contact@techsolutions.com',
      contactPhone: '555-0101',
      gsaSchedule: true,
      naicsCodes: ['541511', '541512'],
      certifications: ['Small Business', 'SBA Certified'],
      capabilities: ['IT Support', 'Cybersecurity', 'Help Desk'],
      rating: '4.5',
    },
    {
      name: 'Federal Furniture Co',
      contactEmail: 'sales@federalfurniture.com',
      contactPhone: '555-0102',
      gsaSchedule: true,
      naicsCodes: ['337214'],
      certifications: ['SDVOSB', 'Veteran-Owned'],
      capabilities: ['Office Furniture', 'Installation', 'Design'],
      rating: '4.2',
    },
    {
      name: 'Engineering Excellence LLC',
      contactEmail: 'info@engexcellence.com',
      contactPhone: '555-0103',
      gsaSchedule: false,
      naicsCodes: ['541330'],
      certifications: ['WOSB', 'Professional Engineers'],
      capabilities: ['Environmental Engineering', 'Project Management'],
      rating: '4.8',
    },
    {
      name: 'SecureNet Solutions',
      contactEmail: 'hello@securenetsol.com',
      contactPhone: '555-0104',
      gsaSchedule: true,
      naicsCodes: ['541512'],
      certifications: ['Small Business', 'CISSP Certified'],
      capabilities: ['Penetration Testing', 'Security Audits', 'Compliance'],
      rating: '4.6',
    },
    {
      name: 'MedEquip Supply Corp',
      contactEmail: 'orders@medequipsupply.com',
      contactPhone: '555-0105',
      gsaSchedule: true,
      naicsCodes: ['339112'],
      certifications: ['HUBZone', 'FDA Certified'],
      capabilities: ['Medical Equipment', 'Laboratory Supplies'],
      rating: '4.3',
    },
  ];

  for (let i = 0; i < suppliersToCreate; i++) {
    const supplierId = nanoid();
    const template = sampleSuppliers[i % sampleSuppliers.length];
    const uniqueIndex = existingSuppliers.length + i + 1;

    const supplierData = {
      id: supplierId,
      name: `${template.name} ${uniqueIndex}`,
      contactEmail: template.contactEmail.replace('@', `${uniqueIndex}@`),
      contactPhone: template.contactPhone,
      gsaSchedule: template.gsaSchedule,
      naicsCodes: template.naicsCodes,
      certifications: template.certifications,
      capabilities: template.capabilities,
      rating: template.rating,
      isActive: true,
    };

    await db.insert(suppliers).values(supplierData);
    newSuppliers.push(supplierData);
  }

  return [...existingSuppliers, ...newSuppliers];
}

async function createTestQuoteRequests(count: number, userIds: string[], opportunityIds: string[]) {
  const newQuoteRequests = [];

  const sampleTitles = [
    'Request for IT Support Services Quote',
    'Office Furniture Pricing Request',
    'Engineering Services Proposal Request',
    'Cybersecurity Assessment Quote',
    'Medical Equipment Supply Quote',
    'Professional Services RFQ',
    'Equipment Maintenance Quote',
    'Consulting Services Request',
  ];

  const statuses = ['draft', 'sent', 'sent', 'completed']; // More sent requests for realistic data

  for (let i = 0; i < count; i++) {
    const quoteRequestId = nanoid();
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const opportunityId = opportunityIds[Math.floor(Math.random() * opportunityIds.length)];
    const title = sampleTitles[i % sampleTitles.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const quoteRequestData = {
      id: quoteRequestId,
      opportunityId,
      userId,
      title: `${title} ${i + 1}`,
      description: `Detailed requirements for ${title.toLowerCase()} including specifications and delivery requirements.`,
      status,
      deadline: new Date(Date.now() + (7 + Math.random() * 21) * 24 * 60 * 60 * 1000), // 7-28 days from now
      requirements: [
        {
          category: 'Technical Requirements',
          items: ['Quality standards compliance', 'Technical specifications met'],
        },
        {
          category: 'Delivery Requirements',
          items: ['On-time delivery', 'Proper packaging'],
        },
      ],
      aiGenerated: Math.random() > 0.5,
      aiPrompt: Math.random() > 0.5 ? 'Generate a comprehensive quote request for government procurement' : null,
    };

    await db.insert(quoteRequests).values(quoteRequestData);
    newQuoteRequests.push(quoteRequestData);
  }

  return newQuoteRequests;
}

async function createTestSupplierInvitations(quoteRequestIds: string[], supplierIds: string[]) {
  let invitationCount = 0;

  // For each quote request, invite 3-6 random suppliers
  for (const quoteRequestId of quoteRequestIds) {
    const inviteCount = 3 + Math.floor(Math.random() * 4); // 3-6 suppliers
    const shuffledSuppliers = [...supplierIds].sort(() => Math.random() - 0.5);
    const selectedSuppliers = shuffledSuppliers.slice(0, inviteCount);

    for (const supplierId of selectedSuppliers) {
      try {
        await db.insert(quoteRequestSuppliers).values({
          id: nanoid(),
          quoteRequestId,
          supplierId,
          notificationMethod: ['email', 'platform', 'manual'][Math.floor(Math.random() * 3)],
          notificationSent: Math.random() > 0.2, // 80% have notifications sent
        });
        invitationCount++;
      } catch (error) {
        // Ignore duplicate key errors (unique constraint)
        console.log(`Skipping duplicate invitation for ${quoteRequestId}-${supplierId}`);
      }
    }
  }

  return invitationCount;
}

async function createTestSupplierResponses(
  quoteRequestIds: string[], 
  supplierIds: string[], 
  responseRate: number
) {
  let responseCount = 0;

  // Get all supplier invitations
  const invitations = await db
    .select({
      quoteRequestId: quoteRequestSuppliers.quoteRequestId,
      supplierId: quoteRequestSuppliers.supplierId,
    })
    .from(quoteRequestSuppliers);

  for (const invitation of invitations) {
    // Only create response based on response rate
    if (Math.random() > responseRate) continue;

    const responseId = nanoid();
    const statuses = ['pending', 'submitted', 'submitted', 'declined']; // More submitted
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const lineItems = [
      {
        item: 'Service Package A',
        quantity: 1,
        unitPriceCents: 150000 + Math.floor(Math.random() * 200000), // $1,500 - $3,500
        totalCents: 0,
        specifications: 'Standard service package with basic features',
      },
      {
        item: 'Additional Services',
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPriceCents: 50000 + Math.floor(Math.random() * 100000), // $500 - $1,500
        totalCents: 0,
      },
    ];

    // Calculate totals
    lineItems.forEach(item => {
      item.totalCents = item.quantity * item.unitPriceCents;
    });

    const totalPriceCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);

    const responseData = {
      id: responseId,
      quoteRequestId: invitation.quoteRequestId,
      supplierId: invitation.supplierId,
      status,
      lineItems,
      totalPriceCents,
      deliveryTimedays: 7 + Math.floor(Math.random() * 21), // 7-28 days
      notes: status === 'declined' 
        ? 'Unable to meet requirements at this time'
        : 'Competitive pricing with quality service guarantee',
      submittedAt: status === 'submitted' ? new Date() : null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    try {
      await db.insert(supplierResponses).values(responseData);
      responseCount++;
    } catch (error) {
      // Ignore duplicate key errors
      console.log(`Skipping duplicate response for ${invitation.quoteRequestId}-${invitation.supplierId}`);
    }
  }

  return responseCount;
}

// Clean up test data
export async function cleanupQuoteRequestsData() {
  console.log('🧹 Cleaning up Quote Request System test data...');

  try {
    // Delete in reverse dependency order
    await db.delete(supplierResponses);
    await db.delete(quoteRequestSuppliers);
    await db.delete(quoteRequests);
    
    // Note: We don't delete opportunities, suppliers, or users as they might be used elsewhere
    
    console.log('✅ Quote Request System test data cleaned up successfully!');
  } catch (error) {
    console.error('❌ Error cleaning up Quote Request System data:', error);
    throw error;
  }
}