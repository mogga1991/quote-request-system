import { db } from '@/db/drizzle';
import { suppliers } from '@/db/schema';
import { nanoid } from 'nanoid';

export async function seedSuppliersData() {
  try {
    const suppliersData = [
      {
        id: nanoid(),
        name: 'TechFlow Solutions',
        duns: '123456789',
        cage: 'TF001',
        address: '123 Technology Drive',
        city: 'Arlington',
        state: 'VA',
        zipCode: '22201',
        contactName: 'John Smith',
        contactEmail: 'contracts@techflow.com',
        contactPhone: '703-555-0123',
        website: 'https://www.techflow.com',
        gsaSchedule: true,
        naicsCodes: ['541511', '541512', '541513'],
        certifications: ['Small Business', 'SBA Certified', 'ISO 27001'],
        capabilities: [
          'IT Support Services',
          'Cybersecurity',
          'Cloud Migration',
          'Help Desk Support',
          'Network Administration',
          'System Integration'
        ],
        pastPerformance: [
          {
            contract: 'VA-2023-IT-456',
            value: 1200000,
            rating: 4.8,
            year: 2023
          }
        ],
        rating: '4.7',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'Federal Office Solutions',
        duns: '987654321',
        cage: 'FOS02',
        address: '456 Business Plaza',
        city: 'Rockville',
        state: 'MD',
        zipCode: '20850',
        contactName: 'Sarah Johnson',
        contactEmail: 'sales@federaloffice.com',
        contactPhone: '301-555-0456',
        website: 'https://www.federaloffice.com',
        gsaSchedule: true,
        naicsCodes: ['337214', '423210', '561210'],
        certifications: ['Women-Owned Small Business', 'WOSB', 'GSA Advantage'],
        capabilities: [
          'Office Furniture',
          'Ergonomic Workstations',
          'Conference Room Equipment',
          'Filing Systems',
          'Installation Services',
          'Space Planning'
        ],
        pastPerformance: [
          {
            contract: 'GSA-2023-FURN-789',
            value: 850000,
            rating: 4.9,
            year: 2023
          }
        ],
        rating: '4.6',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'Elite Engineering Group',
        duns: '456789123',
        cage: 'EEG03',
        address: '789 Professional Way',
        city: 'Alexandria',
        state: 'VA',
        zipCode: '22314',
        contactName: 'Michael Chen',
        contactEmail: 'proposals@eliteeng.com',
        contactPhone: '703-555-0789',
        website: 'https://www.eliteeng.com',
        gsaSchedule: false,
        naicsCodes: ['541330', '541620', '562910'],
        certifications: ['Service-Disabled Veteran-Owned', 'SDVOSB', 'PE Licensed'],
        capabilities: [
          'Environmental Engineering',
          'Civil Engineering',
          'Project Management',
          'Environmental Assessment',
          'Remediation Planning',
          'Compliance Consulting'
        ],
        pastPerformance: [
          {
            contract: 'USACE-2022-ENV-321',
            value: 1500000,
            rating: 4.5,
            year: 2022
          }
        ],
        rating: '4.4',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'SecureNet Cyber Solutions',
        duns: '789123456',
        cage: 'SCS04',
        address: '321 Security Blvd',
        city: 'McLean',
        state: 'VA',
        zipCode: '22102',
        contactName: 'Emily Rodriguez',
        contactEmail: 'bizdev@securenet.com',
        contactPhone: '703-555-0321',
        website: 'https://www.securenet.com',
        gsaSchedule: true,
        naicsCodes: ['541512', '541519', '561621'],
        certifications: ['Small Business', '8(a)', 'CISSP Certified', 'FedRAMP Authorized'],
        capabilities: [
          'Cybersecurity Assessment',
          'Penetration Testing',
          'Vulnerability Management',
          'Compliance Auditing',
          'Incident Response',
          'Security Training'
        ],
        pastPerformance: [
          {
            contract: 'DHS-2023-CYB-654',
            value: 2800000,
            rating: 4.8,
            year: 2023
          }
        ],
        rating: '4.8',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'Global Logistics Partners',
        duns: '321654987',
        cage: 'GLP05',
        address: '654 Commerce Street',
        city: 'Baltimore',
        state: 'MD',
        zipCode: '21201',
        contactName: 'David Williams',
        contactEmail: 'contracts@globallogistics.com',
        contactPhone: '410-555-0654',
        website: 'https://www.globallogistics.com',
        gsaSchedule: true,
        naicsCodes: ['484110', '488510', '493110'],
        certifications: ['HUBZone', 'Veteran-Owned', 'ISO 9001'],
        capabilities: [
          'Transportation Services',
          'Warehousing',
          'Supply Chain Management',
          'Freight Forwarding',
          'Inventory Management',
          'Distribution'
        ],
        pastPerformance: [
          {
            contract: 'DOD-2023-LOG-987',
            value: 950000,
            rating: 4.3,
            year: 2023
          }
        ],
        rating: '4.2',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'Advanced Medical Systems',
        duns: '654987321',
        cage: 'AMS06',
        address: '987 Healthcare Drive',
        city: 'Bethesda',
        state: 'MD',
        zipCode: '20814',
        contactName: 'Dr. Lisa Thompson',
        contactEmail: 'government@advmedical.com',
        contactPhone: '301-555-0987',
        website: 'https://www.advmedical.com',
        gsaSchedule: true,
        naicsCodes: ['339112', '621111', '541715'],
        certifications: ['Small Business', 'FDA Registered', 'ISO 13485'],
        capabilities: [
          'Medical Equipment',
          'Diagnostic Systems',
          'Healthcare IT',
          'Biomedical Engineering',
          'Equipment Maintenance',
          'Training Services'
        ],
        pastPerformance: [
          {
            contract: 'VA-2023-MED-147',
            value: 1800000,
            rating: 4.7,
            year: 2023
          }
        ],
        rating: '4.5',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'Professional Training Institute',
        duns: '147258369',
        cage: 'PTI07',
        address: '741 Education Lane',
        city: 'Silver Spring',
        state: 'MD',
        zipCode: '20901',
        contactName: 'Robert Davis',
        contactEmail: 'training@protraining.com',
        contactPhone: '301-555-0741',
        website: 'https://www.protraining.com',
        gsaSchedule: false,
        naicsCodes: ['611430', '541611', '611710'],
        certifications: ['Minority-Owned Business', 'IACET Accredited'],
        capabilities: [
          'Professional Development',
          'Leadership Training',
          'Compliance Training',
          'Online Learning',
          'Curriculum Development',
          'Instructor Services'
        ],
        pastPerformance: [
          {
            contract: 'OPM-2022-TRN-852',
            value: 650000,
            rating: 4.6,
            year: 2022
          }
        ],
        rating: '4.4',
        isActive: true,
      },
      {
        id: nanoid(),
        name: 'Innovative Construction Corp',
        duns: '852963741',
        cage: 'ICC08',
        address: '852 Builder\'s Row',
        city: 'Fairfax',
        state: 'VA',
        zipCode: '22030',
        contactName: 'Mark Anderson',
        contactEmail: 'projects@innovconstruct.com',
        contactPhone: '703-555-0852',
        website: 'https://www.innovconstruct.com',
        gsaSchedule: false,
        naicsCodes: ['236220', '238210', '541310'],
        certifications: ['Small Business', 'OSHA Certified', 'LEED Accredited'],
        capabilities: [
          'Commercial Construction',
          'Renovation Services',
          'Project Management',
          'Design-Build',
          'Sustainable Construction',
          'Facility Maintenance'
        ],
        pastPerformance: [
          {
            contract: 'GSA-2023-CONST-369',
            value: 3200000,
            rating: 4.2,
            year: 2023
          }
        ],
        rating: '4.1',
        isActive: true,
      }
    ];

    // Check if suppliers already exist to avoid duplicates
    const existingSuppliers = await db.select().from(suppliers).limit(1);
    
    if (existingSuppliers.length === 0) {
      await db.insert(suppliers).values(suppliersData);
      console.log(`Seeded ${suppliersData.length} suppliers successfully`);
      return { success: true, count: suppliersData.length };
    } else {
      console.log('Suppliers already exist, skipping seed');
      return { success: true, count: 0, message: 'Suppliers already exist' };
    }
  } catch (error) {
    console.error('Error seeding suppliers:', error);
    return { success: false, error: error.message };
  }
}