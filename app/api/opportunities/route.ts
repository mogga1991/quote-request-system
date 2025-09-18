import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { SamGovService } from '@/lib/services/sam-gov';
import { db } from '@/db/drizzle';
import { opportunities } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const naicsCode = searchParams.get('naicsCode') || undefined;
    const department = searchParams.get('department') || undefined;
    const refresh = searchParams.get('refresh') === 'true';

    const samGovService = new SamGovService();

    // If refresh is requested or we have no opportunities in DB, fetch from SAM.gov
    if (refresh) {
      const samGovData = await samGovService.fetchOpportunities({
        limit,
        offset,
        naicsCode,
        department,
      });

      // Store opportunities in database
      for (const opportunity of samGovData.opportunities) {
        try {
          // Check if opportunity already exists
          const existing = await db
            .select()
            .from(opportunities)
            .where(eq(opportunities.noticeId, opportunity.noticeId))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(opportunities).values({
              id: nanoid(),
              noticeId: opportunity.noticeId,
              title: opportunity.title,
              department: opportunity.department,
              office: opportunity.office || null,
              postedDate: new Date(opportunity.postedDate),
              responseDeadline: new Date(opportunity.responseDeadline),
              naicsCode: opportunity.naicsCode || null,
              setAsideCode: opportunity.setAsideCode || null,
              classificationCode: opportunity.classificationCode || null,
              description: opportunity.description || null,
              solicitationNumber: opportunity.solicitationNumber || null,
              contactEmail: opportunity.contactEmail || null,
              contactPhone: opportunity.contactPhone || null,
              place: opportunity.place || null,
              additionalInfo: opportunity.additionalInfo || null,
              link: opportunity.link || null,
              status: 'active',
              estimatedValue: opportunity.estimatedValue?.toString() || null,
              contractType: opportunity.contractType || null,
              rawData: opportunity,
            });
          }
        } catch (error) {
          console.error('Error storing opportunity:', error);
          // Continue with other opportunities even if one fails
        }
      }

      return NextResponse.json({
        opportunities: samGovData.opportunities,
        totalRecords: samGovData.totalRecords,
        page: samGovData.page,
        size: samGovData.size,
        source: 'sam.gov',
      });
    } else {
      // Fetch from database
      const dbOpportunities = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.status, 'active'))
        .limit(limit)
        .offset(offset);

      const transformedOpportunities = dbOpportunities.map(opp => ({
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
      }));

      return NextResponse.json({
        opportunities: transformedOpportunities,
        totalRecords: transformedOpportunities.length,
        page: Math.floor(offset / limit) + 1,
        size: limit,
        source: 'database',
      });
    }
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'seed-suppliers') {
      // Import and run the seed function
      const { seedSuppliersData } = await import('@/lib/services/seed-suppliers');
      const result = await seedSuppliersData();
      
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}