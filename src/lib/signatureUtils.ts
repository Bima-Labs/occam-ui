// src/lib/signatureUtils.ts

import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { verify } from 'bitcoinjs-message';

/**
 * Verifies a signature from an EVM-compatible wallet (e.g., MetaMask).
 * @param address The EVM address that should have signed the message.
 * @param message The original message that was signed.
 * @param signature The signature string to verify.
 * @returns {boolean} - True if the signature is valid.
 */
export function verifyEvmSignature(address: string, message: string, signature: string): boolean {
  try {
    const recoveredAddress = recoverPersonalSignature({
      data: `0x${Buffer.from(message, 'utf8').toString('hex')}`,
      signature: signature,
    });
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('EVM signature verification error:', error);
    return false;
  }
}

/**
 * Verifies a signature from a UniSat (Bitcoin) wallet.
 * @param address The Bitcoin address (Taproot, SegWit, etc.) that should have signed the message.
 * @param message The original message that was signed.
 * @param signature The signature string from the wallet (in base64 format).
 * @returns {boolean} - True if the signature is valid.
 */
export function verifyUniSatSignature(address: string, message: string, signature: string): boolean {
  try {
    // UniSat provides a base64 encoded signature.
    // The 'bitcoinjs-message' library's verify function expects the signature as a Buffer.
    const signatureBuffer = Buffer.from(signature, 'base64');

    // The 'verify' function automatically handles the "Bitcoin Signed Message:\n" prefix.
    return verify(message, address, signatureBuffer);
  } catch (err) {
    console.error('UniSat signature verification error:', err);
    return false;
  }
}

/**
 * Frontend Note:
 * When a user signs a message with UniSat, you should send the `address`, `message`,
 * and the resulting `signature` to your backend for verification with the function above.
 * The address is readily available from `window.unisat.getAccounts()`.
 */