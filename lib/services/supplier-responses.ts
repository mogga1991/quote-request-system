import { db } from '@/db/drizzle';
import { 
  supplierResponses,
  quoteRequests,
  suppliers,
  quoteRequestSuppliers
} from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// TypeScript types for Supplier Response System
export interface CreateSupplierResponseData {
  quoteRequestId: string;
  supplierId: string;
  lineItems?: LineItem[];
  totalPriceCents?: number;
  deliveryTimedays?: number;
  notes?: string;
  attachments?: any[];
  expiresAt?: Date;
}

export interface UpdateSupplierResponseData {
  status?: 'pending' | 'submitted' | 'declined' | 'expired';
  lineItems?: LineItem[];
  totalPriceCents?: number;
  deliveryTimedays?: number;
  notes?: string;
  attachments?: any[];
  expiresAt?: Date;
}

export interface LineItem {
  item: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  specifications?: string;
  notes?: string;
}

export interface SupplierResponseWithDetails {
  id: string;
  quoteRequestId: string;
  supplierId: string;
  status: string;
  lineItems: LineItem[] | null;
  totalPriceCents: number | null;
  deliveryTimedays: number | null;
  notes: string | null;
  attachments: any;
  submittedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  quoteRequest: {
    id: string;
    title: string;
    deadline: Date;
    requirements: any;
  };
  supplier: {
    id: string;
    name: string;
    contactEmail: string | null;
    contactPhone: string | null;
  };
}

export interface ResponseFilters {
  quoteRequestId?: string;
  supplierId?: string;
  status?: string;
  submittedAfter?: Date;
  submittedBefore?: Date;
}

export class SupplierResponseService {
  /**
   * Create a new supplier response
   */
  async createSupplierResponse(data: CreateSupplierResponseData): Promise<string> {
    const id = nanoid();
    
    await db.insert(supplierResponses).values({
      id,
      quoteRequestId: data.quoteRequestId,
      supplierId: data.supplierId,
      status: 'pending',
      lineItems: data.lineItems || null,
      totalPriceCents: data.totalPriceCents || null,
      deliveryTimedays: data.deliveryTimedays || null,
      notes: data.notes || null,
      attachments: data.attachments || null,
      expiresAt: data.expiresAt || null,
    });

    return id;
  }

  /**
   * Get supplier response by ID with full details
   */
  async getSupplierResponseById(id: string): Promise<SupplierResponseWithDetails | null> {
    const result = await db
      .select({
        // Response fields
        id: supplierResponses.id,
        quoteRequestId: supplierResponses.quoteRequestId,
        supplierId: supplierResponses.supplierId,
        status: supplierResponses.status,
        lineItems: supplierResponses.lineItems,
        totalPriceCents: supplierResponses.totalPriceCents,
        deliveryTimedays: supplierResponses.deliveryTimedays,
        notes: supplierResponses.notes,
        attachments: supplierResponses.attachments,
        submittedAt: supplierResponses.submittedAt,
        expiresAt: supplierResponses.expiresAt,
        createdAt: supplierResponses.createdAt,
        updatedAt: supplierResponses.updatedAt,
        // Quote request fields
        quoteRequestTitle: quoteRequests.title,
        quoteRequestDeadline: quoteRequests.deadline,
        quoteRequestRequirements: quoteRequests.requirements,
        // Supplier fields
        supplierName: suppliers.name,
        supplierContactEmail: suppliers.contactEmail,
        supplierContactPhone: suppliers.contactPhone,
      })
      .from(supplierResponses)
      .leftJoin(quoteRequests, eq(supplierResponses.quoteRequestId, quoteRequests.id))
      .leftJoin(suppliers, eq(supplierResponses.supplierId, suppliers.id))
      .where(eq(supplierResponses.id, id))
      .limit(1);

    if (!result.length) return null;

    const response = result[0];

    return {
      id: response.id,
      quoteRequestId: response.quoteRequestId,
      supplierId: response.supplierId,
      status: response.status,
      lineItems: response.lineItems as LineItem[] | null,
      totalPriceCents: response.totalPriceCents,
      deliveryTimedays: response.deliveryTimedays,
      notes: response.notes,
      attachments: response.attachments,
      submittedAt: response.submittedAt,
      expiresAt: response.expiresAt,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      quoteRequest: {
        id: response.quoteRequestId,
        title: response.quoteRequestTitle || '',
        deadline: response.quoteRequestDeadline || new Date(),
        requirements: response.quoteRequestRequirements,
      },
      supplier: {
        id: response.supplierId,
        name: response.supplierName || '',
        contactEmail: response.supplierContactEmail,
        contactPhone: response.supplierContactPhone,
      },
    };
  }

