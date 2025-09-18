import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function testSamGovAPI() {
  'use server';
  
  const apiKey = process.env.SAM_GOV_API_KEY;
  
  if (!apiKey) {
    return { 
      status: 'error', 
      message: 'SAM_GOV_API_KEY environment variable not found' 
    };
  }

  try {
    const apiUrl = 'https://api.sam.gov/opportunities/v2/search';
    const params = new URLSearchParams({
      api_key: apiKey,
      limit: '2',
      offset: '0',
      postedFrom: '09/01/2025',
      postedTo: '09/18/2025'
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GovBid-AI/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: 'api_error',
        statusCode: response.status,
        message: `SAM.gov API returned ${response.status}`,
        details: errorText.substring(0, 300)
      };
    }

    const data = await response.json();
    
    return {
      status: 'success',
      totalRecords: data.totalRecords,
      opportunities: data.opportunitiesData?.slice(0, 2).map((opp: any) => ({
        noticeId: opp.noticeId,
        title: opp.title,
        department: opp.fullParentPathName,
        postedDate: opp.postedDate
      })) || []
    };

  } catch (error) {
    return {
      status: 'error',
      message: 'Network or parsing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default async function SamTestPage() {
  const testResult = await testSamGovAPI();
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">SAM.gov API Status</h1>
        <p className="text-muted-foreground">
          Test and validate the SAM.gov API integration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                testResult.status === 'success' 
                  ? 'bg-green-500' 
                  : testResult.status === 'api_error' && testResult.statusCode === 401
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              {testResult.status === 'success' 
                ? 'Connected' 
                : testResult.status === 'api_error' && testResult.statusCode === 401
                ? 'API Key Issue'
                : 'Error'}
            </span>
          </div>

          {testResult.status === 'success' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ SAM.gov API Working
              </h3>
              <p className="text-green-700 mb-3">
                Total opportunities available: {testResult.totalRecords?.toLocaleString()}
              </p>
              
              {testResult.opportunities && testResult.opportunities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">Sample Opportunities:</h4>
                  {testResult.opportunities.map((opp: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded border border-green-200">
                      <div className="font-medium text-sm">{opp.title}</div>
                      <div className="text-xs text-gray-600">{opp.department}</div>
                      <div className="text-xs text-gray-500">Posted: {opp.postedDate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {testResult.status === 'api_error' && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">
                ⚠️ API Key Issue (Status: {testResult.statusCode})
              </h3>
              <p className="text-yellow-700 mb-2">
                The SAM.gov API key needs attention:
              </p>
              <div className="bg-yellow-100 p-3 rounded text-sm">
                <strong>Error Details:</strong>
                <pre className="mt-1 whitespace-pre-wrap">{testResult.details}</pre>
              </div>
              <div className="mt-3 text-sm text-yellow-700">
                <strong>Next Steps:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Verify the API key is valid and not expired</li>
                  <li>Ensure the key has access to the opportunities API</li>
                  <li>Check if additional permissions are needed</li>
                </ul>
              </div>
            </div>
          )}

          {testResult.status === 'error' && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">
                ❌ Configuration Error
              </h3>
              <p className="text-red-700">{testResult.message}</p>
              {testResult.error && (
                <div className="mt-2 text-sm text-red-600">
                  <strong>Details:</strong> {testResult.error}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              📋 SAM.gov API Key Requirements
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Must be a public API key from SAM.gov</li>
              <li>• Requires account registration at https://sam.gov</li>
              <li>• Key should have access to "Opportunities" API</li>
              <li>• May take 24-48 hours for activation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}