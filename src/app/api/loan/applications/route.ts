// src/app/api/loan/applications/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  // Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3010/loan/applications';
console.log("Backend URL:", backendUrl);
  if (!backendUrl) {
    console.error("NESTJS_BACKEND_URL environment variable is not set.");
    return NextResponse.json(
      { message: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    // Fetch data from your NestJS backend
    const response = await fetch(backendUrl, {
      // You can add headers here if needed, e.g., for authentication
      // headers: { 'Authorization': 'Bearer ...' },
      
      // Use caching strategy for performance. 'no-store' ensures fresh data every time.
      // Or use revalidation: next: { revalidate: 60 } // revalidate every 60 seconds
      cache: 'no-store', 
    });

    // Check if the request to the backend was successful
    if (!response.ok) {
      // If the backend returned an error, forward it to the client
      const errorData = await response.text(); // Use text() in case response is not JSON
      console.error(`Error from NestJS backend: ${response.status}`, errorData);
      return NextResponse.json(
        { message: "Failed to fetch data from the backend service.", details: errorData },
        { status: response.status }
      );
    }

    // If successful, parse the JSON data from the backend response
    const data = await response.json();

    // Forward the data to the client that called this Next.js API route
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error connecting to the NestJS backend:", error);
    // This catches network errors, e.g., if the NestJS server is down
    return NextResponse.json(
      { message: "Could not connect to the backend service.", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 503 } // 503 Service Unavailable is appropriate here
    );
  }
}