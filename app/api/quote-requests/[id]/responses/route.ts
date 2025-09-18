import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuoteRequestById } from '@/lib/services/quote-requests';
import { 
  createSupplierResponse,
  getResponsesByQuoteRequest,
  updateSupplierResponse 
} from '@/lib/services/supplier-responses';
import { db } from '@/db/drizzle';
import { quoteRequestSuppliers, suppliers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const lineItemSchema = z.object({
  item: z.string().min(1, 'Item name is required').max(255),
  quantity: z.number().positive('Quantity must be positive'),
  unitPriceCents: z.number().positive('Unit price must be positive'),
  totalCents: z.number().positive('Total price must be positive'),
  specifications: z.string().max(1000).optional(),
  notes: z.string().max(500).optional()
});

const createResponseSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
  totalPriceCents: z.number().positive('Total price must be positive'),
  deliveryTimeDays: z.number().positive('Delivery time must be positive'),
  notes: z.string().max(2000).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number().positive(),
    type: z.string()
  })).optional().default([]),
  expiresAt: z.string().datetime().optional()
});

const updateResponseSchema = z.object({
  status: z.enum(['pending', 'submitted', 'declined']).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  totalPriceCents: z.number().positive().optional(),
  deliveryTimeDays: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number().positive(),
    type: z.string()
  })).optional(),
  expiresAt: z.string().datetime().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/quote-requests/[id]/responses - Get all responses for quote request
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

    const responses = await getResponsesByQuoteRequest(params.id);

    // Calculate summary statistics
    const submittedResponses = responses.filter(r => r.status === 'submitted');
    const summary = {
      totalInvited: quoteRequest.suppliers?.length || 0,
      totalResponses: responses.length,
      submittedResponses: submittedResponses.length,
      declinedResponses: responses.filter(r => r.status === 'declined').length,
      pendingResponses: responses.filter(r => r.status === 'pending').length,
      averagePrice: submittedResponses.length > 0 
        ? Math.round(submittedResponses.reduce((sum, r) => sum + (r.totalPriceCents || 0), 0) / submittedResponses.length)
        : null,
      lowestPrice: submittedResponses.length > 0
        ? Math.min(...submittedResponses.map(r => r.totalPriceCents || 0))
        : null,
      highestPrice: submittedResponses.length > 0
        ? Math.max(...submittedResponses.map(r => r.totalPriceCents || 0))
        : null
    };

    return NextResponse.json({
      success: true,
      data: responses,
      summary
    });

  } catch (error) {
    console.error('Error fetching quote responses:', error);
    return NextResponse.json({
      error: 'Failed to fetch quote responses'
    }, { status: 500 });
  }
}

// POST /api/quote-requests/[id]/responses - Submit supplier response (for suppliers)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For this endpoint, we need to identify the supplier
    // In a real system, you might have supplier authentication
    // For now, we'll require a supplierId in the request body
    const body = await request.json();
    const supplierId = body.supplierId;

    if (!supplierId) {
      return NextResponse.json({
        error: 'Supplier ID is required'
      }, { status: 400 });
    }

    // Verify quote request exists
    const quoteRequest = await getQuoteRequestById(params.id);
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Check if quote request is still accepting responses
    if (quoteRequest.status !== 'sent') {
      return NextResponse.json({
        error: 'Quote request is not accepting responses'
      }, { status: 400 });
    }

    // Check if deadline has passed
    if (new Date() > new Date(quoteRequest.deadline)) {
      return NextResponse.json({
        error: 'Quote request deadline has passed'
      }, { status: 400 });
    }

    // Verify supplier was invited
    const invitation = await db
      .select()
      .from(quoteRequestSuppliers)
      .where(
        and(
          eq(quoteRequestSuppliers.quoteRequestId, params.id),
          eq(quoteRequestSuppliers.supplierId, supplierId)
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json({
        error: 'Supplier not invited to this quote request'
      }, { status: 403 });
    }

    // Validate request data
    const validatedData = createResponseSchema.parse(body);

    // Validate line item totals
    const calculatedTotal = validatedData.lineItems.reduce((sum, item) => {
      const expectedTotal = item.quantity * item.unitPriceCents;
      if (item.totalCents !== expectedTotal) {
        throw new Error(`Line item total mismatch for "${item.item}"`);
      }
      return sum + item.totalCents;
    }, 0);

    if (calculatedTotal !== validatedData.totalPriceCents) {
      return NextResponse.json({
        error: 'Total price does not match sum of line items'
      }, { status: 400 });
    }

    // Create response
    const response = await createSupplierResponse({
      quoteRequestId: params.id,
      supplierId,
      lineItems: validatedData.lineItems,
      totalPriceCents: validatedData.totalPriceCents,
      deliveryTimeDays: validatedData.deliveryTimeDays,
      notes: validatedData.notes,
      attachments: validatedData.attachments,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Response submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting supplier response:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('Line item total mismatch')) {
      return NextResponse.json({
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to submit response'
    }, { status: 500 });
  }
}