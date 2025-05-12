"use client";

import * as React from 'react';
// Assuming UserPosition and UserPositionStatus are correctly defined in '@/lib/types'
// For example:
// export type UserPositionStatus = 'Safe' | 'Warning' | 'Liquidated';
// export interface UserPosition {
//   id: string | number;
//   address: string;
//   btcCollateral: number;
//   usbdDebt: number;
//   collateralRatio: number;
//   liquidationThreshold: number; // This is often a general protocol parameter
//   status: UserPositionStatus;
//   blockchain: string;
//   oraclePrice: number; // BTC Price
//   timestamp: string; // created_at
// }
import type { UserPosition, UserPositionStatus } from '@/lib/types';
import { STATUS_STYLES, getCRColorClass, ADDRESS_REGEX } from '@/lib/constants'; // Assuming these are correctly defined
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, AlertCircle, Filter, Search, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'; // Added missing icons if not in STATUS_STYLES
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Define the structure of a single record from the API
interface ApiRecord {
  id: number;
  user_address: string;
  blockchain: string;
  btc_amount: string;
  btc_price: string;
  usbd_minted: string;
  collateral_ratio: string;
  created_at: string;
}

// Define the structure of the API response
interface ApiResponse {
  status: boolean;
  data: ApiRecord[];
  message?: string; // Optional message field for errors
}

interface UserPositionTableProps {
  searchedAddress: string | null;
  isLoading: boolean; // This prop is controlled by the parent for initial load indication
  setIsLoading: (loading: boolean) => void; // Parent's setIsLoading
}

// Define thresholds for status calculation
const LIQUIDATION_THRESHOLD_VALUE = 150; // Standard Liquidation Threshold percentage
const SAFE_CR_LOWER_BOUND = 200; // Collateral Ratio percentage above which is considered 'Safe'

// Helper function to derive status (ensure UserPositionStatus matches this)
function derivePositionStatus(collateralRatio: number): UserPositionStatus {
  if (collateralRatio <= LIQUIDATION_THRESHOLD_VALUE) {
    return 'Liquidated';
  } else if (collateralRatio < SAFE_CR_LOWER_BOUND) {
    return 'Warning';
  } else {
    return 'Safe';
  }
}

