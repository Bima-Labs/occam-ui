import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ message: "Wallet address is required" }, { status: 400 });
    }

    console.log(`Fetching loan requests for user: ${walletAddress}`);
    // Adjust this URL to match your actual backend endpoint for user-specific loans
    const backendResponse = await fetch(`${BACKEND_URL}/loans/user/${walletAddress}`);

    if (!backendResponse.ok) {
      // If the backend returns an error status (e.g., 400, 500)
      const errorData = await backendResponse.text(); // Get raw error response text
      console.error(`Backend error for my-requests (${backendResponse.status}): ${errorData}`);
      return NextResponse.json(
        { message: `Failed to fetch your loan requests from backend: ${backendResponse.statusText}. Details: ${errorData.substring(0, 100)}` },
        { status: backendResponse.status }
      );
    }

    // --- FIX START ---
    // Handle cases where the backend returns no content (e.g., 204 No Content) or an empty body
    const contentType = backendResponse.headers.get('content-type');
    const contentLength = backendResponse.headers.get('content-length');

    if (backendResponse.status === 204 || (contentType && !contentType.includes('application/json')) || (contentLength === '0')) {
      console.log('Backend returned no content or non-JSON for user loans. Returning empty array.');
      return NextResponse.json([], { status: 200 }); // Return an empty array for no content
    }
    // --- FIX END ---

    // Attempt to parse JSON only if content is expected
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/loan/my-requests:', error);
    // Provide a more generic error message for unexpected issues
    return NextResponse.json({ message: "An unexpected error occurred while fetching your loan requests." }, { status: 500 });
  }
}