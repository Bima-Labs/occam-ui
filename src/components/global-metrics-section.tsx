"use client";

import * as React from 'react';
import type { GlobalMetric } from '@/lib/types';
import { MOCK_GLOBAL_METRICS } from '@/lib/constants';
import { MetricCard, MetricCardSkeleton } from '@/components/metric-card';

export function GlobalMetricsSection() {
  const [metrics, setMetrics] = React.useState<GlobalMetric[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setMetrics(MOCK_GLOBAL_METRICS);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section aria-labelledby="global-metrics-title" className="mb-12">
      <h2 id="global-metrics-title" className="text-2xl font-semibold tracking-tight mb-6 text-foreground">
        Protocol Overview
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))
          : metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
      </div>
    </section>
  );
}
