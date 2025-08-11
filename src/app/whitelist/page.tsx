"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// --- NEW/UPDATED ZOD SCHEMA & VALIDATION HELPERS ---
// Re-using and extending validation helpers from loan-application-modal.tsx
const isEthereumAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);
const isBitcoinAddress = (address: string) => /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
const isDogecoinAddress = (address: string) => /^D[5-9A-HJ-NP-Z][a-km-zA-HJ-NP-Z1-9]{32}$|^A[5-9A-HJ-NP-Z][a-km-zA-HJ-NP-Z1-9]{32}$|^9[5-9A-HJ-NP-Z][a-km-zA-HJ-NP-Z1-9]{32}$/.test(address);
const isLitecoinAddress = (address: string) => /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{26,70}$/.test(address);
const isSolanaAddress = (address: string) =>
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);


const whitelistSchema = z.object({
  connectedWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Please enter a valid Ethereum address.",
  }),
  collateralAsset: z.enum(["Dogecoin", "Litecoin", "Bitcoin", "Ethereum", "Solana", "USDC"], { // Expanded asset types
    required_error: "You need to select a collateral asset."
  }),
  collateralAmount: z.coerce.number().positive({ message: "Amount must be positive." }),
  loanAmount: z.coerce.number().positive({ message: "Loan amount must be positive." }),
  loanCurrency: z.enum(["USDC", "USDT"], {
    required_error: "You need to select a loan currency."
  }),
  walletType: z.enum(["Multisig", "Native", "Contract"], {
    required_error: "You need to select a wallet type."
  }),
  collateralAddress: z.string().min(1, "Collateral wallet address is required."),
}).refine((data) => {
  if (!data.collateralAsset || !data.collateralAddress) return true;
  switch (data.collateralAsset) {
    case "Bitcoin":
      return isBitcoinAddress(data.collateralAddress);
    case "Dogecoin":
      return isDogecoinAddress(data.collateralAddress);
    case "Litecoin":
      return isLitecoinAddress(data.collateralAddress);
    case "Ethereum":
    case "USDC": // USDC also uses Ethereum addresses
      return isEthereumAddress(data.collateralAddress);
    case "Solana":
      return isSolanaAddress(data.collateralAddress);
    default:
      return false;
  }
}, {
  message: "Enter a valid wallet address for the selected collateral asset.",
  path: ["collateralAddress"],
});

type WhitelistFormData = z.infer<typeof whitelistSchema>;

interface WhitelistRequest {
  id: number;
  connectedWallet: string; // Renamed from walletAddress to match existing context
  collateralAsset: string;
  collateralAmount: number;
  loanAmount: number;
  loanCurrency: string;
  walletType: string;
  collateralAddress: string;
  status: "Approved" | "Pending" | "Options Set" | "Rejected";
}

