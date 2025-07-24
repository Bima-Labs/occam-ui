// 'use client';

// import * as React from 'react';
// import { useAccount, useSignMessage } from 'wagmi';
// import { Separator } from '@/components/ui/separator';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/components/ui/use-toast';
// import { UserOptionsTable } from '@/components/tables/UserOptionsTable';
// import { useUniSat } from '@/contexts/UniSatContext'; // ✅ use context

// interface UserOption {
//   userAddress: string;
//   callValue: number;
//   putValue: number;
// }

// interface UserOptionPayload extends UserOption {
//   signature?: string;
// }

// export default function OptionsPage() {
//   const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
//   const { signMessageAsync } = useSignMessage();
//   const { toast } = useToast();
//   const { unisatAddress } = useUniSat(); // ✅ get from context
//   React.useEffect(() => {
//   if (
//     !unisatAddress &&
//     !evmAddress &&
//     (userEntry !== null || callValue !== '' || putValue !== '')
//   ) {
//     setUserEntry(null);
//     setCallValue('');
//     setPutValue('');
//     window.location.reload();
//   }
// }, [unisatAddress, evmAddress]);


//   const [userOptions, setUserOptions] = React.useState<UserOption[]>([]);
//   const [userEntry, setUserEntry] = React.useState<UserOption | null>(null);
//   const [callValue, setCallValue] = React.useState('');
//   const [putValue, setPutValue] = React.useState('');
//   const [isEditing, setIsEditing] = React.useState(false);
//   const [isLoading, setIsLoading] = React.useState(false);

//   const connectedAddress = evmAddress || unisatAddress;
//   const isConnected = Boolean(connectedAddress);

//   React.useEffect(() => {
//     const fetchOptions = async () => {
//       try {
//         const res = await fetch('/api/get-user-options');
//         const json = await res.json();
//         const raw = json.data;

//         if (Array.isArray(raw)) {
//           const data = raw.map((entry) => ({
//             userAddress: entry.user_address.toLowerCase(),
//             callValue: parseFloat(entry.call_value),
//             putValue: parseFloat(entry.put_value),
//           }));

//           setUserOptions(data);

//           if (connectedAddress) {
//             const lower = connectedAddress.toLowerCase();
//             const match = data.find((entry) => entry.userAddress === lower);
//             setUserEntry(match || null);
//             if (match) {
//               setCallValue(match.callValue.toString());
//               setPutValue(match.putValue.toString());
//             }
//           }
//         }
//       } catch (err) {
//         toast({ title: 'Failed to load options', variant: 'destructive' });
//       }
//     };

//     fetchOptions();
//   }, [connectedAddress]);

//   const handleSubmit = async () => {
//   if (!connectedAddress) return;

//   const payload: UserOptionPayload = {
//     userAddress: connectedAddress,
//     callValue: parseFloat(callValue),
//     putValue: parseFloat(putValue),
//   };

//   try {
//     const message = `Authorize update of options:\nCall: ${callValue}, Put: ${putValue}`;

//     if (isEvmConnected && userEntry) {
//       const signature = await signMessageAsync({ message });
//       payload.signature = signature;
//     } else if (unisatAddress && userEntry) {
//       const signature = await (window as any).unisat.signMessage(message); // ✅ string-based signing
//       payload.signature = signature;
//     }

//     const res = await fetch('/api/set-user-options', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });

//     if (res.status === 201) {
//       toast({ title: 'Saved successfully!' });
//       setIsEditing(false);
//       window.location.reload();
//     } else {
//       toast({ title: 'Failed to save.', variant: 'destructive' });
//     }
//   } catch (err) {
//     toast({ title: 'Signature rejected or failed', variant: 'destructive' });
//   }
// };


//   return (
//     <div className="space-y-8">
//       <h1 className="text-3xl font-bold">Options</h1>
//       <Separator />

//       {userEntry && !isEditing && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="rounded-lg border p-4 shadow-sm bg-muted">
//             <h2 className="text-sm font-medium text-muted-foreground">Your Call Value</h2>
//             <p className="text-2xl font-bold">{userEntry.callValue}</p>
//           </div>
//           <div className="rounded-lg border p-4 shadow-sm bg-muted">
//             <h2 className="text-sm font-medium text-muted-foreground">Your Put Value</h2>
//             <p className="text-2xl font-bold">{userEntry.putValue}</p>
//           </div>
//         </div>
//       )}