  /**
   * Update supplier response
   */
  async updateSupplierResponse(id: string, data: UpdateSupplierResponseData): Promise<boolean> {
    const updateData: any = {};
    
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Set submittedAt when status changes to submitted
      if (data.status === 'submitted') {
        updateData.submittedAt = new Date();
      }
    }
    
    if (data.lineItems !== undefined) updateData.lineItems = data.lineItems;
    if (data.totalPriceCents !== undefined) updateData.totalPriceCents = data.totalPriceCents;
    if (data.deliveryTimedays !== undefined) updateData.deliveryTimedays = data.deliveryTimedays;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    
    updateData.updatedAt = new Date();

    const result = await db
      .update(supplierResponses)
      .set(updateData)
      .where(eq(supplierResponses.id, id));

    return result.rowCount > 0;
  }

  /**
   * Submit supplier response (change status to submitted)
   */
  async submitSupplierResponse(id: string): Promise<boolean> {
    const result = await db
      .update(supplierResponses)
      .set({ 
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supplierResponses.id, id));

    return result.rowCount > 0;
  }

  /**
   * Decline supplier response
   */
  async declineSupplierResponse(id: string, reason?: string): Promise<boolean> {
    const updateData: any = {
      status: 'declined',
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.notes = reason;
    }

    const result = await db
      .update(supplierResponses)
      .set(updateData)
      .where(eq(supplierResponses.id, id));

    return result.rowCount > 0;
  }

  /**
   * Delete supplier response
   */
  async deleteSupplierResponse(id: string): Promise<boolean> {
    const result = await db
      .delete(supplierResponses)
      .where(eq(supplierResponses.id, id));

    return result.rowCount > 0;
  }

  /**
   * Get supplier response for a specific quote request and supplier
   */
  async getSupplierResponseByQuoteAndSupplier(
    quoteRequestId: string, 
    supplierId: string
  ): Promise<SupplierResponseWithDetails | null> {
    const result = await db
      .select({
        id: supplierResponses.id,
        quoteRequestId: supplierResponses.quoteRequestId,
        supplierId: supplierResponses.supplierId,
        status: supplierResponses.status,
        lineItems: supplierResponses.lineItems,
        totalPriceCents: supplierResponses.totalPriceCents,
        deliveryTimedays: supplierResponses.deliveryTimedays,
        notes: supplierResponses.notes,
        attachments: supplierResponses.attachments,
        submittedAt: supplierResponses.submittedAt,
        expiresAt: supplierResponses.expiresAt,
        createdAt: supplierResponses.createdAt,
        updatedAt: supplierResponses.updatedAt,
      })
      .from(supplierResponses)
      .where(
        and(
          eq(supplierResponses.quoteRequestId, quoteRequestId),
          eq(supplierResponses.supplierId, supplierId)
        )
      )
      .limit(1);

    if (!result.length) return null;

    // Get additional details
    const fullResponse = await this.getSupplierResponseById(result[0].id);
    return fullResponse;
  }

  /**
   * List responses for a quote request
   */
  async getResponsesForQuoteRequest(quoteRequestId: string): Promise<any[]> {
    return await db
      .select({
        id: supplierResponses.id,
        supplierId: supplierResponses.supplierId,
        status: supplierResponses.status,
        totalPriceCents: supplierResponses.totalPriceCents,
        deliveryTimedays: supplierResponses.deliveryTimedays,
        submittedAt: supplierResponses.submittedAt,
        supplierName: suppliers.name,
        supplierGsaSchedule: suppliers.gsaSchedule,
      })
      .from(supplierResponses)
      .leftJoin(suppliers, eq(supplierResponses.supplierId, suppliers.id))
      .where(eq(supplierResponses.quoteRequestId, quoteRequestId))
      .orderBy(desc(supplierResponses.submittedAt));
  }

  /**
   * List responses by supplier
   */
  async getResponsesBySupplier(supplierId: string, status?: string): Promise<any[]> {
    const conditions = [eq(supplierResponses.supplierId, supplierId)];
    
    if (status) {
      conditions.push(eq(supplierResponses.status, status));
    }

    return await db
      .select({
        id: supplierResponses.id,
        quoteRequestId: supplierResponses.quoteRequestId,
        status: supplierResponses.status,
        totalPriceCents: supplierResponses.totalPriceCents,
        submittedAt: supplierResponses.submittedAt,
        createdAt: supplierResponses.createdAt,
        quoteRequestTitle: quoteRequests.title,
        quoteRequestDeadline: quoteRequests.deadline,
      })
      .from(supplierResponses)
      .leftJoin(quoteRequests, eq(supplierResponses.quoteRequestId, quoteRequests.id))
      .where(and(...conditions))
      .orderBy(desc(supplierResponses.createdAt));
  }

  /**
   * Get response statistics for a quote request
   */
  async getQuoteRequestResponseStats(quoteRequestId: string): Promise<{
    totalInvited: number;
    totalResponses: number;
    submitted: number;
    pending: number;
    declined: number;
    averagePriceCents: number | null;
    lowestPriceCents: number | null;
    highestPriceCents: number | null;
  }> {
    // Get total invited suppliers
    const invitedResult = await db
      .select({ count: count() })
      .from(quoteRequestSuppliers)
      .where(eq(quoteRequestSuppliers.quoteRequestId, quoteRequestId));

    const totalInvited = invitedResult[0]?.count || 0;

    // Get response statistics
    const responses = await db
      .select({
        status: supplierResponses.status,
        totalPriceCents: supplierResponses.totalPriceCents,
      })
      .from(supplierResponses)
      .where(eq(supplierResponses.quoteRequestId, quoteRequestId));

    const totalResponses = responses.length;
    const submitted = responses.filter(r => r.status === 'submitted').length;
    const pending = responses.filter(r => r.status === 'pending').length;
    const declined = responses.filter(r => r.status === 'declined').length;

    // Calculate price statistics for submitted responses
    const submittedWithPrices = responses
      .filter(r => r.status === 'submitted' && r.totalPriceCents != null)
      .map(r => r.totalPriceCents!)
      .filter(price => price > 0);

    let averagePriceCents: number | null = null;
    let lowestPriceCents: number | null = null;
    let highestPriceCents: number | null = null;

    if (submittedWithPrices.length > 0) {
      averagePriceCents = Math.round(
        submittedWithPrices.reduce((sum, price) => sum + price, 0) / submittedWithPrices.length
      );
      lowestPriceCents = Math.min(...submittedWithPrices);
      highestPriceCents = Math.max(...submittedWithPrices);
    }

    return {
      totalInvited,
      totalResponses,
      submitted,
      pending,
      declined,
      averagePriceCents,
      lowestPriceCents,
      highestPriceCents,
    };
  }

  /**
   * Check if supplier is invited to quote request
   */
  async isSupplierInvited(quoteRequestId: string, supplierId: string): Promise<boolean> {
    const result = await db
      .select({ id: quoteRequestSuppliers.id })
      .from(quoteRequestSuppliers)
      .where(
        and(
          eq(quoteRequestSuppliers.quoteRequestId, quoteRequestId),
          eq(quoteRequestSuppliers.supplierId, supplierId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Calculate pricing summary for line items
   */
  calculatePricingSummary(lineItems: LineItem[]): {
    totalCents: number;
    itemCount: number;
    averageUnitPriceCents: number;
  } {
    if (!lineItems.length) {
      return {
        totalCents: 0,
        itemCount: 0,
        averageUnitPriceCents: 0,
      };
    }

    const totalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const averageUnitPriceCents = totalQuantity > 0 ? Math.round(totalCents / totalQuantity) : 0;

    return {
      totalCents,
      itemCount: lineItems.length,
      averageUnitPriceCents,
    };
  }

  /**
   * Validate line items for consistency
   */
  validateLineItems(lineItems: LineItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      
      if (!item.item || item.item.trim() === '') {
        errors.push(`Line item ${i + 1}: Item name is required`);
      }
      
      if (item.quantity <= 0) {
        errors.push(`Line item ${i + 1}: Quantity must be greater than 0`);
      }
      
      if (item.unitPriceCents < 0) {
        errors.push(`Line item ${i + 1}: Unit price cannot be negative`);
      }
      
      const expectedTotal = item.quantity * item.unitPriceCents;
      if (Math.abs(item.totalCents - expectedTotal) > 1) { // Allow 1 cent rounding difference
        errors.push(`Line item ${i + 1}: Total price doesn't match quantity × unit price`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}