// layout.tsx
import './globals.css';
import { Header } from '@/components/header';
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_NAME } from '@/lib/constants';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { UniSatProvider } from '@/contexts/UniSatContext';

export const metadata = {
  title: APP_NAME,
  description: 'Intuitive Blockchain Analytics Dashboard for a decentralized lending protocol.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased font-sans">
        <Providers>
          <UniSatProvider>
          <TooltipProvider delayDuration={0}>
            <Header />
            <main className="flex-1 container max-w-screen-2xl mx-auto py-8 px-4 md:px-6">
              {children}
            </main>
            <Toaster />
          </TooltipProvider>
          </UniSatProvider>
        </Providers>
      </body>
    </html>
  );
}
