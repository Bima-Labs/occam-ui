"use client";

import * as React from 'react';
import { UserOptionsTable } from '@/components/tables/UserOptionsTable';
import { Separator } from '@/components/ui/separator';

export default function OptionsPage() {
  const [searchedAddress, setSearchedAddress] = React.useState<string | null>(null);
  const [isOptionsTableLoading, setIsOptionsTableLoading] = React.useState(false);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">User Options</h1>
      <Separator />
      <UserOptionsTable
        searchedAddress={searchedAddress}
        isLoading={isOptionsTableLoading}
        setIsLoading={setIsOptionsTableLoading}
      />
    </div>
  );
}