//       {userEntry && !isEditing && (
//         <Button onClick={() => setIsEditing(true)} className="bg-orange-500 text-white">
//           Update Your Options
//         </Button>
//       )}

//       {isEditing && (
//         <div className="border p-6 rounded-lg space-y-4 shadow-md">
//           <div className="grid grid-cols-1 md:grid-row-2 gap-4">
//             <div>
//               <Label htmlFor="call">Call Value</Label>
//               <Input
//                 id="call"
//                 type="number"
//                 value={callValue}
//                 onChange={(e) => setCallValue(e.target.value)}
//               />
//             </div>
//             <div>
//               <Label htmlFor="put">Put Value</Label>
//               <Input
//                 id="put"
//                 type="number"
//                 value={putValue}
//                 onChange={(e) => setPutValue(e.target.value)}
//               />
//             </div>
//           </div>
//           <div className="flex gap-4">
//             <Button onClick={handleSubmit} className="bg-orange-500 text-white">
//               Save
//             </Button>
//             <Button variant="outline" onClick={() => setIsEditing(false)}>
//               Cancel
//             </Button>
//           </div>
//         </div>
//       )}

//       {!userEntry && isConnected && (
//         <div className="border p-6 rounded-lg space-y-4 shadow-md">
//           <h2 className="text-lg font-semibold">Enter Your Options</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="call">Call Value</Label>
//               <Input
//                 id="call"
//                 type="number"
//                 value={callValue}
//                 onChange={(e) => setCallValue(e.target.value)}
//               />
//             </div>
//             <div>
//               <Label htmlFor="put">Put Value</Label>
//               <Input
//                 id="put"
//                 type="number"
//                 value={putValue}
//                 onChange={(e) => setPutValue(e.target.value)}
//               />
//             </div>
//           </div>
//           <Button onClick={handleSubmit} className="bg-orange-500 text-white">
//             Submit
//           </Button>
//         </div>
//       )}

//       <UserOptionsTable
//         searchedAddress={null}
//         isLoading={isLoading}
//         setIsLoading={setIsLoading}
//         connectedAddress={connectedAddress}
//       />
//     </div>
//   );
// }
'use client';

import * as React from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserOptionsTable } from '@/components/tables/UserOptionsTable';
import { useUniSat } from '@/contexts/UniSatContext';

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface UserOption {
  userAddress: string;
  callValue: number;
  putValue: number;
}

// UPDATE: Added signedMessageContent to the payload interface
interface UserOptionPayload extends UserOption {
  signature?: string;
  signedMessageContent?: string;
}

