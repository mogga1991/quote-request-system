import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuoteRequestById } from '@/lib/services/quote-requests';
import { 
  getSupplierResponseById,
  updateSupplierResponse,
  deleteSupplierResponse
} from '@/lib/services/supplier-responses';
import { z } from 'zod';

// Validation schemas
const lineItemSchema = z.object({
  item: z.string().min(1).max(255),
  quantity: z.number().positive(),
  unitPriceCents: z.number().positive(),
  totalCents: z.number().positive(),
  specifications: z.string().max(1000).optional(),
  notes: z.string().max(500).optional()
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
    responseId: string;
  };
}

// GET /api/quote-requests/[id]/responses/[responseId] - Get specific response
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

    // Get the specific response
    const response = await getSupplierResponseById(params.responseId);
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Verify response belongs to this quote request
    if (response.quoteRequestId !== params.id) {
      return NextResponse.json({ error: 'Response does not belong to this quote request' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching supplier response:', error);
    return NextResponse.json({
      error: 'Failed to fetch supplier response'
    }, { status: 500 });
  }
}

// PUT /api/quote-requests/[id]/responses/[responseId] - Update response (for suppliers)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing response
    const existingResponse = await getSupplierResponseById(params.responseId);
    if (!existingResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Verify response belongs to this quote request
    if (existingResponse.quoteRequestId !== params.id) {
      return NextResponse.json({ error: 'Response does not belong to this quote request' }, { status: 400 });
    }

    // For supplier updates, verify the supplier owns this response
    // In a real system, you'd have supplier authentication
    const body = await request.json();
    const requestingSupplierId = body.supplierId;

    if (requestingSupplierId && existingResponse.supplierId !== requestingSupplierId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow updates to submitted responses unless changing to declined
    if (existingResponse.status === 'submitted' && body.status !== 'declined') {
      return NextResponse.json({
        error: 'Cannot modify submitted response'
      }, { status: 400 });
    }

    // Validate request data
    const validatedData = updateResponseSchema.parse(body);

    // If updating line items, validate totals
    if (validatedData.lineItems && validatedData.totalPriceCents) {
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
    }

    // Prepare update data
    const updateData = {
      ...validatedData,
      ...(validatedData.expiresAt && { expiresAt: new Date(validatedData.expiresAt) }),
      ...(validatedData.status === 'submitted' && { submittedAt: new Date() })
    };

    // Remove supplierId from update data
    delete updateData.supplierId;

    const updatedResponse = await updateSupplierResponse(params.responseId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedResponse,
      message: 'Response updated successfully'
    });

  } catch (error) {
    console.error('Error updating supplier response:', error);
    
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
      error: 'Failed to update response'
    }, { status: 500 });
  }
}

// DELETE /api/quote-requests/[id]/responses/[responseId] - Delete response
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing response
    const existingResponse = await getSupplierResponseById(params.responseId);
    if (!existingResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Verify response belongs to this quote request
    if (existingResponse.quoteRequestId !== params.id) {
      return NextResponse.json({ error: 'Response does not belong to this quote request' }, { status: 400 });
    }

    // Get quote request to verify ownership
    const quoteRequest = await getQuoteRequestById(params.id);
    if (!quoteRequest || quoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow deletion of submitted responses
    if (existingResponse.status === 'submitted') {
      return NextResponse.json({
        error: 'Cannot delete submitted response'
      }, { status: 400 });
    }

    await deleteSupplierResponse(params.responseId);

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting supplier response:', error);
    return NextResponse.json({
      error: 'Failed to delete response'
    }, { status: 500 });
  }
}