import { QuoteRequestsDemo } from './_components/quote-requests-demo';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">GovBid AI Demo</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Claude AI Powered</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-blue-900 mb-2">🚀 Claude AI Demo Mode</h2>
          <p className="text-blue-700">
            Test the AI-powered quote request generation without authentication. 
            This demonstrates how Claude creates professional RFQs from government opportunities.
          </p>
        </div>
        
        <QuoteRequestsDemo />
      </div>
    </div>
  );
}