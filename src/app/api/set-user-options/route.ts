// app/api/set-user-options/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyEvmSignature, verifyUniSatSignature } from '@/lib/signatureUtils'; // Adjust path if needed

export async function POST(req: NextRequest) {
  const { userAddress, callValue, putValue, signature, signedMessageContent } = await req.json();

  // Basic validation
  if (!userAddress || typeof callValue === 'undefined' || typeof putValue === 'undefined' || !signature || !signedMessageContent) {
    return NextResponse.json({ message: 'Missing required fields for update or signature verification.' }, { status: 400 });
  }

  // --- Signature Verification ---
  let isSignatureValid = false;

  // Determine if it's an EVM or UniSat address based on format
  const isEvmAddress = userAddress.startsWith('0x');

  if (isEvmAddress) {
    isSignatureValid = verifyEvmSignature(userAddress, signedMessageContent, signature);
  } else {
    // Assuming userAddress for UniSat is actually the public key or derivable to one.
    // If userAddress is the UniSat BRC20 address, you would need the actual public key from the client.
    // For now, we'll assume `userAddress` contains the public key for UniSat.
    // If it's the BRC20 address, you'll need to pass the public key from the client as well.
    // Example: userAddress (BRC20 address), unisatPublicKey (the actual public key)
    isSignatureValid = verifyUniSatSignature(userAddress, signedMessageContent, signature);
  }

  if (!isSignatureValid) {
    console.warn(`Signature verification failed for address: ${userAddress}`);
    return NextResponse.json({ message: 'Signature mismatch. Please ensure the message and signature are correct.' }, { status: 401 });
  } else {
    console.log(`Signature verified successfully for address: ${userAddress}`);
  }
  // --- End Signature Verification ---
 
  const base_url= process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';
  const apiUrl = `${base_url}/service/add-user-option`;

  try {
    // Only send the necessary data to the external API, not signature details
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress, callValue, putValue }), // Only send validated data
    });

    const data = await res.json();

    return new NextResponse(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy API error (POST set-user-options):', error);
    return NextResponse.json({ message: 'Internal server error when saving options.' }, { status: 500 });
  }
}