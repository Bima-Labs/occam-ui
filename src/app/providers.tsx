'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { ReactNode, useEffect, useState } from 'react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const darkMode = document.documentElement.classList.contains('dark');
    setIsDark(darkMode);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={isDark
            ? darkTheme({
                accentColor: '#FF5A00',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                overlayBlur: 'small',
              })
            : lightTheme({
                accentColor: '#FF5A00',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                overlayBlur: 'small',
              })
          }
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
