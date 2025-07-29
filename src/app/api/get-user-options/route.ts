import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userAddress = searchParams.get('userAddress');
  const base_url= process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';
  const backendUrl = `${base_url}/service/get-user-options`;
  const apiUrl = userAddress ? `${backendUrl}?userAddress=${userAddress}` : backendUrl;

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return new NextResponse(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json({ message: 'Internal proxy error' }, { status: 500 });
  }
}
