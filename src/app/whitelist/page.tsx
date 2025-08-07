// src/app/whitelist/page.tsx (or wherever your file is located)
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
import { Label } from "@/components/ui/label";
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
import { Loader2 } from "lucide-react"; // For loading spinner in button

// ------------------------
// ZOD SCHEMA
// ------------------------

const isEthereumAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);
const isBitcoinAddress = (address: string) =>
  /^(bc1|tb1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
const isSolanaAddress = (address: string) =>
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);

const whitelistSchema = z
  .object({
    connectedWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
      message: "Enter a valid Ethereum address",
    }),
    assetType: z.enum(["BTC", "ETH", "USDC", "SOL"], {
      required_error: "Select an asset type",
    }),
    collateralWallet: z.string().min(1, "Collateral wallet address is required"),
  })
  .refine(
    (data) => {
      if (!data.assetType) return true; // Don't validate if asset type isn't selected
      switch (data.assetType) {
        case "ETH":
        case "USDC":
          return isEthereumAddress(data.collateralWallet);
        case "BTC":
          return isBitcoinAddress(data.collateralWallet);
        case "SOL":
          return isSolanaAddress(data.collateralWallet);
        default:
          return false;
      }
    },
    {
      message: "Enter a valid wallet address for the selected asset type",
      path: ["collateralWallet"],
    }
  );

type WhitelistFormData = z.infer<typeof whitelistSchema>;

interface WhitelistRequest {
  id: number;
  connectedWallet: string;
  assetType: string;
  collateralWallet: string;
  status: "Approved" | "Pending" | "Options Set" | "Rejected";
}

export default function WhitelistPage() {
  const { address: currentUserAddress } = useAccount();
  const router = useRouter();

  const [requests, setRequests] = useState<WhitelistRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // <-- New state for form submission
  const [error, setError] = useState<string | null>(null);

  const form = useForm<WhitelistFormData>({
    resolver: zodResolver(whitelistSchema),
    mode: "onChange",
    defaultValues: {
      connectedWallet: currentUserAddress || "",
      assetType: undefined,
      collateralWallet: "",
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
      if (!response.ok) throw new Error("Failed to fetch whitelist requests.");
      const data = await response.json();
      // Normalize to array
    const normalized = Array.isArray(data) ? data : [data];

    // Format field names to match your UI code
    const formatted = normalized.map((item) => ({
      id: item.id,
      connectedWallet: item.connected_wallet,
      assetType: item.asset_type,
      collateralWallet: item.collateral_wallet,
      status:
        item.status === "approved"
          ? "Approved"
          : item.status === "pending"
          ? "Pending"
          : item.status === "options_set"
          ? "Options Set"
          : "Rejected",
    }));
  setRequests(formatted);
    } catch (err: any) {
        console.log('error : ', err)
      setError(err.message);
      toast.error("Could not load your requests."); // Optional error toast for fetching
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------
  // Refactor Agent & BugFixer Agent Note:
  // This useEffect now correctly depends on `currentUserAddress`.
  // It will automatically re-fetch requests when the user connects or disconnects.
  // ------------------------
  useEffect(() => {
    fetchRequests();
  }, [currentUserAddress]);

  // ------------------------
  // Refactor Agent & BugFixer Agent Note:
  // The onSubmit handler is now robust. It uses async/await with `react-hot-toast`
  // for a modern UX and sets the `isSubmitting` state to prevent double clicks.
  // ------------------------
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
        throw new Error("Failed to submit request. Please try again.");
      }

      toast.success("Request submitted successfully!", { id: toastId });
      form.reset({
        connectedWallet: currentUserAddress || "",
        assetType: undefined,
        collateralWallet: "",
      });

      fetchRequests(); // Re-fetch requests to update the table
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.", { id: toastId });
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="connectedWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connected Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.trigger("collateralWallet"); // Re-validate collateral wallet on change
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                        <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collateralWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collateral Wallet Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the address for your chosen asset..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
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
        {/* ... rest of your table JSX ... it remains the same */}
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
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Collateral Wallet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{`REQ-${request.id}`}</TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {request.connectedWallet}
                      </TableCell>
                      <TableCell>{request.assetType}</TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {request.collateralWallet}
                      </TableCell>
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
                        {request.status === "Approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetOptions(request.id)}
                          >
                            Set Options
                          </Button>
                        )}
                        {request.status === "Options Set" && (
                          <Button variant="outline" size="sm" disabled>
                            Options Set
                          </Button>
                        )}
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