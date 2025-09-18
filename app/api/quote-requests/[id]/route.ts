import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getQuoteRequestById, 
  updateQuoteRequest, 
  deleteQuoteRequest 
} from '@/lib/services/quote-requests';
import { z } from 'zod';

// Validation schema for updates
const updateQuoteRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['draft', 'sent', 'expired', 'completed']).optional(),
  requirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  })).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number().positive(),
    type: z.string()
  })).optional(),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/quote-requests/[id] - Get specific quote request
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quoteRequest = await getQuoteRequestById(params.id);
    
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Check ownership
    if (quoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: quoteRequest
    });

  } catch (error) {
    console.error('Error fetching quote request:', error);
    return NextResponse.json({
      error: 'Failed to fetch quote request'
    }, { status: 500 });
  }
}

// PUT /api/quote-requests/[id] - Update quote request
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if quote request exists and user owns it
    const existingQuoteRequest = await getQuoteRequestById(params.id);
    if (!existingQuoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (existingQuoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateQuoteRequestSchema.parse(body);

    // Convert deadline if provided
    const updateData = {
      ...validatedData,
      ...(validatedData.deadline && { deadline: new Date(validatedData.deadline) })
    };

    const updatedQuoteRequest = await updateQuoteRequest(params.id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedQuoteRequest
    });

  } catch (error) {
    console.error('Error updating quote request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to update quote request'
    }, { status: 500 });
  }
}

// DELETE /api/quote-requests/[id] - Delete quote request
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if quote request exists and user owns it
    const existingQuoteRequest = await getQuoteRequestById(params.id);
    if (!existingQuoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (existingQuoteRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow deletion of sent quote requests that have responses
    if (existingQuoteRequest.status === 'sent' && existingQuoteRequest.supplierResponses && existingQuoteRequest.supplierResponses.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete quote request with supplier responses'
      }, { status: 400 });
    }

    await deleteQuoteRequest(params.id);

    return NextResponse.json({
      success: true,
      message: 'Quote request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quote request:', error);
    return NextResponse.json({
      error: 'Failed to delete quote request'
    }, { status: 500 });
  }
}