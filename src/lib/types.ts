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
}

export interface AddressLookupFormData {
  address: string;
}

export interface StatusStyle {
  textColor: string;
  icon: LucideIcon;
}
