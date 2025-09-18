"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarIcon, 
  ClockIcon, 
  BuildingIcon,
  FileTextIcon,
  SparklesIcon,
  UsersIcon,
  DownloadIcon,
  EditIcon,
  SendIcon,
  AlertCircleIcon
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Opportunity {
  id: string;
  title: string;
  department: string;
  noticeId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Supplier {
  id: string;
  name: string;
  contactEmail: string | null;
  gsaSchedule: boolean;
  invitedAt: Date;
  notificationSent: boolean;
}

interface Response {
  id: string;
  supplierId: string;
  status: string;
  totalPriceCents: number | null;
  submittedAt: Date | null;
}

interface QuoteRequest {
  id: string;
  opportunityId: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  requirements: any;
  deadline: Date;
  attachments: any;
  aiGenerated: boolean;
  aiPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity: Opportunity;
  user: User;
  suppliers: Supplier[];
  responses: Response[];
}

interface QuoteRequestDetailProps {
  quoteRequest: QuoteRequest;
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

export function QuoteRequestDetail({ quoteRequest, userId }: QuoteRequestDetailProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDeadlineStatus = (deadline: Date) => {
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
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

  const deadlineInfo = getDeadlineStatus(quoteRequest.deadline);

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quote-requests/${quoteRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quote-requests/${quoteRequest.id}/export`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Error exporting:', err);
      setError(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {quoteRequest.title}
            </h1>
            <Badge 
              className={`${statusColors[quoteRequest.status as keyof typeof statusColors]}`}
              variant="secondary"
            >
              {statusLabels[quoteRequest.status as keyof typeof statusLabels]}
            </Badge>
            {quoteRequest.aiGenerated && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <SparklesIcon className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Created {format(quoteRequest.createdAt, 'PPP')} • Last updated {format(quoteRequest.updatedAt, 'PPP')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {quoteRequest.status === 'draft' && (
            <Button
              onClick={() => handleStatusUpdate('sent')}
              disabled={loading}
            >
              <SendIcon className="h-4 w-4 mr-2" />
              Send to Suppliers
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href={`/dashboard/quote-requests/${quoteRequest.id}/edit`}>
            <Button variant="outline">
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className={`text-sm ${deadlineInfo.color}`}>
                  {format(quoteRequest.deadline, 'PPP')} ({deadlineInfo.text})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Suppliers</p>
                <p className="text-sm text-muted-foreground">
                  {quoteRequest.suppliers.length} invited, {quoteRequest.responses.length} responded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {statusLabels[quoteRequest.status as keyof typeof statusLabels]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Quote Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">
                    {quoteRequest.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-sm mt-1">{quoteRequest.user.name} ({quoteRequest.user.email})</p>
                </div>

                {quoteRequest.aiPrompt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AI Prompt Used</p>
                    <p className="text-sm mt-1 italic">{quoteRequest.aiPrompt}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5" />
                  Related Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <Link 
                    href={`/dashboard/opportunities/${quoteRequest.opportunity.id}`}
                    className="text-sm mt-1 text-blue-600 hover:underline"
                  >
                    {quoteRequest.opportunity.title}
                  </Link>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm mt-1">{quoteRequest.opportunity.department}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notice ID</p>
                  <p className="text-sm mt-1">{quoteRequest.opportunity.noticeId}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              {!quoteRequest.requirements || Object.keys(quoteRequest.requirements).length === 0 ? (
                <p className="text-muted-foreground">No requirements specified</p>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(quoteRequest.requirements) ? (
                    quoteRequest.requirements.map((requirement: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{requirement.category}</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {requirement.items?.map((item: string, itemIndex: number) => (
                            <li key={itemIndex} className="text-sm text-muted-foreground">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="border rounded-lg p-4">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(quoteRequest.requirements, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invited Suppliers ({quoteRequest.suppliers.length})</CardTitle>
                <Button variant="outline" size="sm">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Manage Suppliers
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quoteRequest.suppliers.length === 0 ? (
                <p className="text-muted-foreground">No suppliers invited yet</p>
              ) : (
                <div className="space-y-3">
                  {quoteRequest.suppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{supplier.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {supplier.contactEmail || 'No contact email'}
                          {supplier.gsaSchedule && ' • GSA Schedule'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invited {format(supplier.invitedAt, 'PPP')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={supplier.notificationSent ? 'default' : 'secondary'}>
                          {supplier.notificationSent ? 'Notified' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Responses ({quoteRequest.responses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {quoteRequest.responses.length === 0 ? (
                <p className="text-muted-foreground">No responses received yet</p>
              ) : (
                <div className="space-y-3">
                  {quoteRequest.responses.map((response) => {
                    const supplier = quoteRequest.suppliers.find(s => s.id === response.supplierId);
                    return (
                      <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{supplier?.name || 'Unknown Supplier'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {response.totalPriceCents ? 
                              `$${(response.totalPriceCents / 100).toLocaleString()}` : 
                              'No price quoted'
                            }
                          </p>
                          {response.submittedAt && (
                            <p className="text-xs text-muted-foreground">
                              Submitted {format(response.submittedAt, 'PPP')}
                            </p>
                          )}
                        </div>
                        <Badge variant={response.status === 'submitted' ? 'default' : 'secondary'}>
                          {response.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}