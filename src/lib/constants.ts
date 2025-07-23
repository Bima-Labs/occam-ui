
import type { GlobalMetric, UserPosition, UserPositionStatus, StatusStyle } from '@/lib/types';
import { Landmark, CircleDollarSign, Gauge, Users, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

export const APP_NAME = "BIMA";

export const ADDRESS_REGEX = /^(1|3|bc1|0x[a-fA-F0-9]{40})$/;




export const MOCK_GLOBAL_METRICS: GlobalMetric[] = [
  {
    id: 'tvl',
    label: 'Total Value Locked (TVL)',
    value: '$125.6M',
    icon: Landmark,
    tooltipText: 'The total value of assets locked in the protocol.',
    trend: 'up',
  },
  {
    id: 'usbd-minted',
    label: 'Total USBD Minted',
    value: '75.2M USBD',
    icon: CircleDollarSign,
    tooltipText: 'The total amount of USBD stablecoin minted.',
    trend: 'neutral',
  },
  {
    id: 'avg-cr',
    label: 'Average Collateral Ratio (CR)',
    value: '280%',
    icon: Gauge,
    tooltipText: 'The average collateralization ratio across all active positions. Higher is generally safer.',
    trend: 'neutral', // Example: CR itself is a value, trend might be different
  },
  {
    id: 'active-users',
    label: 'Active Users',
    value: '1,450',
    icon: Users,
    tooltipText: 'The number of unique addresses interacting with the protocol.',
    trend: 'up',
  },
];

export const MOCK_USER_POSITIONS: UserPosition[] = [
  {
    id: '1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    btcCollateral: 2.5,
    usbdDebt: 30000,
    collateralRatio: 250,
    liquidationThreshold: 150,
    status: 'Safe',
  },
  {
    id: '2',
    address: '0xfedcba0987654321fedcba0987654321fedcba09',
    btcCollateral: 1.2,
    usbdDebt: 15000,
    collateralRatio: 160,
    liquidationThreshold: 150,
    status: 'Warning',
  },
  {
    id: '3',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    btcCollateral: 0.5,
    usbdDebt: 10000,
    collateralRatio: 120,
    liquidationThreshold: 150,
    status: 'Liquidated',
  },
    {
    id: '4',
    address: '0xDeFiUser0x789AbcDeFGHiJkLMnOpQrStUvWxYz',
    btcCollateral: 5.0,
    usbdDebt: 50000,
    collateralRatio: 310,
    liquidationThreshold: 150,
    status: 'Safe',
  },
  {
    id: '5',
    address: '0xAnotherWalletAddress0xZyXwVuTsRqPoNmLkJi',
    btcCollateral: 0.8,
    usbdDebt: 12000,
    collateralRatio: 130,
    liquidationThreshold: 150,
    status: 'Warning',
  },
];

export const STATUS_STYLES: Record<UserPositionStatus, StatusStyle> = {
  Safe: {
    textColor: 'text-success',
    icon: ShieldCheck,
    bgColor: undefined,
    borderColor: undefined
  },
  Warning: {
    textColor: 'text-warning',
    icon: AlertTriangle,
    bgColor: undefined,
    borderColor: undefined
  },
  Liquidated: {
    textColor: 'text-destructive',
    icon: XCircle,
    bgColor: undefined,
    borderColor: undefined
  },
};


export const CR_THRESHOLD_CLASSES = {
  safe: 'text-success', // CR >= 200%
  warning: 'text-warning', // CR >= 150% and < 200%
  critical: 'text-destructive', // CR < 150%
};

export const getCRColorClass = (cr: number): string => {
  if (cr >= 200) return CR_THRESHOLD_CLASSES.safe;
  if (cr >= 150) return CR_THRESHOLD_CLASSES.warning;
  return CR_THRESHOLD_CLASSES.critical;
};

export const getStatusIcon = (status: UserPositionStatus) => {
  return STATUS_STYLES[status].icon;
};
