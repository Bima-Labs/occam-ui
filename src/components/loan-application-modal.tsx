// src/components/loan-application-modal.tsx
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

// Define a type for the component's props
interface LoanApplicationModalProps {
  connectedAddress?: `0x${string}`; // <-- New Prop Type
}

// Define the validation schema using Zod
const formSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Please enter a valid Ethereum address.",
  }),
     collateralAsset: z.enum(["Dogecoin", "Litecoin", "Bitcoin"], { // <-- ADDED
    required_error: "You need to select a collateral asset."
  }),
  collateralAmount: z.coerce.number().positive({ message: "Amount must be positive." }),
  loanAmount: z.coerce.number().positive({ message: "Loan amount must be positive." }),
  loanCurrency: z.enum(["USDC", "USDT"], {
    required_error: "You need to select a loan currency."
  }),
  walletType: z.enum(["Multisig", "Native", "Contract"], {
    required_error: "You need to select a wallet type."
  })
});

export function LoanApplicationModal({ connectedAddress }: LoanApplicationModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
 const [isSubmitting, setIsSubmitting] = React.useState(false);
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      walletAddress: "",
      collateralAmount: 0,
      loanAmount: 0,
    },
  });

      React.useEffect(() => {
    if (connectedAddress) {
      form.setValue('walletAddress', connectedAddress, { shouldValidate: true });
    } else {
        // Clear the field if the user disconnects while the form is open
        form.setValue('walletAddress', '', { shouldValidate: true });
    }
      }, [connectedAddress, form]);
    
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
setIsSubmitting(true);
    const toastId = toast.loading('Submitting application...');

    try {
      const response = await fetch('/api/loan', {
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
});

      setIsOpen(false);

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
     <Button variant="outline" disabled={!connectedAddress}>
            Apply for Loan
          </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Loan Application</DialogTitle>
          <DialogDescription>
            Fill out the form below to apply for a loan. Click submit when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Ethereum Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} readOnly/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
                      />
                       {/* ADD THIS NEW FORM FIELD for Collateral Asset */}
            <FormField
              control={form.control}
              name="collateralAsset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Asset</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
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

            <DialogFooter>
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