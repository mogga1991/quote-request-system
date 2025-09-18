import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuoteRequestById } from '@/lib/services/quote-requests';
import { getResponsesByQuoteRequest } from '@/lib/services/supplier-responses';
import { 
  generateDownloadFileName,
  createExportData,
  formatPriceCents,
  formatDeliveryTime,
  formatQuoteRequestStatus,
  formatSupplierResponseStatus
} from '@/lib/utils/quote-utils';
import { z } from 'zod';

// Validation schema
const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('csv'),
  type: z.enum(['quote-request', 'responses', 'analysis']).optional().default('quote-request'),
  includeLineItems: z.coerce.boolean().optional().default(false)
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/quote-requests/[id]/export - Export quote request data
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

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = exportQuerySchema.parse(queryParams);

    // Get responses
    const responses = await getResponsesByQuoteRequest(params.id);
    const submittedResponses = responses.filter(r => r.status === 'submitted');

    let exportData;
    let filename;

    switch (validatedParams.type) {
      case 'quote-request':
        exportData = exportQuoteRequestData(quoteRequest, validatedParams.format);
        filename = generateDownloadFileName('quote-request', quoteRequest.title, validatedParams.format as 'csv' | 'xlsx' | 'pdf');
        break;

      case 'responses':
        exportData = exportResponsesData(quoteRequest, responses, validatedParams.format, validatedParams.includeLineItems);
        filename = generateDownloadFileName('responses', quoteRequest.title, validatedParams.format as 'csv' | 'xlsx' | 'pdf');
        break;

      case 'analysis':
        exportData = exportAnalysisData(quoteRequest, responses, submittedResponses, validatedParams.format);
        filename = generateDownloadFileName('analysis', quoteRequest.title, validatedParams.format as 'csv' | 'xlsx' | 'pdf');
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (validatedParams.format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'application/json'
        }
      });
    }

    // For CSV format
    const csvContent = convertToCSV(exportData.headers, exportData.rows);
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'text/csv'
      }
    });

  } catch (error) {
    console.error('Error exporting quote request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid export parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to export quote request'
    }, { status: 500 });
  }
}

function exportQuoteRequestData(quoteRequest: any, format: string) {
  const headers = [
    'Quote Request ID',
    'Title',
    'Description',
    'Status',
    'Opportunity ID',
    'Opportunity Title',
    'Department',
    'Deadline',
    'Suppliers Invited',
    'AI Generated',
    'Created At',
    'Updated At'
  ];

  const row = [
    quoteRequest.id,
    quoteRequest.title,
    quoteRequest.description || '',
    formatQuoteRequestStatus(quoteRequest.status).label,
    quoteRequest.opportunityId,
    quoteRequest.opportunity?.title || '',
    quoteRequest.opportunity?.department || '',
    new Date(quoteRequest.deadline).toLocaleDateString(),
    quoteRequest.suppliers?.length || 0,
    quoteRequest.aiGenerated ? 'Yes' : 'No',
    new Date(quoteRequest.createdAt).toLocaleDateString(),
    new Date(quoteRequest.updatedAt).toLocaleDateString()
  ];

  return createExportData(headers, [row], `Quote Request: ${quoteRequest.title}`);
}

function exportResponsesData(quoteRequest: any, responses: any[], format: string, includeLineItems: boolean) {
  const headers = [
    'Response ID',
    'Supplier Name',
    'Status',
    'Total Price',
    'Delivery Time',
    'Submitted At',
    'Notes'
  ];

  if (includeLineItems) {
    headers.push('Line Items');
  }

  const rows = responses.map(response => {
    const row = [
      response.id,
      response.supplier?.name || 'Unknown',
      formatSupplierResponseStatus(response.status).label,
      response.totalPriceCents ? formatPriceCents(response.totalPriceCents) : 'N/A',
      response.deliveryTimeDays ? formatDeliveryTime(response.deliveryTimeDays) : 'N/A',
      response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : 'Not submitted',
      response.notes || ''
    ];

    if (includeLineItems && response.lineItems) {
      const lineItemsText = response.lineItems
        .map((item: any) => `${item.item} (${item.quantity}x ${formatPriceCents(item.unitPriceCents)})`)
        .join('; ');
      row.push(lineItemsText);
    } else if (includeLineItems) {
      row.push('');
    }

    return row;
  });

  return createExportData(headers, rows, `Responses for: ${quoteRequest.title}`);
}

function exportAnalysisData(quoteRequest: any, responses: any[], submittedResponses: any[], format: string) {
  // Summary data
  const summaryHeaders = ['Metric', 'Value'];
  const summaryRows = [
    ['Quote Request Title', quoteRequest.title],
    ['Total Suppliers Invited', quoteRequest.suppliers?.length || 0],
    ['Total Responses', responses.length],
    ['Submitted Responses', submittedResponses.length],
    ['Declined Responses', responses.filter(r => r.status === 'declined').length],
    ['Pending Responses', responses.filter(r => r.status === 'pending').length],
    ['Response Rate', `${Math.round((responses.length / (quoteRequest.suppliers?.length || 1)) * 100)}%`]
  ];

  if (submittedResponses.length > 0) {
    const prices = submittedResponses.map(r => r.totalPriceCents || 0);
    const deliveryTimes = submittedResponses.map(r => r.deliveryTimeDays || 0);

    summaryRows.push(
      ['Lowest Price', formatPriceCents(Math.min(...prices))],
      ['Highest Price', formatPriceCents(Math.max(...prices))],
      ['Average Price', formatPriceCents(Math.round(prices.reduce((a, b) => a + b, 0) / prices.length))],
      ['Fastest Delivery', formatDeliveryTime(Math.min(...deliveryTimes))],
      ['Slowest Delivery', formatDeliveryTime(Math.max(...deliveryTimes))],
      ['Average Delivery', formatDeliveryTime(Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length))]
    );
  }

  return createExportData(summaryHeaders, summaryRows, `Analysis for: ${quoteRequest.title}`);
}

function convertToCSV(headers: string[], rows: any[][]): string {
  const csvRows = [headers, ...rows];
  
  return csvRows
    .map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');
}