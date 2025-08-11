import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json(); // Get the JSON body from the frontend

    console.log('Received whitelist application:', requestBody);

    // Replace with your actual backend endpoint for applying whitelist requests
    const backendResponse = await fetch(`${BACKEND_URL}/whitelist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody), // Forward the frontend body to the backend
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text(); // Get raw error response from backend
      console.error(`Backend error for whitelist application (${backendResponse.status}): ${errorData}`);
      return NextResponse.json(
        { message: `Failed to submit whitelist request to backend: ${backendResponse.statusText}. Details: ${errorData.substring(0, 200)}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json(); // Get the response from the backend
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/whitelist/apply-whitelist-requests:', error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}