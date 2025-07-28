"use client";

import * as React from 'react';
import { GlobalMetricsSection } from '@/components/global-metrics-section';
import { UserLookupSection } from '@/components/user-lookup-section';
import { UserPositionTable } from '@/components/user-position-table';
import { Separator } from '@/components/ui/separator';
import { LoanApplicationModal } from '@/components/loan-application-modal';
import { useAccount } from 'wagmi';

// import { UserOptionsTable } from '@/components/tables/UserOptionsTable'; // <-- New Import
export default function DeFiPulsePage() {
  const [searchedAddress, setSearchedAddress] = React.useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = React.useState(false);
   const { address, isConnected } = useAccount(); // <-- New: Get wallet address and connection status
  // const [isOptionsTableLoading, setIsOptionsTableLoading] = React.useState(false); // <-- New loading state
  const handleAddressSubmit = (address: string) => {
    setSearchedAddress(address);
  };

  return (
    <div className="space-y-12">
      <GlobalMetricsSection />
      <Separator />
   <LoanApplicationModal connectedAddress={isConnected ? address : undefined} />
      {/* We are placing the "Apply for Loan" button next to the user lookup section */}
         <Separator />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      
     
        <div className="flex-grow">
          <UserLookupSection onAddressSubmit={handleAddressSubmit} isTableLoading={isTableLoading} />
           <UserPositionTable searchedAddress={searchedAddress} isLoading={isTableLoading} setIsLoading={setIsTableLoading} />
        </div>
       
      </div>
   
     
         {/* User Options Table (New!) */}
      {/* <UserOptionsTable
        searchedAddress={searchedAddress}
        isLoading={isOptionsTableLoading}
        setIsLoading={setIsOptionsTableLoading}
      /> */}
    </div>
   
  );
}

