import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'BIMA',
  projectId: 'YOUR_PROJECT_ID', // get it from https://cloud.walletconnect.com
  chains: [mainnet, polygon, arbitrum, sepolia],
  ssr: true,
});
