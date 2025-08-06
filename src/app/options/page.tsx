
// 'use client';

// import * as React from 'react';
// import { useAccount, useSignMessage } from 'wagmi';
// import { Separator } from '@/components/ui/separator';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/components/ui/use-toast';
// import { UserOptionsTable } from '@/components/tables/UserOptionsTable';
// import { useUniSat } from '@/contexts/UniSatContext';

// // Import Dialog components
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';

// interface UserOption {
//   userAddress: string;
//   callValue: number;
//   putValue: number;
// }

// // UPDATE: Added signedMessageContent to the payload interface
// interface UserOptionPayload extends UserOption {
//   signature?: string;
//   signedMessageContent?: string;
// }

// export default function OptionsPage() {
//   const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
//   const { signMessageAsync } = useSignMessage();
//   const { toast } = useToast();
//   const { unisatAddress } = useUniSat();

//   const [allUserOptions, setAllUserOptions] = React.useState<UserOption[]>([]);
//   const [userEntry, setUserEntry] = React.useState<UserOption | null>(null);
//   const [isWhitelisted, setIsWhitelisted] = React.useState(false);
//   const [callValue, setCallValue] = React.useState('');
//   const [putValue, setPutValue] = React.useState('');
//   const [isModalOpen, setIsModalOpen] = React.useState(false);
//   const [isLoading, setIsLoading] = React.useState(false);

//   const connectedAddress = evmAddress || unisatAddress;
//   const isConnected = Boolean(connectedAddress);

//   // Effect to fetch ALL user options once on mount
//   React.useEffect(() => {
//     const fetchAllOptions = async () => {
//       setIsLoading(true);
//       try {
//         const res = await fetch('/api/get-user-options');
//         const json = await res.json();
//         const raw = json.data;

//         if (Array.isArray(raw)) {
//           const parsedData = raw.map((entry: any) => ({
//             userAddress: entry.user_address.toLowerCase(),
//             callValue: parseFloat(entry.call_value),
//             putValue: parseFloat(entry.put_value),
//           }));
//           setAllUserOptions(parsedData);
//         }
//       } catch (err) {
//         console.error('Failed to load all options:', err);
//         toast({ title: 'Failed to load options', variant: 'destructive' });
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchAllOptions();
//   }, []);


//   //write function to check is user whitelisted , return true or false
// const checkWhitelisted = async () => {
//   try {
//     const res = await fetch('/api/get-whitelisted-users');
//     const json = await res.json();
//     console.log('Whitelisted users response:', json);

//     const raw = json.data || []; // ✅ fallback to empty array
//     console.log('Raw whitelisted data:', raw);

//     // Extract lowercase addresses
//     const allWhitelistedUsers: string[] = raw
//       .map((entry: any) => entry.user_address?.toLowerCase())
//       .filter(Boolean); // remove null/undefined

//     console.log('All Whitelisted Users:', allWhitelistedUsers);

//     if (
//       connectedAddress &&
//       allWhitelistedUsers.includes(connectedAddress.toLowerCase())
//     ) {
//       setIsWhitelisted(true);
//     } else {
//       console.log('You are not whitelisted');
//       setIsWhitelisted(false);
//     }
//   } catch (error) {
//     console.error('Error fetching whitelisted users:', error);
//     setIsWhitelisted(false);
//   }
// };



//   // Effect to find/update the current user's entry from allUserOptions
//   React.useEffect(() => {
//     if (connectedAddress && allUserOptions.length > 0) {
//       const lower = connectedAddress.toLowerCase();
//       const match = allUserOptions.find((entry) => entry.userAddress === lower);
//       checkWhitelisted();
//       setUserEntry(match || null);
//       if (match) {
//         setCallValue(match.callValue.toString());
//         setPutValue(match.putValue.toString());
//       } else {
//         setCallValue('');
//         setPutValue('');
//       }
//     } else if (!connectedAddress) {
//       setUserEntry(null);
//       setCallValue('');
//       setPutValue('');
//       setIsModalOpen(false);
//     }
//   }, [connectedAddress, allUserOptions]);

