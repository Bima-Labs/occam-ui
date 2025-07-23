import { APP_NAME } from "@/lib/constants";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import Image from 'next/image'; // Import the Next.js Image component
import bima_logo from '../../public/Bima_logo.svg';
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          {/* Add the SVG here */}
   <Link href="/">
  <Image
    src={bima_logo}
    alt="Bima Logo"
    width={96}
    height={96}
    className="mr-2 ml-7"
  />
</Link>
          <Link
            href="/options"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors mx-5"
          >
            Options
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}