export default function WhitelistPage() {
  const { address: currentUserAddress } = useAccount();
  const router = useRouter();

  const [requests, setRequests] = useState<WhitelistRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<WhitelistFormData>({
    resolver: zodResolver(whitelistSchema),
    mode: "onChange",
    defaultValues: {
      connectedWallet: currentUserAddress || "",
      collateralAsset: undefined,
      collateralAmount: 0,
      loanAmount: 0,
      loanCurrency: undefined,
      walletType: undefined,
      collateralAddress: ""
    },
  });

  useEffect(() => {
    if (currentUserAddress) {
        form.setValue("connectedWallet", currentUserAddress, { shouldValidate: true });
    } else {
      form.setValue("connectedWallet", "", { shouldValidate: true });
    }
  }, [currentUserAddress, form]);

  const fetchRequests = async () => {
    if (!currentUserAddress) {
        setRequests([]);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/whitelist/get-whitelist-requests?address=${currentUserAddress}`;
      const response = await fetch(url);
      if (!response.ok) {
        // Handle no content or non-JSON for get-whitelist-requests similarly
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        if (response.status === 204 || (contentType && !contentType.includes('application/json')) || (contentLength === '0')) {
          console.log('Backend returned no content or non-JSON for whitelist requests. Returning empty array.');
          setRequests([]);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch whitelist requests.");
      }
      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [data];

      const formatted = normalized.map((item: any) => ({ // Ensure 'any' for unknown backend fields
        id: item.id,
        connectedWallet: item.connected_wallet || item.wallet_address, // Use either if backend differs
        collateralAsset: item.collateral_asset,
        collateralAmount: item.collateral_amount,
        loanAmount: item.loan_amount,
        loanCurrency: item.loan_currency,
        walletType: item.wallet_type,
        collateralAddress: item.collateral_address || item.collateral_wallet, // Use either if backend differs
        status: formatStatus(item.status)
      }))

      setRequests(formatted);
    } catch (err: any) {
        console.log('error : ', err)
      setError(err.message);
      toast.error("Could not load your requests.");
    } finally {
      setIsLoading(false);
    }
  };

function formatStatus(status: string | null | undefined): WhitelistRequest["status"] {
  if (typeof status !== 'string' || !status) {
    return "Pending";
  }
  const normalizedStatus = status.trim().toLowerCase();
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
      console.warn(`Unknown whitelist status received: "${status}". Defaulting to "Pending".`);
      return "Pending";
  }
}

  useEffect(() => {
    fetchRequests();
  }, [currentUserAddress]);

  const handleCollateralAssetChange = (value: string) => {
    form.setValue('collateralAsset', value as any, { shouldValidate: true });
    form.trigger('collateralAddress'); // Trigger validation for collateralAddress
  };

  const onSubmit = async (values: WhitelistFormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your request...");

    try {
      const response = await fetch("/api/whitelist/apply-whitelist-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Failed to submit request: ${response.statusText}. Details: ${errorDetails}`);
      }

      toast.success("Request submitted successfully!", { id: toastId });
      form.reset({
        connectedWallet: currentUserAddress || "",
        collateralAsset: undefined,
        collateralAmount: 0,
        loanAmount: 0,
        loanCurrency: undefined,
        walletType: undefined,
        collateralAddress: ""
      });

      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.", { id: toastId });
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetOptions = (requestId: number) => {
    router.push(`/options/${requestId}`);
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-screen bg-gray-50">
      {/* --- FORM CARD --- */}
      <Card className="w-full max-w-4xl mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Whitelist Request</CardTitle>
          <CardDescription>
            Fill out the form to request whitelist access for options trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <FormField
                control={form.control}
                name="connectedWallet"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Your Ethereum Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Collateral Asset (expanded options) */}
              <FormField
                control={form.control}
                name="collateralAsset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collateral Asset</FormLabel>
                    <Select onValueChange={handleCollateralAssetChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bitcoin">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="Dogecoin">Dogecoin (DOGE)</SelectItem>
                        <SelectItem value="Litecoin">Litecoin (LTC)</SelectItem>
                        <SelectItem value="Ethereum">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                        <SelectItem value="Solana">Solana (SOL)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Collateral Amount */}
              <FormField
                control={form.control}
                name="collateralAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Amount to Lock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Loan Amount */}
              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Loan Currency */}
              <FormField
                control={form.control}
                name="loanCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Wallet Type */}
              <FormField
                control={form.control}
                name="walletType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your wallet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Native">Native Wallet</SelectItem>
                        <SelectItem value="Multisig">Multisig</SelectItem>
                        <SelectItem value="Contract">Smart Contract Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Collateral Address */}
              <FormField
                control={form.control}
                name="collateralAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Collateral Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter valid address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full md:col-span-2 mt-4" // Span two columns and add margin-top
                disabled={!form.formState.isValid || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* --- TABLE CARD --- */}
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle>Your Whitelist Requests</CardTitle>
          <CardDescription>
            View the status of your submitted whitelist requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-center text-muted-foreground">Loading requests...</p>
          )}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!isLoading && !error && requests.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No requests submitted yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Connected Wallet</TableHead>
                    <TableHead>Collateral Asset</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{`REQ-${request.id}`}</TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {request.connectedWallet}
                      </TableCell>
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