//   // Effect to clear input if wallets disconnect
//   React.useEffect(() => {
//     if (!unisatAddress && !evmAddress) {
//       if (userEntry !== null || callValue !== '' || putValue !== '') {
//         setUserEntry(null);
//         setCallValue('');
//         setPutValue('');
//         setIsModalOpen(false);
//         toast({ title: 'Wallet disconnected', description: 'Your option inputs have been cleared.', variant: 'warning' });
//       }
//     }
//   }, [unisatAddress, evmAddress, userEntry, callValue, putValue, toast]);

//   // UPDATE: The handleSubmit function is updated to send the required payload
//   const handleSubmit = async () => {
//     if (!connectedAddress) return;
//     setIsLoading(true);

//     // 1. Define the exact message to be signed.
//     const messageToSign = `Authorize update of options:\nCall: ${callValue}, Put: ${putValue}`;

//     // 2. Prepare the payload with the message content included.
//     const payload: UserOptionPayload = {
//       userAddress: connectedAddress,
//       callValue: parseFloat(callValue) || 0,
//       putValue: parseFloat(putValue) || 0,
//       signedMessageContent: messageToSign,
//     };

//     try {
//       // 3. Request signature from the user's wallet.
//       let signature;
//       if (isEvmConnected) {
//         signature = await signMessageAsync({ message: messageToSign });
//       } else if (unisatAddress && (window as any).unisat) {
//         signature = await (window as any).unisat.signMessage(messageToSign);
//       } else {
//         toast({ title: 'No connected wallet for signing', variant: 'destructive' });
//         setIsLoading(false);
//         return;
//       }
//       payload.signature = signature;

//       // 4. Send the complete payload to the backend API.
//       const res = await fetch('/api/set-user-options', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       if (res.ok) {
//         toast({ title: 'Saved successfully!', description: 'Your options have been updated.' });
//         setIsModalOpen(false);

//         // Optimistically update UI
//         setAllUserOptions((prevOptions) => {
//           const newEntry = {
//             userAddress: connectedAddress.toLowerCase(),
//             callValue: payload.callValue,
//             putValue: payload.putValue,
//           };
//           const existingIndex = prevOptions.findIndex(
//             (opt) => opt.userAddress === connectedAddress.toLowerCase()
//           );
//           if (existingIndex !== -1) {
//             const updatedOptions = [...prevOptions];
//             updatedOptions[existingIndex] = newEntry;
//             return updatedOptions;
//           } else {
//             return [...prevOptions, newEntry];
//           }
//         });
//       } else {
//         const errorData = await res.json();
//         toast({
//           title: 'Failed to save.',
//           description: errorData.message || 'An unknown error occurred.',
//           variant: 'destructive',
//         });
//       }
//     } catch (err) {
//       console.error('Submit error:', err);
//       toast({ title: 'Signature rejected or failed', description: 'Please try again and approve the signature.', variant: 'destructive' });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const openModalForEdit = () => {
//     if (userEntry) {
//       setCallValue(userEntry.callValue.toString());
//       setPutValue(userEntry.putValue.toString());
//     } else {
//       setCallValue('');
//       setPutValue('');
//     }
//     setIsModalOpen(true);
//   };

//   return (
//     <div className="space-y-8">
//       <h1 className="text-3xl font-bold">Options</h1>
//       <Separator />

