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
import { BtcPriceCard } from '@/components/BtcPriceCard';

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

  const [allUserOptions, setAllUserOptions] = React.useState<UserOption[]>([]);
  const [userEntry, setUserEntry] = React.useState<UserOption | null>(null);
  const [isWhitelisted, setIsWhitelisted] = React.useState(false);
  const [callValue, setCallValue] = React.useState('');
  const [putValue, setPutValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [btcPrice, setBtcPrice] = React.useState(0.00);

  const connectedAddress = evmAddress || unisatAddress;
  const isConnected = Boolean(connectedAddress);

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
  }, []);

  // Memoized function to check whitelist status.
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
  }, [connectedAddress]);

  // Main effect to orchestrate user data and update inputs
  React.useEffect(() => {
    checkWhitelisted();
    if (connectedAddress) {
      const lower = connectedAddress.toLowerCase();
      const match = allUserOptions.find((entry) => entry.userAddress === lower);
      setUserEntry(match || null);
      // Pre-fill inputs with existing values or clear if no match
      if (match) {
        setCallValue(match.callValue.toString());
        setPutValue(match.putValue.toString());
      } else {
        setCallValue('');
        setPutValue('');
      }
    } else {
      // Clear inputs and user entry if no wallet connected
      setUserEntry(null);
      setCallValue('');
      setPutValue('');
    }
  }, [connectedAddress, allUserOptions, checkWhitelisted, isConnected]);

  // --- HANDLER FUNCTIONS ---

  const handleSubmit = async () => {
    if (!connectedAddress) {
      toast({ title: 'Wallet not connected', description: 'Please connect your wallet to submit options.', variant: 'destructive' });
      return;
    }

    const parsedCallValue = parseFloat(callValue);
    const parsedPutValue = parseFloat(putValue);

    if (isNaN(parsedCallValue) || isNaN(parsedPutValue) || parsedCallValue < 0 || parsedPutValue < 0) {
      toast({ title: 'Invalid Input', description: 'Please enter valid positive numbers for Call and Put values.', variant: 'destructive' });
      return;
    }

    // BTC Price Range Validation for Put Value
    if (btcPrice > 0) {
      const minPutValue = btcPrice * 0.6; // 40% less
      const maxPutValue = btcPrice * 1.4; // 40% more

      if (parsedPutValue < minPutValue || parsedPutValue > maxPutValue) {
        toast({
          title: 'Put Value Out of Range',
          description: `Put value must be between ${minPutValue.toFixed(2)} and ${maxPutValue.toFixed(2)} (40% less to 40% more than current BTC price).`,
          variant: 'destructive',
        });
        return;
      }
    } else {
      toast({ title: 'BTC Price Not Available', description: 'Cannot validate put value, BTC price not loaded. Please try again.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const messageToSign = `Authorize update of options:\nCall: ${parsedCallValue}, Put: ${parsedPutValue}`;
    const payload: UserOptionPayload = {
      userAddress: connectedAddress,
      callValue: parsedCallValue,
      putValue: parsedPutValue,
      btcPrice: btcPrice,
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

      // Update allUserOptions and userEntry locally to reflect changes immediately
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
      setUserEntry(payload); // Ensure userEntry state is updated to reflect the new values

    } catch (err: any) {
      console.error('Submit error:', err);
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate price suggestions based on current BTC price
  const calculatePriceSuggestions = (basePrice: number) => {
    if (basePrice <= 0) return { call: [], put: [] };

    const percentages = [0.05, 0.10, 0.20, 0.30, 0.40]; // 5%, 10%, 20%, 30%, 40% options

    // Call suggestions (negative percentages - i.e., strike price below current BTC price)
    const callSuggestions = percentages.map(p => ({
      percentage: p,
      value: basePrice * (1 - p),
      label: `-${(p * 100).toFixed(0)}% (${(basePrice * (1 - p)).toFixed(2)})`
    })).sort((a, b) => b.percentage - a.percentage); // Sort descending percentage for call

    // Put suggestions (positive percentages - i.e., strike price above current BTC price)
    const putSuggestions = percentages.map(p => ({
      percentage: p,
      value: basePrice * (1 + p),
      label: `+${(p * 100).toFixed(0)}% (${(basePrice * (1 + p)).toFixed(2)})`
    })).sort((a, b) => a.percentage - b.percentage); // Sort ascending percentage for put

    return { call: callSuggestions, put: putSuggestions };
  };

  // Memoize price suggestions to prevent unnecessary recalculations
  const priceSuggestions = React.useMemo(() => calculatePriceSuggestions(btcPrice), [btcPrice]);

  // Renders the input fields and suggestion buttons
  const renderOptionInputs = () => {
    // Define the range for the Call value note (e.g., 10% below to 50% below current BTC price)
    const minCallValueNote = btcPrice * 0.5; // 50% less
    const maxCallValueNote = btcPrice * 0.9; // 10% less

    return (
      <div className="border p-6 rounded-lg space-y-6 shadow-md bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">{userEntry ? 'Update Your Options' : 'Enter Your Options'}</h2>
        <div className="grid gap-6">
          {/* Call Value Input */}
          <div className="space-y-2">
            <Label htmlFor="call">Call Value</Label>
            <Input
              id="call"
              type="number"
              value={callValue}
              onChange={(e) => setCallValue(e.target.value)}
              placeholder="Enter your call value"
              className="w-full"
              disabled={isLoading || !isConnected || !isWhitelisted}
            />
            {btcPrice > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mt-2">
                  {priceSuggestions.call.map((s) => (
                    <Button
                      key={`call-${s.percentage}`}
                      variant="outline"
                      size="sm"
                      onClick={() => setCallValue(s.value.toFixed(2))}
                      className="hover:bg-blue-100 hover:text-blue-800 border-blue-300 text-blue-700"
                      disabled={isLoading}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Call value must be between{' '}
                  <span className="font-semibold text-blue-600">{minCallValueNote.toFixed(2)}</span> (-50%) and{' '}
                  <span className="font-semibold text-blue-600">{maxCallValueNote.toFixed(2)}</span> (-10%).
                </p>
              </>
            )}
          </div>

          {/* Put Value Input */}
          <div className="space-y-2">
            <Label htmlFor="put">Put Value</Label>
            <Input
              id="put"
              type="number"
              value={putValue}
              onChange={(e) => setPutValue(e.target.value)}
              placeholder="Enter your put value"
              className="w-full"
              disabled={isLoading || !isConnected || !isWhitelisted}
            />
            {btcPrice > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mt-2">
                  {priceSuggestions.put.map((s) => (
                    <Button
                      key={`put-${s.percentage}`}
                      variant="outline"
                      size="sm"
                      onClick={() => setPutValue(s.value.toFixed(2))}
                      className="hover:bg-green-100 hover:text-green-800 border-green-300 text-green-700"
                      disabled={isLoading}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Put value must be between{' '}
                  <span className="font-semibold text-blue-600">{(btcPrice * 0.6).toFixed(2)}</span> (-40%) and{' '}
                  <span className="font-semibold text-blue-600">{(btcPrice * 1.4).toFixed(2)}</span> (+40%).
                </p>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          className="w-full bg-orange-500 text-white hover:bg-orange-600"
          disabled={isLoading || !isConnected || !isWhitelisted || btcPrice === 0}
        >
          {isLoading ? 'Saving...' : 'Save Your Options'}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Options</h1>
      <Separator />

      {/* New wrapper div to limit content width and center it */}
      <div className="max-w-4xl mx-auto space-y-8"> {/* Adjusted max-width to 4xl for approx 75% on larger screens */}
        <BtcPriceCard setBtcPrice={setBtcPrice} />

        {/* Conditional rendering for loading state and inputs */}
        {isLoading && allUserOptions.length === 0 && !userEntry ? (
          <div className="text-center py-10"><p>Loading your options data...</p></div>
        ) : (
          <>
            {isConnected && isWhitelisted ? (
              <>
                {userEntry && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="rounded-lg border p-4 shadow-sm bg-muted">
                      <h2 className="text-sm font-medium text-muted-foreground">Your Call Value</h2>
                      <p className="text-2xl font-bold">{userEntry.callValue}</p>
                    </div>
                    <div className="rounded-lg border p-4 shadow-sm bg-muted">
                      <h2 className="text-sm font-medium text-muted-foreground">Your Put Value</h2>
                      <p className="text-2xl font-bold">{userEntry.putValue}</p>
                    </div>
                  </div>
                )}
                {renderOptionInputs()}
              </>
            ) : (
              <div className="border p-6 rounded-lg space-y-4 shadow-md text-center">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  {!isConnected ? 'Please connect your wallet to view and set options.' : 'You are not whitelisted to set options.'}
                </h2>
              </div>
            )}
          </>
        )}

        <UserOptionsTable
          optionsDataList={allUserOptions}
          isLoading={isLoading && allUserOptions.length > 0}
          connectedAddress={connectedAddress}
        />
      </div> {/* End of max-width wrapper */}
    </div>
  );
}