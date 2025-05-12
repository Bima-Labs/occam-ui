
"use client";

import * as React from 'react';
import type { GlobalMetric } from '@/lib/types'; // Assuming GlobalMetric might look like: { id: string; label: string; value: string; }
import { MetricCard, MetricCardSkeleton } from '@/components/metric-card';
import { Landmark, CircleDollarSign, Gauge, Users, ShieldCheck, AlertTriangle, XCircle , Bitcoin } from 'lucide-react';
// Define a more specific type for the API response
interface ApiMetric {
  btcAmount: string;
  usbdMinted: string;
  collateralRatio: string;
  users: number;
}

// Helper function to transform API data into GlobalMetric[]
// This will depend on how you want to display these metrics.
// For this example, let's assume each key-value pair from the API
// becomes a separate MetricCard.
const transformApiDataToGlobalMetrics = (data: ApiMetric): GlobalMetric[] => {
  return [
    {
      id: 'btcAmount',
      label: 'BTC Amount', // You might want to make these labels more user-friendly
      value: data.btcAmount,
      icon: Bitcoin,
      tooltipText: ''
    },
    {
      id: 'usbdMinted',
      label: 'USBD Minted',
      value: data.usbdMinted,
      icon: CircleDollarSign,
      tooltipText: ''
    },
    {
      id: 'collateralRatio',
      label: 'Collateral Ratio',
      value: `${parseFloat(data.collateralRatio).toFixed(2)}%`,
      icon: Gauge,
      tooltipText: ''
    },
    {
      id: 'users',
      label: 'Users',
      value: data.users.toString(),
      icon: Users,
      tooltipText: ''
    },
  ];
};


export function GlobalMetricsSection() {
  const [metrics, setMetrics] = React.useState<GlobalMetric[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://api-occam.bima.money/service/stat');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiMetric = await response.json();
        setMetrics(transformApiDataToGlobalMetrics(data));
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
        // Optionally, set metrics to an empty array or some default error state
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // No cleanup needed for fetch in the same way as for setTimeout,
    // but you could add an AbortController if the component might unmount
    // while the fetch is in progress.
  }, []);

  return (
    <section aria-labelledby="global-metrics-title" className="mb-12">
      <h2 id="global-metrics-title" className="text-2xl font-semibold tracking-tight mb-6 text-foreground">
        Protocol Overview
      </h2>
      {error && (
        <div className="mb-4 text-red-600">
          <p>Failed to load metrics: {error}</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))
          : metrics.length > 0
            ? metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))
            : !error && <p>No metrics available.</p> // Display if metrics array is empty and no error
        }
      </div>
    </section>
  );
}

// ------------ NOTES AND ASSUMPTIONS: ------------
// 1. `GlobalMetric` Type:
//    I've assumed your `GlobalMetric` type in `@/lib/types` looks something like this:
//    ```typescript
//    export interface GlobalMetric {
//      id: string;          // Unique identifier for the metric
//      label: string;       // Display name for the metric (e.g., "BTC Locked")
//      value: string;       // The value of the metric (e.g., "25", "938,420")
//      // Optional properties, you might have more depending on MetricCard's needs:
//      // percentageChange?: string; // e.g., "+5.2%"
//      // trend?: 'up' | 'down' | 'neutral';
//      // unit?: string; // e.g., "BTC", "%"
//    }
//    ```
//    You'll need to adjust the `transformApiDataToGlobalMetrics` function
//    if your `GlobalMetric` type is different.

// 2. `MetricCard` Component:
//    The `MetricCard` component (`@/components/metric-card`) is expected to accept
//    a `metric` prop of type `GlobalMetric`.

// 3. `MOCK_GLOBAL_METRICS`:
//    The `MOCK_GLOBAL_METRICS` constant is no longer used for the initial state
//    as we are fetching real data. It might still be useful for testing or as a fallback.

// 4. Error Handling:
//    Basic error handling is added. If the API call fails, an error message
//    will be displayed. You might want to enhance this (e.g., retry mechanism,
//    more user-friendly error messages).

// 5. Loading State:
//    The skeleton loaders will be shown while the data is being fetched.
//    The number of skeletons is currently hardcoded to 4, matching the number
//    of metrics we expect to derive from the API response. If the API could return
//    a variable number of displayable metrics, you might adjust this or have a
//    default number of skeletons.

// 6. API Endpoint:
//    The code uses the provided API endpoint `https://api-occam.bima.money/service/stat`.
//    Ensure this endpoint is accessible from where your client-side code is running
//    (CORS policies on the server might be a concern).

// 7. Data Transformation:
//    The `transformApiDataToGlobalMetrics` function is crucial. It maps the raw API
//    response fields to the `GlobalMetric` objects that your `MetricCard` components expect.
//    I've made some assumptions about how you'd want to label and format these (e.g., adding a '%' to collateralRatio).
//    Customize this function to fit your exact display requirements. For instance, if you want "USBD Minted"
//    to be displayed as "938,420" with a comma, you'd add that formatting logic.

// 8. Styling:
//    Tailwind CSS classes are preserved from your original example.

// To use this:
// - Make sure your `@/lib/types` defines `GlobalMetric` appropriately.
// - Ensure `@/components/metric-card` exports `MetricCard` and `MetricCardSkeleton`.
// - Place this `GlobalMetricsSection` component in your application.