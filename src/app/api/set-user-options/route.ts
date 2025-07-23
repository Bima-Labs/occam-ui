import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const apiUrl = 'http://64.227.139.232:3010/service/add-user-option';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return new NextResponse(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy API error (POST set-user-options):', error);
    return NextResponse.json({ message: 'Internal proxy error' }, { status: 500 });
  }
}
