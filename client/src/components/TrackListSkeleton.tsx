import { Skeleton } from "@/components/ui/skeleton";

export function TrackSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border/50 p-6 space-y-4">
      {/* Track Number and Title */}
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
      
      {/* Rating Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-5 h-5" />
          ))}
        </div>
      </div>
      
      {/* Audio Player Controls Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Progress Bar */}
        <Skeleton className="h-2 w-full rounded-full" />
        
        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        
        {/* Additional Controls */}
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function TrackListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <TrackSkeleton key={i} />
      ))}
    </div>
  );
}
