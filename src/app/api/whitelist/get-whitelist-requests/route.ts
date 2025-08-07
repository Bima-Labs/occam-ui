import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
      const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  console.log('whitelist request address is : ', address);
  if (!address) {
    return NextResponse.json({ message: "Wallet address is required" }, { status: 400 });
    }
    
    console.log('backend url : ', BACKEND_URL);

    const response = await fetch(`${BACKEND_URL}/whitelist?address=${address}`);

    if (!response.ok) {
      return NextResponse.json({ message: `Backend error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Unknown error" }, { status: 500 });
  }
}
