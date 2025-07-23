"use client";

import * as React from 'react';
import type { UserOptionsData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { ADDRESS_REGEX } from '@/lib/constants';

interface UserOptionsTableProps {
  searchedAddress: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Define the structure of a single record as it comes directly from the API's 'data' array
interface RawApiOptionRecord {
  user_address: string;
  call_value: string; // API returns as string
  put_value: string; // API returns as string
  created_at: string;
}

// Define the full API response structure
interface UserOptionsApiResponse {
  statusCode: number;
  message: string;
  data: RawApiOptionRecord[];
}


export function UserOptionsTable({ searchedAddress, isLoading: parentIsLoading, setIsLoading: setParentIsLoading }: UserOptionsTableProps) {
  const [optionsDataList, setOptionsDataList] = React.useState<UserOptionsData[]>([]);
  const [internalIsLoading, setInternalIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
  let isMounted = true;

  const fetchOptions = async () => {
    setInternalIsLoading(true);
    setParentIsLoading(true);
    setError(null);
    setOptionsDataList([]);

    try {
      let apiUrl = '';
      const isValidAddress = searchedAddress && ADDRESS_REGEX.test(searchedAddress);

      if (isValidAddress) {
        apiUrl = `/api/user-options?userAddress=${searchedAddress}`;
      } else if (!searchedAddress) {
        apiUrl = `/api/user-options`;
      } else {
        throw new Error("Invalid address format provided.");
      }

      const res = await fetch(apiUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${res.status} Error`);
      }

      const apiResponse: UserOptionsApiResponse = await res.json();

      if (!Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        throw new Error(
          isValidAddress
            ? `No options data found for address: ${searchedAddress}.`
            : "No options data found for default view."
        );
      }

      const transformed = apiResponse.data.map((item: RawApiOptionRecord) => ({
        userAddress: item.user_address,
        putValue: parseFloat(item.put_value),
        callValue: parseFloat(item.call_value),
      }));

      if (!isMounted) return;

      if (isValidAddress) {
        const exactMatch = transformed.find(opt => opt.userAddress.toLowerCase() === searchedAddress?.toLowerCase());
        if (exactMatch) {
          setOptionsDataList([exactMatch]);
        } else {
          setError(`No options data found for address: ${searchedAddress}.`);
        }
      } else {
        setOptionsDataList(transformed.slice(0, 10));
      }
    } catch (err) {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : "Failed to fetch user options.");
    } finally {
      if (isMounted) {
        setInternalIsLoading(false);
        setParentIsLoading(false);
      }
    }
  };

  fetchOptions();

  return () => {
    isMounted = false;
  };
}, [searchedAddress, setParentIsLoading]);


  const combinedIsLoading = parentIsLoading || internalIsLoading;

  if (combinedIsLoading && optionsDataList.length === 0) {
    return <UserOptionsTableSkeleton />;
  }

  return (
    <section aria-labelledby="user-options-title" className="mt-8">
      <h2 id="user-options-title" className="text-xl font-semibold mb-4">
        {searchedAddress ? `Options for ${searchedAddress.substring(0, 6)}...` : "Recent User Options"}
      </h2>

      {error && !combinedIsLoading && (
         <div
           className="flex items-center p-4 mb-4 text-sm rounded-lg border bg-muted text-red-600 border-red-600 dark:text-red-400 dark:border-500"
           role="alert"
         >
           <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0"/>
           <span className="font-medium">{error}</span>
         </div>
       )}

      {!combinedIsLoading && optionsDataList.length > 0 && (
        <Card className="shadow-lg transition-all duration-500 ease-in-out animate-fadeIn">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-lg font-semibold">User Options</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-4 py-3">User Address</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 py-3">Put Value</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 py-3">Call Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optionsDataList.map((data) => (
                    <TableRow key={data.userAddress} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium px-4 py-3">
                        <span className="font-mono text-sm" title={data.userAddress}>
                          {`${data.userAddress.substring(0, 6)}...${data.userAddress.substring(data.userAddress.length - 4)}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono px-4 py-3">
                        {data.putValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono px-4 py-3">
                        {data.callValue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!combinedIsLoading && optionsDataList.length === 0 && !error && (
        <Card className="shadow-lg animate-fadeIn">
            <CardContent className="p-6 text-center text-muted-foreground">
                {searchedAddress
                    ? `No options data found for address: ${searchedAddress.substring(0, 6)}...`
                    : "No options data available."
                }
            </CardContent>
        </Card>
      )}
    </section>
  );
}

// Skeleton and animation styles remain unchanged.
function UserOptionsTableSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 border-b">
        <Skeleton className="h-6 w-48 rounded-md" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableHead key={i} className="px-4 py-3"><Skeleton className="h-5 w-24" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                    <TableCell key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;

if (typeof window !== 'undefined') {
  if (!document.getElementById('user-options-table-animation-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "user-options-table-animation-styles";
    styleSheet.type = "text/css";
    styleSheet.innerText = animationStyles;
    document.head.appendChild(styleSheet);
  }
}