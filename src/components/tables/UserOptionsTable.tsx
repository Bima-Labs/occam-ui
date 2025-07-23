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
    const fetchOptions = async () => {
      setInternalIsLoading(true);
      if (setParentIsLoading) setParentIsLoading(true);
      setError(null);
      setOptionsDataList([]);

      let apiUrl = '';
      let isSingleAddressSearch = false;

      if (searchedAddress && ADDRESS_REGEX.test(searchedAddress)) {
        apiUrl = `http://localhost:3010/service/get-user-options?userAddress=${searchedAddress}`;
        isSingleAddressSearch = true;
      } else if (searchedAddress === null || searchedAddress === '') {
        // Fetch all (up to 10) when no specific address is searched
        apiUrl = `http://localhost:3010/service/get-user-options`; // This endpoint should return all if no param
        isSingleAddressSearch = false;
      } else {
        setError("Invalid address format provided for options data.");
        setInternalIsLoading(false);
        if (setParentIsLoading) setParentIsLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          let errorMsg = `HTTP error! Status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) { /* Ignore */ }
          throw new Error(errorMsg);
        }

        const apiResponse: UserOptionsApiResponse = await response.json(); // Parse the full API response object

        // Check if the API response contains the 'data' array
        if (apiResponse && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
          // Transform raw API data into our UserOptionsData interface
          const transformedData: UserOptionsData[] = apiResponse.data.map((item: RawApiOptionRecord) => ({
            userAddress: item.user_address,
            putValue: parseFloat(item.put_value), // Convert string to number
            callValue: parseFloat(item.call_value), // Convert string to number
          }));

          if (isSingleAddressSearch) {
            // For single address search, we expect only one relevant result
            // Find the one matching the searched address (API might return others if it's not strictly filtered)
            const filteredSingleResult = transformedData.find(item => item.userAddress === searchedAddress);
            if (filteredSingleResult) {
              setOptionsDataList([filteredSingleResult]); // Set as array containing the single result
            } else {
              setError(`No options data found for address: ${searchedAddress}.`);
            }
          } else {
            // For fetching all data, limit to the first 10
            setOptionsDataList(transformedData.slice(0, 10));
          }
        } else {
          // No data array or empty data array found in the response
          const message = isSingleAddressSearch
            ? `No options data found for address: ${searchedAddress}.`
            : "No options data found for default view.";
          setError(message);
        }
      } catch (err) {
        console.error("Failed to fetch user options:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching options.");
      } finally {
        setInternalIsLoading(false);
        if (setParentIsLoading) setParentIsLoading(false);
      }
    };

    fetchOptions();
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