export function UserPositionTable({ searchedAddress, isLoading: parentIsLoading, setIsLoading: setParentIsLoading }: UserPositionTableProps) {
  const [positions, setPositions] = React.useState<UserPosition[]>([]);
  const [internalIsLoading, setInternalIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<UserPositionStatus | 'all'>('all');
  const { toast } = useToast();

  // Effect to handle reset when searchedAddress is cleared or initial validation
  React.useEffect(() => {
    if (!searchedAddress) {
      setPositions([]);
      setError(null);
      setInternalIsLoading(false); 
      // If parent was loading due to this component's search, signal it's done.
      if (parentIsLoading && internalIsLoading) setParentIsLoading(false);
      return;
    }

    // Validate address format early
    if (!ADDRESS_REGEX.test(searchedAddress)) {
      setError("Invalid address format provided.");
      setPositions([]); 
      setInternalIsLoading(false);
      if (parentIsLoading) setParentIsLoading(false); // Signal validation failure means not loading data
      return; // Stop further processing for this effect if address is invalid
    }
    // If address is valid but we are not fetching yet, ensure error is cleared from previous invalid attempts
    // This is handled by setError(null) in fetchPositions.
  }, [searchedAddress, parentIsLoading, internalIsLoading, setParentIsLoading]);


  // Effect for fetching data when a valid searchedAddress is present
  React.useEffect(() => {
    // Only proceed if searchedAddress is present and valid
    if (!searchedAddress || !ADDRESS_REGEX.test(searchedAddress)) {
      // Reset/validation is handled by the effect above.
      // If it became invalid after being valid, the above effect would clear things.
      return;
    }

    const fetchPositions = async () => {
      setInternalIsLoading(true);
      if (setParentIsLoading) setParentIsLoading(true); 
      setError(null); // Reset error before new fetch
      setPositions([]); // Clear previous positions immediately

      try {
        const response = await fetch(`http://139.59.8.108:3010/service/record/${searchedAddress}`);
        
        if (!response.ok) {
          let errorMsg = `HTTP error! Status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg; 
          } catch (parseError) { /* Ignore */ }
          throw new Error(errorMsg);
        }

        const result: ApiResponse = await response.json();

        if (result.status && result.data && result.data.length > 0) {
          const transformedPositions: UserPosition[] = result.data.map(record => {
            const collateralRatio = parseFloat(record.collateral_ratio);
            return {
              id: record.id.toString(), 
              address: record.user_address,
              btcCollateral: parseFloat(record.btc_amount),
              usbdDebt: parseFloat(record.usbd_minted),
              collateralRatio: collateralRatio,
              liquidationThreshold: LIQUIDATION_THRESHOLD_VALUE, 
              status: derivePositionStatus(collateralRatio),
              blockchain: record.blockchain,
              oraclePrice: parseFloat(record.btc_price),
              timestamp: record.created_at,
            };
          });
          setPositions(transformedPositions);
        } else if (result.status && (!result.data || result.data.length === 0)) {
          setError(`No position found for address: ${searchedAddress}.`);
        } else {
          setError(result.message || "Failed to fetch data: API reported an issue.");
        }
      } catch (err) {
        console.error("Failed to fetch user positions:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching positions.");
      } finally {
        setInternalIsLoading(false);
        if (setParentIsLoading) setParentIsLoading(false); 
      }
    };

    fetchPositions();
  // Only re-run if searchedAddress changes (and is valid).
  // setParentIsLoading is stable. ADDRESS_REGEX is constant.
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [searchedAddress]); 

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Address Copied!", description: address });
  };

  const filteredPositions = React.useMemo(() => {
    return positions
      .filter(pos => statusFilter === 'all' || pos.status === statusFilter)
      .filter(pos => 
        pos.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [positions, statusFilter, searchTerm]);

  const combinedIsLoading = parentIsLoading || internalIsLoading;

  // Skeleton View: Shown when actively loading a new search for the first time for that address
  if (combinedIsLoading && positions.length === 0 && searchedAddress && ADDRESS_REGEX.test(searchedAddress)) { 
    return <UserTableSkeleton />;
  }
  
  return (
    <section aria-labelledby="user-position-title">
      <h2 id="user-position-title" className="sr-only">
        User Position Details
      </h2>
      
      {/* API Error Message Area: Displayed if an error occurs (validation or fetch)
          and we are not showing the initial skeleton for that search. */}
      {error && !(combinedIsLoading && positions.length === 0 && searchedAddress && ADDRESS_REGEX.test(searchedAddress)) && ( 
         <div 
           className="flex items-center p-4 mb-4 text-sm rounded-lg border bg-muted text-red-600 border-red-600 dark:text-red-400 dark:border-red-500" 
           role="alert"
         >
           <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0"/>
           <span className="font-medium">{error}</span>
         </div>
       )}

      {/* Table Card: Always shown unless it's the initial skeleton loading state for a specific, valid search */}
      {!(combinedIsLoading && positions.length === 0 && searchedAddress && ADDRESS_REGEX.test(searchedAddress)) && (
        <Card className="shadow-lg transition-all duration-500 ease-in-out animate-fadeIn">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-b">
            <div className="relative flex-grow md:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Filter by address or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full rounded-md"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-md">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter Status ({statusFilter === 'all' ? 'All' : statusFilter})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3">
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: UserPositionStatus | 'all') => setStatusFilter(value)}
                  >
                    <SelectTrigger id="status-filter" className="w-full rounded-md">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Safe">Safe</SelectItem>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Liquidated">Liquidated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-4 py-3">User Address</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 py-3">BTC (Collateral)</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 py-3">USBD (Debt)</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 py-3">CR (%)</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 py-3">Liq. Threshold (%)</TableHead>
                    <TableHead className="text-center whitespace-nowrap px-4 py-3">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Case 1: Parent is loading (e.g. global metrics) and no address searched yet
                    if (parentIsLoading && !internalIsLoading && !searchedAddress) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground px-4 py-3">
                            Loading...
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Case 2: No address searched yet (and parent/internal not loading for this specific component's primary task)
                    if (!searchedAddress && !internalIsLoading && !parentIsLoading) { // Check parentIsLoading to ensure global loads are done
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground px-4 py-3">
                            Please enter a user address to search for positions.
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    // Case 3: Actively fetching data for a searched address (internal loading is true)
                    // This is a more specific loading message within the table if skeleton isn't shown.
                    if (internalIsLoading && searchedAddress && positions.length === 0) {
                       return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground px-4 py-3">
                            Fetching position data...
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Case 4: Address searched, data found, and filtered results exist
                    if (searchedAddress && positions.length > 0 && filteredPositions.length > 0) {
                      return filteredPositions.map((pos) => {
                        const safeStatusStyles = { 
                            icon: ShieldCheck, 
                            textColor: 'text-green-600 dark:text-green-400', 
                            bgColor: 'bg-green-500/10', 
                            borderColor: 'border-green-500/30' 
                        };
                        const statusStyle = STATUS_STYLES && pos.status && STATUS_STYLES[pos.status] 
                                            ? STATUS_STYLES[pos.status] 
                                            : safeStatusStyles; 
                        const StatusIcon = statusStyle.icon || AlertCircle; 

                        return (
                          <TableRow key={pos.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm" title={pos.address}>
                                  {`${pos.address.substring(0, 6)}...${pos.address.substring(pos.address.length - 4)}`}
                                </span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAddress(pos.address)}>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="sr-only">Copy address</span>
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono px-4 py-3">{pos.btcCollateral.toFixed(4)}</TableCell>
                            <TableCell className="text-right font-mono px-4 py-3">{pos.usbdDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className={cn("text-right font-semibold px-4 py-3", getCRColorClass ? getCRColorClass(pos.collateralRatio) : statusStyle.textColor)}>
                              {pos.collateralRatio.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right font-mono px-4 py-3">{pos.liquidationThreshold.toFixed(2)}%</TableCell>
                            <TableCell className="text-center px-4 py-3">
                               <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-xs font-semibold px-2.5 py-1 rounded-full border",
                                    statusStyle.textColor,
                                    statusStyle.bgColor,
                                    statusStyle.borderColor
                                )}
                                >
                                <StatusIcon className={cn("mr-1.5 h-3.5 w-3.5", statusStyle.textColor)} />
                                {pos.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    }

                    // Case 5: Address searched, data found, but no filtered results
                    if (searchedAddress && positions.length > 0 && filteredPositions.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground px-4 py-3">
                            No positions match your current filters.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Case 6: Address searched, but no positions found (API returned empty or error), and not loading.
                    // The 'error' state (if any) is displayed above the card. This is a generic message for the table body.
                    if (searchedAddress && positions.length === 0 && !internalIsLoading && !parentIsLoading) {
                       return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground px-4 py-3">
                            No data available for this address.
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    // Fallback: Should ideally not be reached if logic is exhaustive.
                    // Could be if parent is loading and searchedAddress is also present but internalIsLoading is false.
                    // Or if searchedAddress is invalid and error is set, this might be a brief state.
                    if (!internalIsLoading && !parentIsLoading && !error) { // A catch-all for truly empty states not covered
                         return (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground px-4 py-3">
                                    Please enter a user address to search for positions.
                                </TableCell>
                            </TableRow>
                        );
                    }


                    return null; 
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

// Skeleton component remains the same
function UserTableSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-10 w-full md:w-1/3 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableHead key={i} className="px-4 py-3"><Skeleton className="h-5 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
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

// Basic fadeIn animation for the table appearance
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;

// Inject styles once
if (typeof window !== 'undefined') {
  if (!document.getElementById('user-position-table-animation-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "user-position-table-animation-styles";
    styleSheet.type = "text/css";
    styleSheet.innerText = animationStyles;
    document.head.appendChild(styleSheet);
  }
}
