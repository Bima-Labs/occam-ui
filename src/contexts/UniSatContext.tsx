'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface UniSatContextType {
  unisatAddress: string | null;
  isConnected: boolean;
  connectUniSat: () => Promise<void>;
  disconnectUniSat: () => void;
}

const UniSatContext = createContext<UniSatContextType>({
  unisatAddress: null,
  isConnected: false,
  connectUniSat: async () => {},
  disconnectUniSat: () => {},
});

export const useUniSat = () => useContext(UniSatContext);

export const UniSatProvider = ({ children }: { children: React.ReactNode }) => {
  const [unisatAddress, setUnisatAddress] = useState<string | null>(null);

  // 🔐 Load only if not explicitly disconnected
  useEffect(() => {
    const init = async () => {
      const disconnected = localStorage.getItem('unisat-disconnected');
      if (disconnected === 'true') return;

      if (typeof window !== 'undefined' && (window as any).unisat) {
        try {
          const accounts = await (window as any).unisat.getAccounts();
          if (accounts?.[0]) {
            setUnisatAddress(accounts[0]);
            localStorage.setItem('unisat-disconnected', 'false');
          }
        } catch {
          // silently ignore
        }

        (window as any).unisat.on('accountsChanged', (accounts: string[]) => {
          if (accounts?.[0]) {
            setUnisatAddress(accounts[0]);
          } else {
            setUnisatAddress(null);
            localStorage.setItem('unisat-disconnected', 'true');
          }
        });
      }
    };

    init();
  }, []);

  const connectUniSat = async () => {
    try {
      const accounts = await (window as any).unisat.requestAccounts();
      if (accounts?.[0]) {
        setUnisatAddress(accounts[0]);
        localStorage.setItem('unisat-disconnected', 'false');
      }
    } catch (err) {
      console.error('UniSat connect error:', err);
    }
  };

  const disconnectUniSat = () => {
    setUnisatAddress(null);
    localStorage.setItem('unisat-disconnected', 'true');
  };

  const isConnected = !!unisatAddress;

  return (
    <UniSatContext.Provider
      value={{ unisatAddress, isConnected, connectUniSat, disconnectUniSat }}
    >
      {children}
    </UniSatContext.Provider>
  );
};
