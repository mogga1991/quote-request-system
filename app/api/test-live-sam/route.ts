import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test SAM.gov API key availability
    const apiKey = process.env.SAM_GOV_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'SAM_GOV_API_KEY environment variable not found'
      });
    }

    // Test basic SAM.gov API call
    const apiUrl = 'https://api.sam.gov/opportunities/v2/search';
    const params = new URLSearchParams({
      api_key: apiKey,
      limit: '1',
      offset: '0',
      postedFrom: '09/01/2025',
      postedTo: '09/18/2025'
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        status: 'api_error',
        message: `SAM.gov API returned ${response.status}`,
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'SAM.gov API integration working',
      totalRecords: data.totalRecords,
      sampleOpportunity: data.opportunitiesData?.[0] ? {
        noticeId: data.opportunitiesData[0].noticeId,
        title: data.opportunitiesData[0].title,
        department: data.opportunitiesData[0].fullParentPathName,
        postedDate: data.opportunitiesData[0].postedDate
      } : null
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}