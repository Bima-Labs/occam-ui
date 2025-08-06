import type { LucideIcon } from "lucide-react";

export interface GlobalMetric {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tooltipText: string;
  trend?: 'up' | 'down' | 'neutral';
}

export type UserPositionStatus = 'Safe' | 'Warning' | 'Liquidated';

export interface UserPosition {
  id: string;
  address: string;
  btcCollateral: number;
  usbdDebt: number;
  collateralRatio: number; // As a percentage, e.g., 150 for 150%
  liquidationThreshold: number; // As a percentage
  status: UserPositionStatus;
  score: number;
}

export interface AddressLookupFormData {
  address: string;
}

export interface StatusStyle {
  bgColor: any;
  borderColor: any;
  textColor: string;
  icon: LucideIcon;
}
