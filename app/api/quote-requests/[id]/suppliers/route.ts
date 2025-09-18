import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuoteRequestById } from '@/lib/services/quote-requests';
import { db } from '@/db/drizzle';
import { quoteRequestSuppliers, suppliers } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// Validation schemas
const inviteSupplierSchema = z.object({
  supplierIds: z.array(z.string().min(1)).min(1, 'At least one supplier must be selected').max(20, 'Maximum 20 suppliers can be invited at once'),
  notificationMethod: z.enum(['email', 'platform', 'manual']).optional().default('email'),
  customMessage: z.string().max(1000).optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/quote-requests/[id]/suppliers - Get invited suppliers for quote request
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify quote request exists and user owns it
    const quoteRequest = await getQuoteRequestById(params.id);
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (quoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get invited suppliers with their details
    const invitedSuppliers = await db
      .select({
        invitation: quoteRequestSuppliers,
        supplier: suppliers
      })
      .from(quoteRequestSuppliers)
      .innerJoin(suppliers, eq(quoteRequestSuppliers.supplierId, suppliers.id))
      .where(eq(quoteRequestSuppliers.quoteRequestId, params.id));

    return NextResponse.json({
      success: true,
      data: invitedSuppliers.map(({ invitation, supplier }) => ({
        ...supplier,
        invitation: {
          id: invitation.id,
          invitedAt: invitation.invitedAt,
          notificationSent: invitation.notificationSent,
          notificationMethod: invitation.notificationMethod,
          createdAt: invitation.createdAt
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching invited suppliers:', error);
    return NextResponse.json({
      error: 'Failed to fetch invited suppliers'
    }, { status: 500 });
  }
}

// POST /api/quote-requests/[id]/suppliers - Invite suppliers to quote request
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify quote request exists and user owns it
    const quoteRequest = await getQuoteRequestById(params.id);
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (quoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow inviting to completed quote requests
    if (quoteRequest.status === 'completed' || quoteRequest.status === 'expired') {
      return NextResponse.json({
        error: 'Cannot invite suppliers to completed or expired quote requests'
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = inviteSupplierSchema.parse(body);

    // Check if suppliers exist
    const existingSuppliers = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(inArray(suppliers.id, validatedData.supplierIds));

    if (existingSuppliers.length !== validatedData.supplierIds.length) {
      const foundIds = existingSuppliers.map(s => s.id);
      const missingIds = validatedData.supplierIds.filter(id => !foundIds.includes(id));
      return NextResponse.json({
        error: 'Some suppliers not found',
        missingSuppliers: missingIds
      }, { status: 400 });
    }

    // Check for already invited suppliers
    const alreadyInvited = await db
      .select({ supplierId: quoteRequestSuppliers.supplierId })
      .from(quoteRequestSuppliers)
      .where(
        and(
          eq(quoteRequestSuppliers.quoteRequestId, params.id),
          inArray(quoteRequestSuppliers.supplierId, validatedData.supplierIds)
        )
      );

    if (alreadyInvited.length > 0) {
      const alreadyInvitedIds = alreadyInvited.map(i => i.supplierId);
      return NextResponse.json({
        error: 'Some suppliers already invited',
        alreadyInvitedSuppliers: alreadyInvitedIds
      }, { status: 400 });
    }

    // Create invitations
    const invitations = validatedData.supplierIds.map(supplierId => ({
      id: nanoid(),
      quoteRequestId: params.id,
      supplierId,
      invitedAt: new Date(),
      notificationMethod: validatedData.notificationMethod,
      notificationSent: false, // Will be updated after notification is sent
      createdAt: new Date()
    }));

    await db.insert(quoteRequestSuppliers).values(invitations);

    // Here you would typically trigger notification sending
    // For now, we'll just mark notifications as sent for email/platform methods
    if (validatedData.notificationMethod !== 'manual') {
      await db
        .update(quoteRequestSuppliers)
        .set({ notificationSent: true })
        .where(
          and(
            eq(quoteRequestSuppliers.quoteRequestId, params.id),
            inArray(quoteRequestSuppliers.supplierId, validatedData.supplierIds)
          )
        );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully invited ${validatedData.supplierIds.length} supplier(s)`,
      data: {
        invitedCount: validatedData.supplierIds.length,
        notificationMethod: validatedData.notificationMethod,
        notificationsSent: validatedData.notificationMethod !== 'manual'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error inviting suppliers:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to invite suppliers'
    }, { status: 500 });
  }
}

// DELETE /api/quote-requests/[id]/suppliers - Remove supplier invitations
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify quote request exists and user owns it
    const quoteRequest = await getQuoteRequestById(params.id);
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (quoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const supplierIds = searchParams.get('supplierIds')?.split(',') || [];

    if (supplierIds.length === 0) {
      return NextResponse.json({
        error: 'Supplier IDs required'
      }, { status: 400 });
    }

    // Don't allow removing invitations if quote request is sent and has responses
    if (quoteRequest.status === 'sent') {
      // Check if any of these suppliers have submitted responses
      const responsesExist = await db
        .select({ count: 1 })
        .from(quoteRequest.supplierResponses || [])
        .limit(1);

      if (responsesExist.length > 0) {
        return NextResponse.json({
          error: 'Cannot remove supplier invitations after responses have been submitted'
        }, { status: 400 });
      }
    }

    // Remove invitations
    const result = await db
      .delete(quoteRequestSuppliers)
      .where(
        and(
          eq(quoteRequestSuppliers.quoteRequestId, params.id),
          inArray(quoteRequestSuppliers.supplierId, supplierIds)
        )
      );

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${supplierIds.length} supplier invitation(s)`
    });

  } catch (error) {
    console.error('Error removing supplier invitations:', error);
    return NextResponse.json({
      error: 'Failed to remove supplier invitations'
    }, { status: 500 });
  }
}