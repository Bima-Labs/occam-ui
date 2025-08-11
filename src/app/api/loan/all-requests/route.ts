import { NextRequest, NextResponse } from 'next/server';

 const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    // Adjust this URL to match your actual backend endpoint for all loans
    const backendResponse = await fetch(`${baseUrl}/loans/all`);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text(); // Get raw error response
      console.error(`Backend error for all-requests (${backendResponse.status}): ${errorData}`);
      return NextResponse.json(
        { message: `Failed to fetch all loan requests from backend: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/loan/all-requests:', error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}