//       {isLoading && allUserOptions.length === 0 ? (
//         <div className="text-center py-10">
//           <p>Loading your options data...</p>
//         </div>
//       ) : (
//         <>
//           {userEntry && isWhitelisted  ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="rounded-lg border p-4 shadow-sm bg-muted">
//                 <h2 className="text-sm font-medium text-muted-foreground">Your Call Value</h2>
//                 <p className="text-2xl font-bold">{userEntry.callValue}</p>
//               </div>
//               <div className="rounded-lg border p-4 shadow-sm bg-muted">
//                 <h2 className="text-sm font-medium text-muted-foreground">Your Put Value</h2>
//                 <p className="text-2xl font-bold">{userEntry.putValue}</p>
//               </div>
//             </div>
//           ) : (
//             isConnected && !isLoading && isWhitelisted && (
//               <div className="border p-6 rounded-lg space-y-4 shadow-md text-center">
//                 <h2 className="text-lg font-semibold text-muted-foreground">You haven't set your options yet.</h2>
//                 <p className="text-sm text-muted-foreground">Click the button below to get started!</p>
//                 <Button onClick={openModalForEdit} className="bg-orange-500 text-white">
//                   Enter Your Options
//                 </Button>
//               </div>
//             )
//           )}

//           {userEntry && isWhitelisted && (
//             <Button onClick={openModalForEdit} className="bg-orange-500 text-white">
//               Update Your Options
//             </Button>
//           )}
//         </>
//       )}

//       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//         <DialogContent className="sm:max-w-[425px]">
//           <DialogHeader>
//             <DialogTitle>{userEntry ? 'Update Your Options' : 'Enter Your Options'}</DialogTitle>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="call" className="text-right">
//                 Call Value
//               </Label>
//               <Input
//                 id="call"
//                 type="number"
//                 value={callValue}
//                 onChange={(e) => setCallValue(e.target.value)}
//                 className="col-span-3"
//               />
//             </div>
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="put" className="text-right">
//                 Put Value
//               </Label>
//               <Input
//                 id="put"
//                 type="number"
//                 value={putValue}
//                 onChange={(e) => setPutValue(e.target.value)}
//                 className="col-span-3"
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} className="bg-orange-500 text-white" disabled={isLoading}>
//               {isLoading ? 'Saving...' : 'Save'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <UserOptionsTable
//         optionsDataList={allUserOptions}
//         isLoading={isLoading && allUserOptions.length > 0}
//         connectedAddress={connectedAddress}
//       />
//     </div>
//   );
// }

// Path: (e.g. app/requests/[requestId]/options/page.tsx)
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BtcPriceCard } from '@/components/BtcPriceCard'; // Import the self-contained price card

// Interfaces for user options data
interface UserOption {
  userAddress: string;
  callValue: number;
  putValue: number;
  btcPrice: number;
}

interface UserOptionPayload extends UserOption {
  signature?: string;
  signedMessageContent?: string;
}

