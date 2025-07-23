'use client';

import * as React from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserOptionsTable } from '@/components/tables/UserOptionsTable';
import { useUniSat } from '@/contexts/UniSatContext'; // ✅ use context

interface UserOption {
  userAddress: string;
  callValue: number;
  putValue: number;
}

interface UserOptionPayload extends UserOption {
  signature?: string;
}

export default function OptionsPage() {
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const { unisatAddress } = useUniSat(); // ✅ get from context
  React.useEffect(() => {
  if (
    !unisatAddress &&
    !evmAddress &&
    (userEntry !== null || callValue !== '' || putValue !== '')
  ) {
    setUserEntry(null);
    setCallValue('');
    setPutValue('');
    window.location.reload();
  }
}, [unisatAddress, evmAddress]);


  const [userOptions, setUserOptions] = React.useState<UserOption[]>([]);
  const [userEntry, setUserEntry] = React.useState<UserOption | null>(null);
  const [callValue, setCallValue] = React.useState('');
  const [putValue, setPutValue] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const connectedAddress = evmAddress || unisatAddress;
  const isConnected = Boolean(connectedAddress);

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/get-user-options');
        const json = await res.json();
        const raw = json.data;

        if (Array.isArray(raw)) {
          const data = raw.map((entry) => ({
            userAddress: entry.user_address.toLowerCase(),
            callValue: parseFloat(entry.call_value),
            putValue: parseFloat(entry.put_value),
          }));

          setUserOptions(data);

          if (connectedAddress) {
            const lower = connectedAddress.toLowerCase();
            const match = data.find((entry) => entry.userAddress === lower);
            setUserEntry(match || null);
            if (match) {
              setCallValue(match.callValue.toString());
              setPutValue(match.putValue.toString());
            }
          }
        }
      } catch (err) {
        toast({ title: 'Failed to load options', variant: 'destructive' });
      }
    };

    fetchOptions();
  }, [connectedAddress]);

  const handleSubmit = async () => {
  if (!connectedAddress) return;

  const payload: UserOptionPayload = {
    userAddress: connectedAddress,
    callValue: parseFloat(callValue),
    putValue: parseFloat(putValue),
  };

  try {
    const message = `Authorize update of options:\nCall: ${callValue}, Put: ${putValue}`;

    if (isEvmConnected && userEntry) {
      const signature = await signMessageAsync({ message });
      payload.signature = signature;
    } else if (unisatAddress && userEntry) {
      const signature = await (window as any).unisat.signMessage(message); // ✅ string-based signing
      payload.signature = signature;
    }

    const res = await fetch('/api/set-user-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 201) {
      toast({ title: 'Saved successfully!' });
      setIsEditing(false);
      window.location.reload();
    } else {
      toast({ title: 'Failed to save.', variant: 'destructive' });
    }
  } catch (err) {
    toast({ title: 'Signature rejected or failed', variant: 'destructive' });
  }
};


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Options</h1>
      <Separator />

      {userEntry && !isEditing && (
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
      )}

      {userEntry && !isEditing && (
        <Button onClick={() => setIsEditing(true)} className="bg-orange-500 text-white">
          Update Your Options
        </Button>
      )}

      {isEditing && (
        <div className="border p-6 rounded-lg space-y-4 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="call">Call Value</Label>
              <Input
                id="call"
                type="number"
                value={callValue}
                onChange={(e) => setCallValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="put">Put Value</Label>
              <Input
                id="put"
                type="number"
                value={putValue}
                onChange={(e) => setPutValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSubmit} className="bg-orange-500 text-white">
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!userEntry && isConnected && (
        <div className="border p-6 rounded-lg space-y-4 shadow-md">
          <h2 className="text-lg font-semibold">Enter Your Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="call">Call Value</Label>
              <Input
                id="call"
                type="number"
                value={callValue}
                onChange={(e) => setCallValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="put">Put Value</Label>
              <Input
                id="put"
                type="number"
                value={putValue}
                onChange={(e) => setPutValue(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSubmit} className="bg-orange-500 text-white">
            Submit
          </Button>
        </div>
      )}

      <UserOptionsTable
        searchedAddress={null}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        connectedAddress={connectedAddress}
      />
    </div>
  );
}
