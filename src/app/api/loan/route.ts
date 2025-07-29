// src/app/api/loan/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // URL to your NestJS backend endpoint
    // IMPORTANT: Use an environment variable for this in production!
    const base_url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';
  const backendUrl = `${base_url}/loan/apply`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Forward the error from the backend
      const errorData = await response.json();
      return NextResponse.json({ message: 'Submission failed', error: errorData.message || 'Unknown error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}