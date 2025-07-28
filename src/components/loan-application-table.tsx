// src/components/loan-applications-table.tsx

"use client";

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Define the type for a single loan application
export interface LoanApplication {
  id: number;
  wallet_address: string;
  loan_amount: string; // Comes as string from DB, parse to number for formatting
  loan_currency: string;
  collateral_asset: string;
  wallet_type: string;
  loan_status: 'Approval Pending' | 'Approved' | 'Rejected' | 'Repaid';
  created_at: string;
}

// Map statuses to badge colors for styling
const STATUS_COLORS: Record<LoanApplication['loan_status'], string> = {
  'Approval Pending': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  'Approved': 'bg-green-500/20 text-green-600 border-green-500/30',
  'Rejected': 'bg-red-500/20 text-red-600 border-red-500/30',
  'Repaid': 'bg-blue-500/20 text-blue-600 border-blue-500/30',
};

export function LoanApplicationsTable() {
  const [applications, setApplications] = React.useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // NOTE: Make sure your API endpoint is correct.
        // Assuming your backend runs on the same domain or is proxied.
        // Update URL if needed: e.g., 'https://api-occam.bima.money/loan/applications'
        const response = await fetch('/api/loan/applications');

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data: LoanApplication[] = await response.json();
        setApplications(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error fetching loan applications',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [toast]);

  const filteredApplications = React.useMemo(() => {
    if (!searchTerm) {
      return applications;
    }
    return applications.filter(app =>
      app.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [applications, searchTerm]);

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell colSpan={7} className="p-0">
             <Skeleton className="h-12 w-full" />
          </TableCell>
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24 text-red-500">
            <div className="flex items-center justify-center">
              <AlertCircle className="mr-2 h-5 w-5" /> {error}
            </div>
          </TableCell>
        </TableRow>
      );
    }
    
    if (filteredApplications.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No applications found matching your search.
                </TableCell>
            </TableRow>
        );
    }

    return filteredApplications.slice(0, 10).map((app) => (
      <TableRow key={app.id} className="hover:bg-muted/50">
        <TableCell className="font-mono text-sm">
          {`${app.wallet_address.substring(0, 6)}...${app.wallet_address.substring(app.wallet_address.length - 4)}`}
        </TableCell>
        <TableCell className="text-right font-medium">{Number(app.loan_amount).toLocaleString()}</TableCell>
        <TableCell>{app.loan_currency}</TableCell>
        <TableCell>{app.collateral_asset}</TableCell>
        <TableCell>{app.wallet_type}</TableCell>
        <TableCell className="text-center">
          <Badge variant="outline" className={cn("text-xs font-semibold", STATUS_COLORS[app.loan_status])}>
            {app.loan_status}
          </Badge>
        </TableCell>
         <TableCell className="text-right text-muted-foreground text-xs">
          {new Date(app.created_at).toLocaleDateString()}
        </TableCell>
      </TableRow>
    ));
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Loan Applications</CardTitle>
          <div className="relative flex-grow sm:flex-grow-0 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by wallet address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet Address</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Collateral Asset</TableHead>
                <TableHead>Wallet Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}