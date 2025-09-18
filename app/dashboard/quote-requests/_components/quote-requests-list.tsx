"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarIcon, 
  ClockIcon, 
  FileTextIcon, 
  SearchIcon,
  ExternalLinkIcon,
  AlertCircleIcon
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface QuoteRequest {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'expired' | 'completed';
  deadline: string;
  aiGenerated: boolean;
  createdAt: string;
  opportunityTitle: string;
  opportunityDepartment: string;
}

interface QuoteRequestsListProps {
  userId: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  expired: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  draft: 'Draft',
  sent: 'Sent',
  expired: 'Expired',
  completed: 'Completed',
};

export function QuoteRequestsList({ userId }: QuoteRequestsListProps) {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const fetchQuoteRequests = async (search?: string, status?: string, offset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });

      if (search && search.trim()) {
        params.append('query', search.trim());
      }
      
      if (status && status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/quote-requests?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quote requests');
      }

      setQuoteRequests(data.data || []);
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        hasMore: data.pagination.hasMore,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching quote requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteRequests(searchQuery, statusFilter);
  }, []);

  const handleSearch = () => {
    fetchQuoteRequests(searchQuery, statusFilter, 0);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchQuoteRequests(searchQuery, status, 0);
  };

  const loadMore = () => {
    fetchQuoteRequests(searchQuery, statusFilter, pagination.offset + pagination.limit);
  };

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilDeadline < 0) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-600' };
    } else if (daysUntilDeadline <= 3) {
      return { status: 'urgent', text: `${daysUntilDeadline} days left`, color: 'text-orange-600' };
    } else if (daysUntilDeadline <= 7) {
      return { status: 'soon', text: `${daysUntilDeadline} days left`, color: 'text-yellow-600' };
    } else {
      return { status: 'normal', text: `${daysUntilDeadline} days left`, color: 'text-green-600' };
    }
  };

  if (loading && quoteRequests.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button 
            onClick={() => fetchQuoteRequests(searchQuery, statusFilter)} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search quote requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="outline" className="w-full sm:w-auto">
            <SearchIcon className="h-4 w-4 mr-2 sm:hidden" />
            Search
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.total === 0 ? 'No quote requests found' : 
           `Showing ${quoteRequests.length} of ${pagination.total} quote requests`}
        </p>
      </div>

      {/* Quote Requests Grid */}
      {quoteRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No quote requests yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first quote request from an opportunity.
            </p>
            <Link href="/dashboard/quote-requests/create">
              <Button>Create Quote Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quoteRequests.map((quoteRequest) => {
            const deadlineInfo = getDeadlineStatus(quoteRequest.deadline);
            
            return (
              <Card key={quoteRequest.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg leading-tight">
                        <Link 
                          href={`/dashboard/quote-requests/${quoteRequest.id}`}
                          className="hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {quoteRequest.title}
                        </Link>
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        {quoteRequest.opportunityTitle} • {quoteRequest.opportunityDepartment}
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-start gap-2">
                      {quoteRequest.aiGenerated && (
                        <Badge variant="secondary" className="text-xs">
                          AI Generated
                        </Badge>
                      )}
                      <Badge 
                        className={`text-xs ${statusColors[quoteRequest.status]}`}
                        variant="secondary"
                      >
                        {statusLabels[quoteRequest.status]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className={`${deadlineInfo.color} truncate`}>
                          {deadlineInfo.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          Created {formatDistanceToNow(new Date(quoteRequest.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/quote-requests/${quoteRequest.id}`} className="w-full sm:w-auto">
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                        <span className="sm:inline hidden">View Details</span>
                        <span className="sm:hidden inline">View</span>
                        <ExternalLinkIcon className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button 
            onClick={loadMore} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}