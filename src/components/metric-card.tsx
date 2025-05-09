import type { GlobalMetric } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  metric: GlobalMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = metric.icon;
  
  let trendIndicator = null;
  let trendColorClass = '';

  if (metric.trend === 'up') {
    trendIndicator = '▲';
    trendColorClass = 'text-success';
  } else if (metric.trend === 'down') {
    trendIndicator = '▼';
    trendColorClass = 'text-destructive';
  }

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
          {metric.value}
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
