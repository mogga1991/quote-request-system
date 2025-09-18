"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  PlusIcon, 
  TrashIcon, 
  SparklesIcon, 
  AlertCircleIcon,
  CalendarIcon,
  BuildingIcon
} from "lucide-react";
import { format } from "date-fns";

interface Opportunity {
  id: string;
  title: string;
  department: string;
  noticeId: string;
  description: string;
}

interface Requirement {
  category: string;
  items: string[];
}

interface CreateQuoteRequestFormProps {
  userId: string;
}

export function CreateQuoteRequestForm({ userId }: CreateQuoteRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    opportunityId: '',
    title: '',
    description: '',
    deadline: '',
    requirements: [] as Requirement[],
    useAI: false,
  });

  // AI generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // Fetch opportunities on load
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities?limit=50');
        const data = await response.json();
        if (response.ok) {
          setOpportunities(data.opportunities || []);
        }
      } catch (err) {
        console.error('Error fetching opportunities:', err);
      }
    };

    fetchOpportunities();
  }, []);

  // Handle opportunity selection
  const handleOpportunitySelect = (opportunityId: string) => {
    const opportunity = opportunities.find(op => op.id === opportunityId);
    if (opportunity) {
      setSelectedOpportunity(opportunity);
      setFormData(prev => ({
        ...prev,
        opportunityId,
        title: prev.title || `Quote Request - ${opportunity.title}`,
      }));
    }
  };

  // Handle AI generation
  const handleAIGeneration = async () => {
    if (!selectedOpportunity) return;

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityData: {
            title: selectedOpportunity.title,
            description: selectedOpportunity.description,
            department: selectedOpportunity.department,
          },
          options: {
            includeDetailedRequirements: true,
            tone: 'formal',
            complexity: 'intermediate',
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quote request');
      }

      // Update form with AI-generated data
      setFormData(prev => ({
        ...prev,
        title: data.data.title,
        description: data.data.description,
        requirements: data.data.requirements,
      }));

      setAiGenerated(true);
      setError(null);
    } catch (err) {
      console.error('Error generating with AI:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate with AI');
    } finally {
      setAiGenerating(false);
    }
  };

  // Add requirement category
  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, { category: '', items: [''] }]
    }));
  };

  // Remove requirement category
  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  // Update requirement category
  const updateRequirementCategory = (index: number, category: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === index ? { ...req, category } : req
      )
    }));
  };

  // Add requirement item
  const addRequirementItem = (reqIndex: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === reqIndex ? { ...req, items: [...req.items, ''] } : req
      )
    }));
  };

  // Remove requirement item
  const removeRequirementItem = (reqIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === reqIndex ? { ...req, items: req.items.filter((_, j) => j !== itemIndex) } : req
      )
    }));
  };

  // Update requirement item
  const updateRequirementItem = (reqIndex: number, itemIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === reqIndex ? { 
          ...req, 
          items: req.items.map((item, j) => j === itemIndex ? value : item) 
        } : req
      )
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opportunityId || !formData.title || !formData.deadline) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: formData.opportunityId,
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          requirements: formData.requirements.filter(req => 
            req.category.trim() && req.items.some(item => item.trim())
          ),
          aiGenerated: aiGenerated,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create quote request');
      }

      router.push(`/dashboard/quote-requests/${data.data}`);
    } catch (err) {
      console.error('Error creating quote request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quote request');
    } finally {
      setLoading(false);
    }
  };

  // Set default deadline (14 days from now)
  useEffect(() => {
    if (!formData.deadline) {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        deadline: format(defaultDeadline, 'yyyy-MM-dd')
      }));
    }
  }, [formData.deadline]);

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="review">Review & Submit</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Opportunity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="opportunity">Government Opportunity *</Label>
                  <Select 
                    value={formData.opportunityId} 
                    onValueChange={handleOpportunitySelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an opportunity..." />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunities.map((opportunity) => (
                        <SelectItem key={opportunity.id} value={opportunity.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{opportunity.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {opportunity.department} • {opportunity.noticeId}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOpportunity && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <BuildingIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">{selectedOpportunity.title}</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            {selectedOpportunity.department} • Notice ID: {selectedOpportunity.noticeId}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quote Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quote request title..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you're requesting quotes for..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Response Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    required
                  />
                </div>

                {selectedOpportunity && (
                  <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                    <Switch
                      id="use-ai"
                      checked={formData.useAI}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useAI: checked }))}
                    />
                    <Label htmlFor="use-ai" className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-purple-600" />
                      Generate requirements with AI
                    </Label>
                  </div>
                )}

                {formData.useAI && selectedOpportunity && (
                  <Button
                    type="button"
                    onClick={handleAIGeneration}
                    disabled={aiGenerating}
                    className="w-full"
                  >
                    {aiGenerating ? (
                      'Generating with AI...'
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Generate Quote Request with AI
                      </>
                    )}
                  </Button>
                )}

                {aiGenerated && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <SparklesIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">AI-generated content applied!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Review and edit the generated requirements in the next tab.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Requirements</CardTitle>
                  <Button type="button" onClick={addRequirement} variant="outline" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.requirements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No requirements added yet.</p>
                    <p className="text-sm">Click "Add Category" to start building your requirements.</p>
                  </div>
                ) : (
                  formData.requirements.map((requirement, reqIndex) => (
                    <Card key={reqIndex} className="bg-gray-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={requirement.category}
                            onChange={(e) => updateRequirementCategory(reqIndex, e.target.value)}
                            placeholder="Category name (e.g., Technical Requirements)"
                            className="bg-white"
                          />
                          <Button
                            type="button"
                            onClick={() => removeRequirement(reqIndex)}
                            variant="ghost"
                            size="sm"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {requirement.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateRequirementItem(reqIndex, itemIndex, e.target.value)}
                              placeholder="Requirement item..."
                              className="bg-white"
                            />
                            <Button
                              type="button"
                              onClick={() => removeRequirementItem(reqIndex, itemIndex)}
                              variant="ghost"
                              size="sm"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={() => addRequirementItem(reqIndex)}
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Quote Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Opportunity</Label>
                    <p className="text-sm">{selectedOpportunity?.title || 'No opportunity selected'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="text-sm">{formData.title || 'No title entered'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm">{formData.description || 'No description entered'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <p className="text-sm">{formData.deadline ? format(new Date(formData.deadline), 'PPP') : 'No deadline set'}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Requirements</Label>
                    {formData.requirements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No requirements added</p>
                    ) : (
                      <div className="space-y-3 mt-2">
                        {formData.requirements
                          .filter(req => req.category.trim() && req.items.some(item => item.trim()))
                          .map((requirement, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-gray-50">
                            <h4 className="font-medium text-sm">{requirement.category}</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                              {requirement.items
                                .filter(item => item.trim())
                                .map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {aiGenerated && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !formData.opportunityId || !formData.title || !formData.deadline}
                    className="flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Quote Request'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/quote-requests')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}