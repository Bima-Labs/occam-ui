
"use client";

import * as React from 'react';
import type { UserPosition, UserPositionStatus } from '@/lib/types';
import { MOCK_USER_POSITIONS, STATUS_STYLES, getCRColorClass, ADDRESS_REGEX } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, AlertCircle, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface UserPositionTableProps {
  searchedAddress: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function UserPositionTable({ searchedAddress, isLoading, setIsLoading }: UserPositionTableProps) {
  const [positions, setPositions] = React.useState<UserPosition[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<UserPositionStatus | 'all'>('all');
  const { toast } = useToast();

  React.useEffect(() => {
    if (!searchedAddress) {
      setPositions([]); 
      setError(null);
      return;
    }

    if (!ADDRESS_REGEX.test(searchedAddress)) {
        setError("Invalid address format provided.");
        setPositions([]);
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      const foundPosition = MOCK_USER_POSITIONS.find(p => p.address.toLowerCase() === searchedAddress.toLowerCase());
      if (foundPosition) {
        setPositions([foundPosition]);
      } else {
        setError(`No position found for address: ${searchedAddress}. Displaying sample data as fallback.`);
        setPositions(MOCK_USER_POSITIONS); 
      }
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchedAddress, setIsLoading]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Address Copied!", description: address });
  };

  const filteredPositions = React.useMemo(() => {
    return positions
      .filter(pos => statusFilter === 'all' || pos.status === statusFilter)
      .filter(pos => pos.address.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [positions, statusFilter, searchTerm]);


  if (isLoading) {
    return <UserTableSkeleton />;
  }

  return (
    <section aria-labelledby="user-position-title">
      <h2 id="user-position-title" className="sr-only">
        User Position Details
      </h2>
      
      {error && !isLoading && (
         <div 
            className="flex items-center p-4 mb-4 text-sm rounded-lg border bg-muted text-warning border-warning" 
            role="alert"
          >
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0"/>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {(!error || positions.length > 0) && (
      <Card className="shadow-lg transition-all duration-500 ease-in-out animate-fadeIn">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-b">
          <div className="relative flex-grow md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full rounded-md"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-md">
                <Filter className="mr-2 h-4 w-4" />
                Filter Status
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
                  <TableHead className="whitespace-nowrap">User Address</TableHead>
                  <TableHead className="text-right whitespace-nowrap">BTC (Collateral)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">USBD (Debt)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">CR (%)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Liquidation Threshold (%)</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.length > 0 ? (
                  filteredPositions.map((pos) => {
                    const StatusIcon = STATUS_STYLES[pos.status].icon;
                    const statusTextColor = STATUS_STYLES[pos.status].textColor;
                    return (
                      <TableRow key={pos.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {`${pos.address.substring(0, 6)}...${pos.address.substring(pos.address.length - 4)}`}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAddress(pos.address)}>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy address</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{pos.btcCollateral.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{pos.usbdDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className={cn("text-right font-semibold", getCRColorClass(pos.collateralRatio))}>
                          {pos.collateralRatio.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">{pos.liquidationThreshold.toFixed(2)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", statusTextColor, 
                            pos.status === 'Safe' ? 'border-success bg-success/10' : 
                            pos.status === 'Warning' ? 'border-warning bg-warning/10' : 
                            'border-destructive bg-destructive/10'
                          )}>
                            <StatusIcon className={cn("mr-1.5 h-3.5 w-3.5", statusTextColor)} />
                            {pos.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No positions match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {!isLoading && !error && searchedAddress && positions.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-medium">No Position Found</p>
          <p>We couldn't find any position associated with the address: <span className="font-mono">{searchedAddress}</span>.</p>
        </div>
      )}
    </section>
  );
}


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
                <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
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
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = animationStyles;
  document.head.appendChild(styleSheet);
}
