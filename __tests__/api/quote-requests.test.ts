import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/quote-requests/route';
import { GET as getQuoteRequest, PUT, DELETE } from '@/app/api/quote-requests/[id]/route';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}));

// Mock the service modules
vi.mock('@/lib/services/quote-requests', () => ({
  createQuoteRequest: vi.fn(),
  getUserQuoteRequests: vi.fn(),
  searchQuoteRequests: vi.fn(),
  getQuoteRequestById: vi.fn(),
  updateQuoteRequest: vi.fn(),
  deleteQuoteRequest: vi.fn(),
}));

import { auth } from '@/lib/auth';
import {
  createQuoteRequest,
  getUserQuoteRequests,
  searchQuoteRequests,
  getQuoteRequestById,
  updateQuoteRequest,
  deleteQuoteRequest,
} from '@/lib/services/quote-requests';

const mockAuth = vi.mocked(auth);
const mockCreateQuoteRequest = vi.mocked(createQuoteRequest);
const mockGetUserQuoteRequests = vi.mocked(getUserQuoteRequests);
const mockSearchQuoteRequests = vi.mocked(searchQuoteRequests);
const mockGetQuoteRequestById = vi.mocked(getQuoteRequestById);
const mockUpdateQuoteRequest = vi.mocked(updateQuoteRequest);
const mockDeleteQuoteRequest = vi.mocked(deleteQuoteRequest);

describe('Quote Requests API', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockSession = {
    user: mockUser
  };

  const mockQuoteRequest = {
    id: 'quote-123',
    userId: 'user-123',
    opportunityId: 'opp-123',
    title: 'Test Quote Request',
    description: 'Test description',
    status: 'draft',
    deadline: '2024-12-31T00:00:00.000Z',
    requirements: [],
    aiGenerated: false,
    createdAt: '2025-09-18T02:45:39.227Z',
    updatedAt: '2025-09-18T02:45:39.227Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/quote-requests', () => {
    it('should return unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/quote-requests');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return user quote requests', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetUserQuoteRequests.mockResolvedValue({
        data: [mockQuoteRequest],
        total: 1
      });

      const request = new NextRequest('http://localhost/api/quote-requests?limit=10&offset=0');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
      expect(mockGetUserQuoteRequests).toHaveBeenCalledWith('user-123', {
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
    });

    it('should handle search queries', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockSearchQuoteRequests.mockResolvedValue({
        data: [mockQuoteRequest],
        total: 1
      });

      const request = new NextRequest('http://localhost/api/quote-requests?query=test&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSearchQuoteRequests).toHaveBeenCalledWith({
        query: 'test',
        userId: 'user-123',
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
    });

    it('should validate query parameters', async () => {
      mockAuth.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/quote-requests?limit=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /api/quote-requests', () => {
    const validRequestBody = {
      opportunityId: 'opp-123',
      title: 'New Quote Request',
      description: 'Test description',
      deadline: '2024-12-31T23:59:59.000Z',
      requirements: [
        {
          category: 'Technical',
          items: ['Requirement 1']
        }
      ],
      aiGenerated: false
    };

    it('should create quote request successfully', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockCreateQuoteRequest.mockResolvedValue(mockQuoteRequest);

      const request = new NextRequest('http://localhost/api/quote-requests', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuoteRequest);
      expect(mockCreateQuoteRequest).toHaveBeenCalledWith({
        ...validRequestBody,
        userId: 'user-123',
        deadline: new Date(validRequestBody.deadline),
        attachments: []
      });
    });

    it('should validate required fields', async () => {
      mockAuth.mockResolvedValue(mockSession);

      const invalidRequestBody = {
        title: 'Missing opportunity ID'
      };

      const request = new NextRequest('http://localhost/api/quote-requests', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should require authentication', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/quote-requests', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/quote-requests/[id]', () => {
    it('should return quote request by ID', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetQuoteRequestById.mockResolvedValue(mockQuoteRequest);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123');
      const response = await getQuoteRequest(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuoteRequest);
    });

    it('should return 404 for non-existent quote request', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetQuoteRequestById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/quote-requests/nonexistent');
      const response = await getQuoteRequest(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });

    it('should check ownership', async () => {
      mockAuth.mockResolvedValue(mockSession);
      const otherUserQuoteRequest = { ...mockQuoteRequest, userId: 'other-user' };
      mockGetQuoteRequestById.mockResolvedValue(otherUserQuoteRequest);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123');
      const response = await getQuoteRequest(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/quote-requests/[id]', () => {
    const updateBody = {
      title: 'Updated Title',
      status: 'sent' as const
    };

    it('should update quote request successfully', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetQuoteRequestById.mockResolvedValue(mockQuoteRequest);
      const updatedQuoteRequest = { ...mockQuoteRequest, ...updateBody };
      mockUpdateQuoteRequest.mockResolvedValue(updatedQuoteRequest);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123', {
        method: 'PUT',
        body: JSON.stringify(updateBody)
      });

      const response = await PUT(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Title');
      expect(mockUpdateQuoteRequest).toHaveBeenCalledWith('quote-123', updateBody);
    });

    it('should validate update data', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetQuoteRequestById.mockResolvedValue(mockQuoteRequest);

      const invalidUpdateBody = {
        status: 'invalid-status'
      };

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123', {
        method: 'PUT',
        body: JSON.stringify(invalidUpdateBody)
      });

      const response = await PUT(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(400);
    });

    it('should check ownership before update', async () => {
      mockAuth.mockResolvedValue(mockSession);
      const otherUserQuoteRequest = { ...mockQuoteRequest, userId: 'other-user' };
      mockGetQuoteRequestById.mockResolvedValue(otherUserQuoteRequest);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123', {
        method: 'PUT',
        body: JSON.stringify(updateBody)
      });

      const response = await PUT(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/quote-requests/[id]', () => {
    it('should delete quote request successfully', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetQuoteRequestById.mockResolvedValue(mockQuoteRequest);
      mockDeleteQuoteRequest.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockDeleteQuoteRequest).toHaveBeenCalledWith('quote-123');
    });

    it('should prevent deletion of quote request with responses', async () => {
      mockAuth.mockResolvedValue(mockSession);
      const quoteRequestWithResponses = {
        ...mockQuoteRequest,
        status: 'sent',
        supplierResponses: [{ id: 'response-1' }]
      };
      mockGetQuoteRequestById.mockResolvedValue(quoteRequestWithResponses);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Cannot delete quote request with supplier responses');
    });

    it('should check ownership before deletion', async () => {
      mockAuth.mockResolvedValue(mockSession);
      const otherUserQuoteRequest = { ...mockQuoteRequest, userId: 'other-user' };
      mockGetQuoteRequestById.mockResolvedValue(otherUserQuoteRequest);

      const request = new NextRequest('http://localhost/api/quote-requests/quote-123', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'quote-123' } });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle service layer errors', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockGetUserQuoteRequests.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/quote-requests');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch quote requests');
    });

    it('should handle JSON parsing errors', async () => {
      mockAuth.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/quote-requests', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});