"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search, Filter, Calendar, DollarSign, Building, Clock } from "lucide-react";
import Link from "next/link";

interface Opportunity {
  noticeId: string;
  title: string;
  department: string;
  office?: string;
  postedDate: string;
  responseDeadline: string;
  naicsCode?: string;
  setAsideCode?: string;
  description?: string;
  solicitationNumber?: string;
  estimatedValue?: number;
  contractType?: string;
  place?: string;
}

export function OpportunitiesList() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [naicsFilter, setNaicsFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const params = new URLSearchParams({
        limit: "25",
        ...(refresh && { refresh: "true" }),
      });

      const response = await fetch(`/api/opportunities?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOpportunities(data.opportunities || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setError("Failed to load opportunities. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeData = async () => {
    try {
      // First, seed suppliers if needed
      await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-suppliers" }),
      });
      
      // Then fetch opportunities
      await fetchOpportunities();
    } catch (error) {
      console.error("Error initializing data:", error);
      setError("Failed to initialize data. Please refresh the page.");
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDeadlineColor = (days: number) => {
    if (days < 7) return "bg-red-100 text-red-800";
    if (days < 14) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = !searchTerm || 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || departmentFilter === "all" || 
      opp.department.toLowerCase().includes(departmentFilter.toLowerCase());
    
    const matchesNaics = !naicsFilter || naicsFilter === "all" || opp.naicsCode?.includes(naicsFilter);
    
    return matchesSearch && matchesDepartment && matchesNaics;
  });

  const departments = [...new Set(opportunities.map(opp => opp.department))].sort();
  const naicsCodes = [...new Set(opportunities.map(opp => opp.naicsCode).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button 
              onClick={() => fetchOpportunities()} 
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <Building className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={naicsFilter} onValueChange={setNaicsFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by NAICS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All NAICS</SelectItem>
            {naicsCodes.map((naics) => (
              <SelectItem key={naics} value={naics!}>
                {naics}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={() => fetchOpportunities(true)} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredOpportunities.length} of {opportunities.length} opportunities
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No opportunities found matching your criteria.</p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setDepartmentFilter("all");
                    setNaicsFilter("all");
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredOpportunities.map((opportunity) => {
            const daysUntilDeadline = getDaysUntilDeadline(opportunity.responseDeadline);
            
            return (
              <Card key={opportunity.noticeId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        <Link 
                          href={`/dashboard/opportunities/${opportunity.noticeId}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {opportunity.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {opportunity.department}
                        {opportunity.office && ` • ${opportunity.office}`}
                      </CardDescription>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getDeadlineColor(daysUntilDeadline)}>
                        <Clock className="mr-1 h-3 w-3" />
                        {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : "Expired"}
                      </Badge>
                      
                      {opportunity.setAsideCode && (
                        <Badge variant="outline">
                          {opportunity.setAsideCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {opportunity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {opportunity.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Posted: {formatDate(opportunity.postedDate)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Due: {formatDate(opportunity.responseDeadline)}
                      </div>
                      
                      {opportunity.estimatedValue && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(opportunity.estimatedValue)}
                        </div>
                      )}
                      
                      {opportunity.naicsCode && (
                        <div>
                          NAICS: {opportunity.naicsCode}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-xs text-muted-foreground">
                        {opportunity.solicitationNumber && (
                          <span>Solicitation: {opportunity.solicitationNumber}</span>
                        )}
                      </div>
                      
                      <Link href={`/dashboard/opportunities/${opportunity.noticeId}`}>
                        <Button size="sm">
                          Analyze Opportunity
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}