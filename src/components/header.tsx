'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { useUniSat } from '@/contexts/UniSatContext';
import bima_logo from '../../public/Bima_logo.svg';
import { Home, Settings } from 'lucide-react';

export function Header() {
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { unisatAddress, connectUniSat, disconnectUniSat } = useUniSat();

  const shorten = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        {/* Left Section: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image src={bima_logo} alt="Bima Logo" width={96} height={96} className="ml-2" />
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 text-sm hover:text-primary transition">
              <Home size={16} /> Home
            </Link>

            <Link
              href="/options"
              className="flex items-center gap-1 text-sm hover:text-primary transition"
            >
              <Settings size={16} /> Options
            </Link>
            <Link
              href="/whitelist"
              className="flex items-center gap-1 text-sm hover:text-primary transition"
            >
              <Settings size={16} /> Whitelist Request
            </Link>
          </div>
        </div>

        {/* Right Section: Theme + Wallet */}
        <div className="flex items-center gap-4">
          <ThemeToggleButton />

          {/* RainbowKit Connect (EVM) */}
          {!unisatAddress && (
            <ConnectButton showBalance={false} chainStatus="icon" />
          )}

          {/* UniSat Connect */}
          {!isEvmConnected && (
            <>
              {unisatAddress ? (
                <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-md text-sm font-mono">
                  <span>{shorten(unisatAddress)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={disconnectUniSat}
                    className="text-orange-500 hover:bg-orange-200"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={connectUniSat} className="bg-orange-500 text-white">
                  Connect UniSat
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