export default function OptionsPage() {
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const { unisatAddress } = useUniSat();

  // State for user-specific data
  const [allUserOptions, setAllUserOptions] = React.useState<UserOption[]>([]);
  const [userEntry, setUserEntry] = React.useState<UserOption | null>(null);
  const [isWhitelisted, setIsWhitelisted] = React.useState(false);
  const [callValue, setCallValue] = React.useState('');
  const [putValue, setPutValue] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [btcPrice, setBtcPrice] = React.useState(0.00);

  const connectedAddress = evmAddress || unisatAddress;
  const isConnected = Boolean(connectedAddress);

  // --- OPTIMIZED EFFECTS ---

  // Effect to fetch ALL user options. Runs only ONCE on mount.
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
            btcPrice: parseFloat(entry.btc_price),
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
  }, []); // Empty array ensures this runs only once.

  // Memoized function to check whitelist status. Prevents re-creation on every render.
  const checkWhitelisted = React.useCallback(async () => {
    if (!connectedAddress) {
      setIsWhitelisted(false);
      return;
    }
    try {
      const res = await fetch('/api/get-whitelisted-users');
      const json = await res.json();
      const raw = json.data || [];
      const allWhitelistedUsers: string[] = raw
        .map((entry: any) => entry.user_address?.toLowerCase())
        .filter(Boolean);
      setIsWhitelisted(allWhitelistedUsers.includes(connectedAddress.toLowerCase()));
    } catch (error) {
      console.error('Error fetching whitelisted users:', error);
      setIsWhitelisted(false);
    }
  }, [connectedAddress]); // Re-runs ONLY when connectedAddress changes.

  // Main effect to orchestrate user data. No longer causes infinite loops.
  React.useEffect(() => {
    checkWhitelisted(); // Call the stable function
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
  }, [connectedAddress, allUserOptions, checkWhitelisted]);

  // --- HANDLER FUNCTIONS ---

  const handleSubmit = async () => {
    if (!connectedAddress) return;
    setIsLoading(true);

    const messageToSign = `Authorize update of options:\nCall: ${callValue}, Put: ${putValue}`;
    const payload: UserOptionPayload = {
      userAddress: connectedAddress,
      callValue: parseFloat(callValue) || 0,
      putValue: parseFloat(putValue) || 0,
      btcPrice:btcPrice,
      signedMessageContent: messageToSign,
    };

    try {
      let signature;
      if (isEvmConnected) {
        signature = await signMessageAsync({ message: messageToSign });
      } else if (unisatAddress && (window as any).unisat) {
        signature = await (window as any).unisat.signMessage(messageToSign);
      } else {
        throw new Error('No connected wallet for signing');
      }
      payload.signature = signature;

      const res = await fetch('/api/set-user-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'An unknown error occurred.');
      }

      toast({ title: 'Saved successfully!', description: 'Your options have been updated.' });
      setIsModalOpen(false);

      setAllUserOptions((prevOptions) => {
        const newEntry = {
          userAddress: connectedAddress.toLowerCase(),
          callValue: payload.callValue,
          putValue: payload.putValue,
          btcPrice: payload.btcPrice
        };
        const existingIndex = prevOptions.findIndex((opt) => opt.userAddress === connectedAddress.toLowerCase());
        const updatedOptions = [...prevOptions];
        if (existingIndex !== -1) {
          updatedOptions[existingIndex] = newEntry;
        } else {
          updatedOptions.push(newEntry);
        }
        return updatedOptions;
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
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

      {/* Render the self-contained component. Its updates won't affect this page. */}
      <BtcPriceCard setBtcPrice={setBtcPrice} />

      {/* User's existing options display */}
      {isLoading && allUserOptions.length === 0 ? (
        <div className="text-center py-10"><p>Loading your options data...</p></div>
      ) : (
        <>
          {userEntry && isWhitelisted ? (
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
          ) : isConnected && !isLoading && isWhitelisted && (
            <div className="border p-6 rounded-lg space-y-4 shadow-md text-center">
              <h2 className="text-lg font-semibold text-muted-foreground">You haven't set your options yet.</h2>
              <p className="text-sm text-muted-foreground">Click the button below to get started!</p>
              <Button onClick={openModalForEdit} className="bg-orange-500 text-white">Enter Your Options</Button>
            </div>
          )}
          {userEntry && isWhitelisted && (
            <Button onClick={openModalForEdit} className="bg-orange-500 text-white">Update Your Options</Button>
          )}
        </>
      )}

      {/* Dialog for entering/updating options */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{userEntry ? 'Update Your Options' : 'Enter Your Options'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="call" className="text-right">Call Value</Label>
              <Input id="call" type="number" value={callValue} onChange={(e) => setCallValue(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="put" className="text-right">Put Value</Label>
              <Input id="put" type="number" value={putValue} onChange={(e) => setPutValue(e.target.value)} className="col-span-3"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-orange-500 text-white" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The memoized table of other users' options */}
      <UserOptionsTable
        optionsDataList={allUserOptions}
        isLoading={isLoading && allUserOptions.length > 0}
        connectedAddress={connectedAddress}
      />
    </div>
  );
}