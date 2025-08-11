"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';

// Utility functions for address validation
const isEthereumAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);
const isBitcoinAddress = (address: string) => /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
const isDogecoinAddress = (address: string) => /^D[5-9A-HJ-NP-Z][a-km-zA-HJ-NP-Z1-9]{32}$|^A[5-9A-HJ-NP-Z][a-km-zA-HJ-NP-Z1-9]{32}$|^9[5-9A-HJ-NP-Z][a-km-zA-HJ-NP-Z1-9]{32}$/.test(address);
const isLitecoinAddress = (address: string) => /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{26,70}$/.test(address);

// Define a type for the component's props
interface LoanApplicationModalProps {
  connectedAddress?: `0x${string}`; // <-- New Prop Type
  onLoanSubmitted?: () => void; // Callback to re-fetch loans after submission
}

// Define the validation schema using Zod
const formSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Please enter a valid Ethereum address.",
  }),
  collateralAsset: z.enum(["Dogecoin", "Litecoin", "Bitcoin"], {
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
  if (!data.collateralAsset || !data.collateralAddress) return true; // Don't validate if not selected or empty
  switch (data.collateralAsset) {
    case "Bitcoin":
      return isBitcoinAddress(data.collateralAddress);
    case "Dogecoin":
      return isDogecoinAddress(data.collateralAddress);
    case "Litecoin":
      return isLitecoinAddress(data.collateralAddress);
    default:
      return false; // Should not happen with enum, but for safety
  }
}, {
  message: "Enter a valid address for the selected collateral asset.",
  path: ["collateralAddress"],
});

export function LoanApplicationModal({ connectedAddress, onLoanSubmitted }: LoanApplicationModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      walletAddress: "",
      collateralAmount: 0,
      loanAmount: 0,
      loanCurrency: undefined,
      walletType: undefined,
      collateralAsset: undefined,
      collateralAddress: ""
    },
  });

  React.useEffect(() => {
    if (connectedAddress) {
      form.setValue('walletAddress', connectedAddress, { shouldValidate: true });
    } else {
      form.setValue('walletAddress', '', { shouldValidate: true });
    }
  }, [connectedAddress, form]);

  // Re-validate collateral address when collateral asset changes
  const handleCollateralAssetChange = (value: string) => {
    form.setValue('collateralAsset', value as any, { shouldValidate: true });
    form.trigger('collateralAddress'); // Trigger validation for collateralAddress
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting application...');

    try {
      const response = await fetch('/api/loan', { // Assuming /api/loan is the endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Submission failed. Please try again.');
      }

      toast.success('Application submitted successfully!', { id: toastId });
      form.reset({
        walletAddress: connectedAddress || "",
        collateralAsset: undefined,
        collateralAmount: 0,
        loanAmount: 0,
        loanCurrency: undefined,
        walletType: undefined,
        collateralAddress: ""
      });

      setIsOpen(false);
      onLoanSubmitted?.(); // Call the callback after successful submission

    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred.', { id: toastId });
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={!connectedAddress}>
          Apply for Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl"> {/* Increased width */}
        <DialogHeader>
          <DialogTitle>Loan Application</DialogTitle>
          <DialogDescription>
            Fill out the form below to apply for a loan. Click submit when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"> {/* Grid layout for better aesthetics */}
            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2"> {/* Full width */}
                  <FormLabel>Your Ethereum Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collateralAsset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Asset</FormLabel>
                  <Select onValueChange={handleCollateralAssetChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset to lock" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bitcoin">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="Dogecoin">Dogecoin (DOGE)</SelectItem>
                      <SelectItem value="Litecoin">Litecoin (LTC)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <DialogFooter className="md:col-span-2 mt-4"> {/* Full width footer */}
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}