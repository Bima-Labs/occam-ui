"use client";

import * as React from 'react';
import { GlobalMetricsSection } from '@/components/global-metrics-section';
import { UserLookupSection } from '@/components/user-lookup-section';
import { UserPositionTable } from '@/components/user-position-table';
import { Separator } from '@/components/ui/separator';
// import { UserOptionsTable } from '@/components/tables/UserOptionsTable'; // <-- New Import
export default function DeFiPulsePage() {
  const [searchedAddress, setSearchedAddress] = React.useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = React.useState(false);
  // const [isOptionsTableLoading, setIsOptionsTableLoading] = React.useState(false); // <-- New loading state
  const handleAddressSubmit = (address: string) => {
    setSearchedAddress(address);
  };

  return (
    <div className="space-y-12">
      <GlobalMetricsSection />
      <Separator />
      <UserLookupSection onAddressSubmit={handleAddressSubmit} isTableLoading={isTableLoading} />
      <UserPositionTable searchedAddress={searchedAddress} isLoading={isTableLoading} setIsLoading={setIsTableLoading} />
         {/* User Options Table (New!) */}
      {/* <UserOptionsTable
        searchedAddress={searchedAddress}
        isLoading={isOptionsTableLoading}
        setIsLoading={setIsOptionsTableLoading}
      /> */}
    </div>
   
  );
}

