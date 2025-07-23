'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Modal({
  title,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-full max-w-lg bg-white dark:bg-background p-6 rounded-lg shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <div>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