export default function OptionsPage() {
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const { unisatAddress } = useUniSat();

  const [allUserOptions, setAllUserOptions] = React.useState<UserOption[]>([]);
  const [userEntry, setUserEntry] = React.useState<UserOption | null>(null);
  const [callValue, setCallValue] = React.useState('');
  const [putValue, setPutValue] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const connectedAddress = evmAddress || unisatAddress;
  const isConnected = Boolean(connectedAddress);

  // Effect to fetch ALL user options once on mount
  React.useEffect(() => {
    const fetchAllOptions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/get-user-options');
        const json = await res.json();
        const raw = json.data;

        if (Array.isArray(raw)) {
          const parsedData = raw.map((entry: any) => ({
            userAddress: entry.user_address.toLowerCase(),
            callValue: parseFloat(entry.call_value),
            putValue: parseFloat(entry.put_value),
          }));
          setAllUserOptions(parsedData);
        }
      } catch (err) {
        console.error('Failed to load all options:', err);
        toast({ title: 'Failed to load options', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllOptions();
  }, []);

  // Effect to find/update the current user's entry from allUserOptions
  React.useEffect(() => {
    if (connectedAddress && allUserOptions.length > 0) {
      const lower = connectedAddress.toLowerCase();
      const match = allUserOptions.find((entry) => entry.userAddress === lower);
      setUserEntry(match || null);
      if (match) {
        setCallValue(match.callValue.toString());
        setPutValue(match.putValue.toString());
      } else {
        setCallValue('');
        setPutValue('');
      }
    } else if (!connectedAddress) {
      setUserEntry(null);
      setCallValue('');
      setPutValue('');
      setIsModalOpen(false);
    }
  }, [connectedAddress, allUserOptions]);

  // Effect to clear input if wallets disconnect
  React.useEffect(() => {
    if (!unisatAddress && !evmAddress) {
      if (userEntry !== null || callValue !== '' || putValue !== '') {
        setUserEntry(null);
        setCallValue('');
        setPutValue('');
        setIsModalOpen(false);
        toast({ title: 'Wallet disconnected', description: 'Your option inputs have been cleared.', variant: 'warning' });
      }
    }
  }, [unisatAddress, evmAddress, userEntry, callValue, putValue, toast]);

  // UPDATE: The handleSubmit function is updated to send the required payload
  const handleSubmit = async () => {
    if (!connectedAddress) return;
    setIsLoading(true);

    // 1. Define the exact message to be signed.
    const messageToSign = `Authorize update of options:\nCall: ${callValue}, Put: ${putValue}`;

    // 2. Prepare the payload with the message content included.
    const payload: UserOptionPayload = {
      userAddress: connectedAddress,
      callValue: parseFloat(callValue) || 0,
      putValue: parseFloat(putValue) || 0,
      signedMessageContent: messageToSign,
    };

    try {
      // 3. Request signature from the user's wallet.
      let signature;
      if (isEvmConnected) {
        signature = await signMessageAsync({ message: messageToSign });
      } else if (unisatAddress && (window as any).unisat) {
        signature = await (window as any).unisat.signMessage(messageToSign);
      } else {
        toast({ title: 'No connected wallet for signing', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      payload.signature = signature;

      // 4. Send the complete payload to the backend API.
      const res = await fetch('/api/set-user-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: 'Saved successfully!', description: 'Your options have been updated.' });
        setIsModalOpen(false);

        // Optimistically update UI
        setAllUserOptions((prevOptions) => {
          const newEntry = {
            userAddress: connectedAddress.toLowerCase(),
            callValue: payload.callValue,
            putValue: payload.putValue,
          };
          const existingIndex = prevOptions.findIndex(
            (opt) => opt.userAddress === connectedAddress.toLowerCase()
          );
          if (existingIndex !== -1) {
            const updatedOptions = [...prevOptions];
            updatedOptions[existingIndex] = newEntry;
            return updatedOptions;
          } else {
            return [...prevOptions, newEntry];
          }
        });
      } else {
        const errorData = await res.json();
        toast({
          title: 'Failed to save.',
          description: errorData.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast({ title: 'Signature rejected or failed', description: 'Please try again and approve the signature.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openModalForEdit = () => {
    if (userEntry) {
      setCallValue(userEntry.callValue.toString());
      setPutValue(userEntry.putValue.toString());
    } else {
      setCallValue('');
      setPutValue('');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Options</h1>
      <Separator />

      {isLoading && allUserOptions.length === 0 ? (
        <div className="text-center py-10">
          <p>Loading your options data...</p>
        </div>
      ) : (
        <>
          {userEntry ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border p-4 shadow-sm bg-muted">
                <h2 className="text-sm font-medium text-muted-foreground">Your Call Value</h2>
                <p className="text-2xl font-bold">{userEntry.callValue}</p>
              </div>
              <div className="rounded-lg border p-4 shadow-sm bg-muted">
                <h2 className="text-sm font-medium text-muted-foreground">Your Put Value</h2>
                <p className="text-2xl font-bold">{userEntry.putValue}</p>
              </div>
            </div>
          ) : (
            isConnected && !isLoading && (
              <div className="border p-6 rounded-lg space-y-4 shadow-md text-center">
                <h2 className="text-lg font-semibold text-muted-foreground">You haven't set your options yet.</h2>
                <p className="text-sm text-muted-foreground">Click the button below to get started!</p>
                <Button onClick={openModalForEdit} className="bg-orange-500 text-white">
                  Enter Your Options
                </Button>
              </div>
            )
          )}

          {userEntry && (
            <Button onClick={openModalForEdit} className="bg-orange-500 text-white">
              Update Your Options
            </Button>
          )}
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{userEntry ? 'Update Your Options' : 'Enter Your Options'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="call" className="text-right">
                Call Value
              </Label>
              <Input
                id="call"
                type="number"
                value={callValue}
                onChange={(e) => setCallValue(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="put" className="text-right">
                Put Value
              </Label>
              <Input
                id="put"
                type="number"
                value={putValue}
                onChange={(e) => setPutValue(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-orange-500 text-white" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserOptionsTable
        optionsDataList={allUserOptions}
        isLoading={isLoading && allUserOptions.length > 0}
        connectedAddress={connectedAddress}
      />
    </div>
  );
}