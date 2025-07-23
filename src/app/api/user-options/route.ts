import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userAddress = searchParams.get('userAddress');
  
  const baseUrl = 'http://64.227.139.232:3010/service/get-user-options';
  const apiUrl = userAddress ? `${baseUrl}?userAddress=${userAddress}` : baseUrl;

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
