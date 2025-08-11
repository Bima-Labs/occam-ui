"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LoanApplicationModal } from "@/components/loan-application-modal";

// Define the LoanRequest interface
interface LoanRequest {
  id: number;
  walletAddress: string;
  collateralAsset: string;
//   collateralAmount: number;
  loanAmount: number;
  loanCurrency: string;
  walletType: string;
  status: "Approved" | "Pending" | "Options Set" | "Rejected";
  // Add other fields as necessary from your backend
}

// Utility to format status - FIX: Add .trim() for robustness
function formatLoanStatus(status: string | null | undefined): LoanRequest["status"] {
  if (typeof status !== 'string' || !status) {
    return "Pending"; // Default to 'Pending' if status is null, undefined, or not a string
  }
  // Trim whitespace and convert to lowercase for consistent comparison
  const normalizedStatus = status.trim().toLowerCase();
  console.log('Normalized status:', normalizedStatus);
  switch (normalizedStatus) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "options set":
    case "options_set":
      return "Options Set";
    case "rejected":
      return "Rejected";
    default:
      console.warn(`Unknown loan status received: "${status}". Defaulting to "Pending".`);
      return "Pending"; // fallback for unrecognized string values
  }
}

export default function LoanPage() {
  const { address: currentUserAddress, isConnected } = useAccount();
  const router = useRouter();

  const [myLoanRequests, setMyLoanRequests] = useState<LoanRequest[]>([]);
  const [allLoanRequests, setAllLoanRequests] = useState<LoanRequest[]>([]);
  const [isLoadingMyRequests, setIsLoadingMyRequests] = useState(true);
  const [isLoadingAllRequests, setIsLoadingAllRequests] = useState(true);
  const [errorMyRequests, setErrorMyRequests] = useState<string | null>(null);
  const [errorAllRequests, setErrorAllRequests] = useState<string | null>(null);

  const fetchMyLoanRequests = async () => {
    if (!currentUserAddress) {
      setMyLoanRequests([]);
      setIsLoadingMyRequests(false);
      return;
    }
    setIsLoadingMyRequests(true);
    setErrorMyRequests(null);
    try {
      const url = `/api/loan/my-requests?walletAddress=${currentUserAddress}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch your loan requests.");
      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [data];
      const formatted = normalized.map((item: any) => ({
        id: item.id,
        walletAddress: item.wallet_address,
        collateralAsset: item.collateral_asset,
        loanAmount: item.loan_amount,
        loanCurrency: item.loan_currency,
        walletType: item.wallet_type,
        status: formatLoanStatus(item.loan_status)
      }));
        console.log('formatted : ', formatted)
      setMyLoanRequests(formatted);
    } catch (err: any) {
      console.error('Error fetching my loan requests:', err);
      setErrorMyRequests(err.message);
      toast.error("Could not load your loan requests.");
    } finally {
      setIsLoadingMyRequests(false);
    }
  };

  const fetchAllLoanRequests = async () => {
    setIsLoadingAllRequests(true);
    setErrorAllRequests(null);
    try {
      const url = `/api/loan/all-requests`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch all loan requests.");
      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [data];
      const formatted = normalized.map((item: any) => ({
        id: item.id,
        walletAddress: item.wallet_address,
        collateralAsset: item.collateral_asset,
        // collateralAmount: item.collateral_amount,
        loanAmount: item.loan_amount,
        loanCurrency: item.loan_currency,
        walletType: item.wallet_type,
        collateralAddress: item.collateral_address,
        status: formatLoanStatus(item.status)
      }));
      setAllLoanRequests(formatted);
    } catch (err: any) {
      console.error('Error fetching all loan requests:', err);
      setErrorAllRequests(err.message);
      toast.error("Could not load all loan requests.");
    } finally {
      setIsLoadingAllRequests(false);
    }
  };

  const refreshLoanRequests = () => {
    fetchMyLoanRequests();
    fetchAllLoanRequests();
  };

  useEffect(() => {
    refreshLoanRequests();
  }, [currentUserAddress]);

  const handleSetOptions = () => {
    router.push(`/options`);
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-screen bg-gray-50">
      <Card className="w-full max-w-4xl mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Apply for a New Loan</CardTitle>
          <CardDescription>
            Submit a new loan application to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <LoanApplicationModal
              connectedAddress={currentUserAddress}
              onLoanSubmitted={refreshLoanRequests}
            />
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Card className="w-full max-w-4xl mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Your Loan Requests</CardTitle>
            <CardDescription>
              View the status of your submitted loan applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMyRequests && (
              <p className="text-center text-muted-foreground">Loading your requests...</p>
            )}
            {errorMyRequests && <p className="text-center text-red-500">{errorMyRequests}</p>}
            {!isLoadingMyRequests && !errorMyRequests && myLoanRequests.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You have not submitted any loan requests yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan ID</TableHead>
                      <TableHead>Collateral Asset</TableHead>
                      {/* <TableHead>Collateral Amount</TableHead> */}
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Options</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLoanRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{`LOAN-${request.id}`}</TableCell>
                        <TableCell>{request.collateralAsset}</TableCell>
                        {/* <TableCell>{request.collateralAmount}</TableCell> */}
                        <TableCell>{request.loanAmount}</TableCell>
                        <TableCell>{request.loanCurrency}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              request.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : request.status === "Options Set"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetOptions()}
                            disabled={request.status !== "Approved"}
                          >
                            Set Options
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle>All Loan Requests</CardTitle>
          <CardDescription>
            View all loan applications submitted across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAllRequests && (
            <p className="text-center text-muted-foreground">Loading all requests...</p>
          )}
          {errorAllRequests && <p className="text-center text-red-500">{errorAllRequests}</p>}
          {!isLoadingAllRequests && !errorAllRequests && allLoanRequests.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No loan requests have been submitted yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Applicant Wallet</TableHead>
                    <TableHead>Collateral Asset</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Options</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLoanRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{`LOAN-${request.id}`}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{request.walletAddress}</TableCell>
                      <TableCell>{request.collateralAsset}</TableCell>
                      <TableCell>{request.loanAmount}</TableCell>
                      <TableCell>{request.loanCurrency}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            request.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "Options Set"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                          View Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}