'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface UserOption {
  userAddress: string;
  callValue: number;
  putValue: number;
}

interface UserOptionsTableProps {
  searchedAddress: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  connectedAddress?: string | null;
}

export function UserOptionsTable({
  searchedAddress,
  isLoading: parentIsLoading,
  setIsLoading: setParentIsLoading,
  connectedAddress
}: UserOptionsTableProps) {
  const { toast } = useToast();
  const [optionsDataList, setOptionsDataList] = React.useState<UserOption[]>([]);
  const [localSearch, setLocalSearch] = React.useState('');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [minCallValue, setMinCallValue] = React.useState('');
  const [minPutValue, setMinPutValue] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      setParentIsLoading(true);
      try {
        const res = await fetch('/api/get-user-options');
        const json = await res.json();
        const data = json.data;

        if (Array.isArray(data)) {
          const parsed = data.map((entry) => ({
            userAddress: entry.user_address.toLowerCase(),
            callValue: parseFloat(entry.call_value),
            putValue: parseFloat(entry.put_value),
          }));
          setOptionsDataList(parsed);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast({ title: 'Failed to load user options', variant: 'destructive' });
      } finally {
        setParentIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredOptions = optionsDataList
    .filter(
      (entry) =>
        !connectedAddress || entry.userAddress !== connectedAddress.toLowerCase()
    )
    .filter((entry) => {
      const addressMatch = entry.userAddress.includes(localSearch.toLowerCase());
      const callMatch = minCallValue ? entry.callValue >= parseFloat(minCallValue) : true;
      const putMatch = minPutValue ? entry.putValue >= parseFloat(minPutValue) : true;
      return addressMatch && callMatch && putMatch;
    });

  return (
    <div className="space-y-4 mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Input
          placeholder="Search by address"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full sm:w-[300px]"
        />
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced Search' : 'Advanced Search'}
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="minCall">Min Call Value</Label>
            <Input
              id="minCall"
              type="number"
              value={minCallValue}
              onChange={(e) => setMinCallValue(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="minPut">Min Put Value</Label>
            <Input
              id="minPut"
              type="number"
              value={minPutValue}
              onChange={(e) => setMinPutValue(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Address</th>
              <th className="text-left px-4 py-2">Call Value</th>
              <th className="text-left px-4 py-2">Put Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredOptions.map((entry) => (
              <tr key={entry.userAddress} className="border-t">
                <td className="px-4 py-2 font-mono">{entry.userAddress}</td>
                <td className="px-4 py-2">{entry.callValue}</td>
                <td className="px-4 py-2">{entry.putValue}</td>
              </tr>
            ))}
            {!parentIsLoading && filteredOptions.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-muted-foreground">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
