import { db } from '@/db/drizzle';
import { 
  quoteRequests, 
  quoteRequestSuppliers, 
  supplierResponses,
  opportunities,
  suppliers,
  user
} from '@/db/schema';
import { eq, and, desc, asc, count, or, like, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// TypeScript types for Quote Request System
export interface CreateQuoteRequestData {
  opportunityId: string;
  userId: string;
  title: string;
  description?: string;
  requirements?: Record<string, unknown>;
  deadline: Date;
  attachments?: Record<string, unknown>[];
  aiGenerated?: boolean;
  aiPrompt?: string;
}

export interface UpdateQuoteRequestData {
  title?: string;
  description?: string;
  status?: 'draft' | 'sent' | 'expired' | 'completed';
  requirements?: Record<string, unknown>;
  deadline?: Date;
  attachments?: Record<string, unknown>[];
}

export interface QuoteRequestWithDetails {
  id: string;
  opportunityId: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  requirements: Record<string, unknown>;
  deadline: Date;
  attachments: Record<string, unknown>;
  aiGenerated: boolean;
  aiPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity: {
    id: string;
    title: string;
    department: string;
    noticeId: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  suppliers: Array<{
    id: string;
    name: string;
    contactEmail: string | null;
    gsaSchedule: boolean;
    invitedAt: Date;
    notificationSent: boolean;
  }>;
  responses: Array<{
    id: string;
    supplierId: string;
    status: string;
    totalPriceCents: number | null;
    submittedAt: Date | null;
  }>;
}

export interface SupplierInvitation {
  supplierId: string;
  notificationMethod?: 'email' | 'platform' | 'manual';
}

export interface QuoteRequestFilters {
  userId?: string;
  status?: string;
  opportunityId?: string;
  search?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  aiGenerated?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'deadline' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export class QuoteRequestService {
  /**
   * Create a new quote request
   */
  async createQuoteRequest(data: CreateQuoteRequestData): Promise<string> {
    const id = nanoid();
    
    await db.insert(quoteRequests).values({
      id,
      opportunityId: data.opportunityId,
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      requirements: data.requirements || null,
      deadline: data.deadline,
      attachments: data.attachments || null,
      aiGenerated: data.aiGenerated || false,
      aiPrompt: data.aiPrompt || null,
      status: 'draft',
    });

    return id;
  }

  /**
   * Get quote request by ID with full details
   */
  async getQuoteRequestById(id: string): Promise<QuoteRequestWithDetails | null> {
    const result = await db
      .select({
        // Quote request fields
        id: quoteRequests.id,
        opportunityId: quoteRequests.opportunityId,
        userId: quoteRequests.userId,
        title: quoteRequests.title,
        description: quoteRequests.description,
        status: quoteRequests.status,
        requirements: quoteRequests.requirements,
        deadline: quoteRequests.deadline,
        attachments: quoteRequests.attachments,
        aiGenerated: quoteRequests.aiGenerated,
        aiPrompt: quoteRequests.aiPrompt,
        createdAt: quoteRequests.createdAt,
        updatedAt: quoteRequests.updatedAt,
        // Opportunity fields
        opportunityTitle: opportunities.title,
        opportunityDepartment: opportunities.department,
        opportunityNoticeId: opportunities.noticeId,
        // User fields
        userName: user.name,
        userEmail: user.email,
      })
      .from(quoteRequests)
      .leftJoin(opportunities, eq(quoteRequests.opportunityId, opportunities.id))
      .leftJoin(user, eq(quoteRequests.userId, user.id))
      .where(eq(quoteRequests.id, id))
      .limit(1);

    if (!result.length) return null;

    const quoteRequest = result[0];

    // Get suppliers and responses separately to avoid complex joins
    const suppliersData = await this.getQuoteRequestSuppliers(id);
    const responsesData = await this.getQuoteRequestResponses(id);

    return {
      id: quoteRequest.id,
      opportunityId: quoteRequest.opportunityId,
      userId: quoteRequest.userId,
      title: quoteRequest.title,
      description: quoteRequest.description,
      status: quoteRequest.status,
      requirements: quoteRequest.requirements,
      deadline: quoteRequest.deadline,
      attachments: quoteRequest.attachments,
      aiGenerated: quoteRequest.aiGenerated,
      aiPrompt: quoteRequest.aiPrompt,
      createdAt: quoteRequest.createdAt,
      updatedAt: quoteRequest.updatedAt,
      opportunity: {
        id: quoteRequest.opportunityId,
        title: quoteRequest.opportunityTitle || '',
        department: quoteRequest.opportunityDepartment || '',
        noticeId: quoteRequest.opportunityNoticeId || '',
      },
      user: {
        id: quoteRequest.userId,
        name: quoteRequest.userName || '',
        email: quoteRequest.userEmail || '',
      },
      suppliers: suppliersData,
      responses: responsesData,
    };
  }

  /**
   * Update quote request
   */
  async updateQuoteRequest(id: string, data: UpdateQuoteRequestData): Promise<boolean> {
    const updateData: Record<string, unknown> = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    
    updateData.updatedAt = new Date();

    const result = await db
      .update(quoteRequests)
      .set(updateData)
      .where(eq(quoteRequests.id, id));

    return result.rowCount > 0;
  }

  /**
   * Delete quote request and all related data
   */
  async deleteQuoteRequest(id: string): Promise<boolean> {
    // Drizzle will handle cascade deletes based on schema foreign key constraints
    const result = await db
      .delete(quoteRequests)
      .where(eq(quoteRequests.id, id));

    return result.rowCount > 0;
  }

  /**
   * List quote requests with filtering and pagination
   */
  async listQuoteRequests(
    filters: QuoteRequestFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ data: Record<string, unknown>[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    if (filters.userId) {
      conditions.push(eq(quoteRequests.userId, filters.userId));
    }
    
    if (filters.status) {
      conditions.push(eq(quoteRequests.status, filters.status));
    }
    
    if (filters.opportunityId) {
      conditions.push(eq(quoteRequests.opportunityId, filters.opportunityId));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(quoteRequests.title, `%${filters.search}%`),
          like(quoteRequests.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.deadlineFrom) {
      conditions.push(gte(quoteRequests.deadline, filters.deadlineFrom));
    }
    
    if (filters.deadlineTo) {
      conditions.push(lte(quoteRequests.deadline, filters.deadlineTo));
    }
    
    if (filters.aiGenerated !== undefined) {
      conditions.push(eq(quoteRequests.aiGenerated, filters.aiGenerated));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(quoteRequests)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Build sort order
    const sortColumn = quoteRequests[sortBy as keyof typeof quoteRequests];
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get paginated data
    const data = await db
      .select({
        id: quoteRequests.id,
        title: quoteRequests.title,
        status: quoteRequests.status,
        deadline: quoteRequests.deadline,
        aiGenerated: quoteRequests.aiGenerated,
        createdAt: quoteRequests.createdAt,
        opportunityTitle: opportunities.title,
        opportunityDepartment: opportunities.department,
      })
      .from(quoteRequests)
      .leftJoin(opportunities, eq(quoteRequests.opportunityId, opportunities.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Invite suppliers to quote request
   */
  async inviteSuppliers(quoteRequestId: string, invitations: SupplierInvitation[]): Promise<boolean> {
    const invitationData = invitations.map(invitation => ({
      id: nanoid(),
      quoteRequestId,
      supplierId: invitation.supplierId,
      notificationMethod: invitation.notificationMethod || 'platform',
      notificationSent: false,
    }));

    try {
      await db.insert(quoteRequestSuppliers).values(invitationData);
      return true;
    } catch (error) {
      console.error('Error inviting suppliers:', error);
      return false;
    }
  }

  /**
   * Remove supplier invitation
   */
  async removeSupplierInvitation(quoteRequestId: string, supplierId: string): Promise<boolean> {
    const result = await db
      .delete(quoteRequestSuppliers)
      .where(
        and(
          eq(quoteRequestSuppliers.quoteRequestId, quoteRequestId),
          eq(quoteRequestSuppliers.supplierId, supplierId)
        )
      );

    return result.rowCount > 0;
  }

  /**
   * Get suppliers invited to a quote request
   */
  async getQuoteRequestSuppliers(quoteRequestId: string) {
    return await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        contactEmail: suppliers.contactEmail,
        gsaSchedule: suppliers.gsaSchedule,
        invitedAt: quoteRequestSuppliers.invitedAt,
        notificationSent: quoteRequestSuppliers.notificationSent,
      })
      .from(quoteRequestSuppliers)
      .leftJoin(suppliers, eq(quoteRequestSuppliers.supplierId, suppliers.id))
      .where(eq(quoteRequestSuppliers.quoteRequestId, quoteRequestId));
  }

  /**
   * Get responses for a quote request
   */
  async getQuoteRequestResponses(quoteRequestId: string) {
    return await db
      .select({
        id: supplierResponses.id,
        supplierId: supplierResponses.supplierId,
        status: supplierResponses.status,
        totalPriceCents: supplierResponses.totalPriceCents,
        submittedAt: supplierResponses.submittedAt,
      })
      .from(supplierResponses)
      .where(eq(supplierResponses.quoteRequestId, quoteRequestId));
  }

  /**
   * Update notification status for supplier invitation
   */
  async updateNotificationStatus(quoteRequestId: string, supplierId: string, sent: boolean): Promise<boolean> {
    const result = await db
      .update(quoteRequestSuppliers)
      .set({ 
        notificationSent: sent,
      })
      .where(
        and(
          eq(quoteRequestSuppliers.quoteRequestId, quoteRequestId),
          eq(quoteRequestSuppliers.supplierId, supplierId)
        )
      );

    return result.rowCount > 0;
  }

  /**
   * Get quote requests for a specific opportunity
   */
  async getQuoteRequestsByOpportunity(opportunityId: string): Promise<Record<string, unknown>[]> {
    return await db
      .select({
        id: quoteRequests.id,
        title: quoteRequests.title,
        status: quoteRequests.status,
        deadline: quoteRequests.deadline,
        createdAt: quoteRequests.createdAt,
        userName: user.name,
      })
      .from(quoteRequests)
      .leftJoin(user, eq(quoteRequests.userId, user.id))
      .where(eq(quoteRequests.opportunityId, opportunityId))
      .orderBy(desc(quoteRequests.createdAt));
  }

  /**
   * Get quote requests by user
   */
  async getQuoteRequestsByUser(userId: string, status?: string): Promise<Record<string, unknown>[]> {
    const conditions = [eq(quoteRequests.userId, userId)];
    
    if (status) {
      conditions.push(eq(quoteRequests.status, status));
    }

    return await db
      .select({
        id: quoteRequests.id,
        title: quoteRequests.title,
        status: quoteRequests.status,
        deadline: quoteRequests.deadline,
        createdAt: quoteRequests.createdAt,
        opportunityTitle: opportunities.title,
      })
      .from(quoteRequests)
      .leftJoin(opportunities, eq(quoteRequests.opportunityId, opportunities.id))
      .where(and(...conditions))
      .orderBy(desc(quoteRequests.createdAt));
  }
}

// Create and export service instance
export const quoteRequestService = new QuoteRequestService();

// Export convenience functions
export async function getQuoteRequestById(id: string): Promise<QuoteRequestWithDetails | null> {
  return await quoteRequestService.getQuoteRequestById(id);
}

export async function createQuoteRequest(data: CreateQuoteRequestData): Promise<string> {
  return await quoteRequestService.createQuoteRequest(data);
}

export async function updateQuoteRequest(id: string, data: UpdateQuoteRequestData): Promise<boolean> {
  return await quoteRequestService.updateQuoteRequest(id, data);
}

export async function deleteQuoteRequest(id: string): Promise<boolean> {
  return await quoteRequestService.deleteQuoteRequest(id);
}

export async function searchQuoteRequests(params: {
  query: string;
  status?: string;
  userId: string;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: string;
}): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const filters: QuoteRequestFilters = {
    userId: params.userId,
    status: params.status,
    search: params.query,
  };

  const pagination: PaginationOptions = {
    page: Math.floor(params.offset / params.limit) + 1,
    limit: params.limit,
    sortBy: params.sortBy as any,
    sortOrder: params.sortOrder as any,
  };

  return await quoteRequestService.listQuoteRequests(filters, pagination);
}

export async function getUserQuoteRequests(userId: string, options: {
  status?: string;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: string;
}): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const filters: QuoteRequestFilters = {
    userId,
    status: options.status,
  };

  const pagination: PaginationOptions = {
    page: Math.floor(options.offset / options.limit) + 1,
    limit: options.limit,
    sortBy: options.sortBy as any,
    sortOrder: options.sortOrder as any,
  };

  return await quoteRequestService.listQuoteRequests(filters, pagination);
}