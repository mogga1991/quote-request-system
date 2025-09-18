import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  createQuoteRequest, 
  getUserQuoteRequests, 
  searchQuoteRequests 
} from '@/lib/services/quote-requests';
import { z } from 'zod';

// Validation schemas
const createQuoteRequestSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  deadline: z.string().datetime('Invalid deadline format'),
  requirements: z.array(z.object({
    category: z.string(),
    items: z.array(z.string())
  })).optional().default([]),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number().positive(),
    type: z.string()
  })).optional().default([]),
  aiGenerated: z.boolean().optional().default(false),
  aiPrompt: z.string().optional()
});

const searchQuerySchema = z.object({
  query: z.string().optional(),
  status: z.enum(['draft', 'sent', 'expired', 'completed']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'deadline', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// GET /api/quote-requests - List user's quote requests with search/filter
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = searchQuerySchema.parse(queryParams);

    let result;
    if (validatedParams.query) {
      // Search mode
      result = await searchQuoteRequests({
        query: validatedParams.query,
        status: validatedParams.status,
        userId: session.user.id,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder
      });
    } else {
      // List mode
      result = await getUserQuoteRequests(session.user.id, {
        status: validatedParams.status,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: result.total > validatedParams.offset + validatedParams.limit
      }
    });

  } catch (error) {
    console.error('Error fetching quote requests:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to fetch quote requests'
    }, { status: 500 });
  }
}

// POST /api/quote-requests - Create new quote request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createQuoteRequestSchema.parse(body);

    const quoteRequest = await createQuoteRequest({
      ...validatedData,
      userId: session.user.id,
      deadline: new Date(validatedData.deadline)
    });

    return NextResponse.json({
      success: true,
      data: quoteRequest
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating quote request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to create quote request'
    }, { status: 500 });
  }
}