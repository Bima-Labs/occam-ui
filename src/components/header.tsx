'use client';

import { APP_NAME } from "@/lib/constants";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import Image from 'next/image';
import Link from 'next/link';
import bima_logo from '../../public/Bima_logo.svg';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Image
              src={bima_logo}
              alt="Bima Logo"
              width={96}
              height={96}
              className="ml-4"
            />
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:underline">
              Home
            </Link>
            <Link href="/options" className="text-sm font-medium hover:underline">
              Options
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          <ConnectButton />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
