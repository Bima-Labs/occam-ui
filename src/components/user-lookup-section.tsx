"use client";

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ADDRESS_REGEX } from '@/lib/constants';
import type { AddressLookupFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";


interface UserLookupSectionProps {
  onAddressSubmit: (address: string) => void;
  isTableLoading: boolean;
}

const AddressSchema = z.object({
  address: z.string().regex(ADDRESS_REGEX, "Invalid blockchain address format (e.g., 0x...)."),
});

export function UserLookupSection({ onAddressSubmit, isTableLoading }: UserLookupSectionProps) {
  const { toast } = useToast();
  const form = useForm<AddressLookupFormData>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      address: '',
    },
  });

  const onSubmit: SubmitHandler<AddressLookupFormData> = (data) => {
    onAddressSubmit(data.address);
  };

  return (
    <section aria-labelledby="user-lookup-title" className="mb-12">
    
      <Form {...form}>
        {/* Added max-w-xl and mx-auto for centering the form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-3xl mx-auto"
        >
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="flex-grow w-full sm:w-auto">
                <FormLabel htmlFor="address-input" className="sr-only">Wallet Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="address-input"
                      placeholder="Enter your wallet address (e.g., 0x...)"
                      // Changed rounded-md to rounded-full
                      className="pl-10 shadow-sm rounded-full border-border focus:ring-primary"
                      {...field}
                      aria-describedby="address-form-message"
                    />
                  </div>
                </FormControl>
                <FormMessage id="address-form-message" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            // Changed rounded-md to rounded-full
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            disabled={isTableLoading}
          >
            {isTableLoading ? 'Loading...' : 'Search Position'}
          </Button>
        </form>
      </Form>
    </section>
  );
}