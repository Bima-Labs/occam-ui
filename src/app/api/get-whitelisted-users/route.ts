import { NextResponse } from 'next/server';

export async function GET() {
    try {
      
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL;
    // Call the existing API endpoint
    const response = await fetch(`${baseUrl}/service/get-whitelisted-address`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      statusCode: 200,
      message: 'Whitelisted users retrieved successfully (via proxy)',
      data: data.data, // Assuming your original API returns { data: [...] }
    });
  } catch (error: any) {
    return NextResponse.json({
      statusCode: 500,
      message: 'Error retrieving whitelisted users',
      error: error.message,
    }, { status: 500 });
  }
}
