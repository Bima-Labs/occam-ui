// Path: src/components/BtcPriceCard.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for our price data points
interface PriceDataPoint {
  time: string;
  price: number;
}

export function BtcPriceCard({setBtcPrice}: any) {
  const [priceHistory, setPriceHistory] = React.useState<PriceDataPoint[]>([]);
  const [currentBtcPrice, setCurrentBtcPrice] = React.useState<number>(0);
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(true);

  // Effect 1: Fetch 6 months of historical data ONCE on component mount
  React.useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsHistoryLoading(true);
        // CoinGecko API for 180 days of historical daily data
        const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=180&interval=daily');
        if (!response.ok) throw new Error('Failed to fetch historical BTC data');
        
        const data = await response.json();
        const formattedData = data.prices.map((point: [number, number]) => ({
          time: new Date(point[0]).toLocaleDateString(), // Format timestamp as a readable date
          price: point[1],
        }));
        
        setPriceHistory(formattedData);
        // Set the current price to the latest historical price initially
        if (formattedData.length > 0) {
            setCurrentBtcPrice(formattedData[formattedData.length - 1].price);
           
        }
      } catch (error) {
        console.error("Error fetching historical Bitcoin price:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistoricalData();
  }, []); // Empty dependency array ensures this runs only once

  // Effect 2: Set up an interval to fetch LIVE data every 10 seconds
  React.useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        if (!response.ok) return; // Silently fail if live price is unavailable

        const data = await response.json();
        const livePrice = data.bitcoin.usd;

        setCurrentBtcPrice(livePrice); // Update the big display price
        setBtcPrice(livePrice);
        const newPoint: PriceDataPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: livePrice,
        };

        // Add the new live point to our history, and keep the array from growing infinitely
        setPriceHistory(prevHistory => [...prevHistory, newPoint].slice(-500)); // Keep last 500 points
      } catch (error) {
        // We don't want to bother the user with console errors for a polling call
      }
    };
    
    // Start polling 10 seconds after initial load, to give historical data a chance to load first
    const intervalId = setInterval(fetchLivePrice, 10000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Also runs only once to set up the interval

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Live Bitcoin Price (USD)</CardTitle>
        <CardDescription>Showing 6-month history with live updates every 10 seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-primary mb-4">
          ${currentBtcPrice > 0 ? currentBtcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Loading...'}
        </div>
        <div className="w-full h-60 bg-muted rounded-md flex items-center justify-center">
          {isHistoryLoading ? (
            <p className="text-muted-foreground">Loading historical data...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={Math.floor(priceHistory.length / 7)} />
                <YAxis
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(value) => `$${Number(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}