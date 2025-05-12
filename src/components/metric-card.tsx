import React, { useRef, useEffect, useState } from 'react'; // Import React hooks
import { useCountUp } from 'react-countup'; // Import the hook
import type { GlobalMetric } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
// Remove direct import: import Countup from 'react-countup';

interface MetricCardProps {
  metric: GlobalMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = metric.icon;
  const countUpRef = useRef<HTMLSpanElement>(null); // Ref for the target span
  const [endValue, setEndValue] = useState<number>(0); // State to hold the parsed numeric value

  // --- Effect 1: Parse and validate metric.value ---
  // This runs when the 'metric' prop changes.
  useEffect(() => {
    let parsedValue = 0; // Default to 0
    if (metric && typeof metric.value !== 'undefined' && metric.value !== null) {
      // Clean the string: remove anything not a digit or decimal point
      const cleanedString = String(metric.value).replace(/[^0-9.]/g, '');
      // Parse the cleaned string
      const numericValue = parseFloat(cleanedString);
      // Use the parsed value only if it's a valid number
      if (!isNaN(numericValue)) {
        parsedValue = numericValue;
      }
    }
    setEndValue(parsedValue);
    // Optional: Log the parsing result
    // console.log(`[MetricCard Effect 1] ID=${metric?.id} Parsed Value: ${parsedValue}`);
  }, [metric]); // Dependency: re-run this effect if the metric object changes

  // --- Initialize useCountUp Hook ---
  const { start, update } = useCountUp({
    ref: countUpRef,          // Link to the ref'd span below
    start: 0,
    end: endValue,            // Use the numeric value from state
    duration: 2,
    separator: ",",
    decimals: 2,              // Adjust if needed based on your data
    decimal: ".",
    startOnMount: false,      // ** Important: Prevent auto-start **
    // enableScrollSpy: false, // ** Disable scroll spy during debugging **
                              // You can re-enable later if needed, but ensure
                              // it works without it first.
  });

  // --- Effect 2: Start/Update the counter ---
  // This runs after the component mounts and whenever 'endValue' changes.
  useEffect(() => {
    // Check if the target span element exists in the DOM
    if (countUpRef.current) {
      // ** Diagnostic: Use setTimeout to delay the start **
      // This helps if there's a very slight timing mismatch
      const timerId = setTimeout(() => {
        // Double-check the ref still exists inside the timeout
        if (countUpRef.current && typeof endValue === 'number' && !isNaN(endValue)) {
          // console.log(`[MetricCard Effect 2 - setTimeout] ID=${metric?.id} Calling start() for value: ${endValue}`);
          start(); // Trigger the animation
          // Alternatively, if the value might change *after* the first start:
          // update(endValue);
        }
      }, 50); // Small delay (e.g., 50ms)

      // Cleanup function to clear the timeout if the component unmounts
      return () => clearTimeout(timerId);

      // ** If setTimeout isn't needed, use direct start: **
      // if (typeof endValue === 'number' && !isNaN(endValue)) {
      //   console.log(`[MetricCard Effect 2] ID=${metric?.id} Ref ready. Starting count to: ${endValue}`);
      //   start();
      // } else {
      //    console.warn(`[MetricCard Effect 2] ID=${metric?.id} Ref ready but endValue invalid: ${endValue}`);
      // }

    } else {
      // Log if the ref isn't attached when this effect runs (shouldn't usually happen)
      // console.warn(`[MetricCard Effect 2] ID=${metric?.id} Ref NOT attached. Skipping start.`);
    }
    // Dependencies: Re-run if the numeric value or the hook's control functions change
  }, [endValue, start, update, metric?.id]);

  // --- Trend Indicator Logic (Unchanged) ---
  let trendIndicator = null;
  let trendColorClass = '';
  if (metric.trend === 'up') {
    trendIndicator = '▲';
    trendColorClass = 'text-success';
  } else if (metric.trend === 'down') {
    trendIndicator = '▼';
    trendColorClass = 'text-destructive';
  }

  // --- Render Logic ---
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <CardTitle className="text-sm font-medium text-muted-foreground cursor-help">
              {metric.label}
            </CardTitle>
          </TooltipTrigger>
          <TooltipContent>
            <p>{metric.tooltipText}</p>
          </TooltipContent>
        </Tooltip>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          {/* Render the target span and attach the ref */}
          <span ref={countUpRef} />
          {/* Optional: You could render '0' or the initial value here briefly
              before the count-up starts if the span appears empty initially */}
        </div>
        {trendIndicator && (
          <p className={cn("text-xs text-muted-foreground mt-1", trendColorClass)}>
            {trendIndicator} Since last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton remains unchanged
export function MetricCardSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
    </Card>
  );
}