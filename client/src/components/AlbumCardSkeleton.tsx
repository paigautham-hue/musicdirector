import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function AlbumCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50">
      <div className="relative">
        {/* Cover Image Skeleton */}
        <Skeleton className="w-full aspect-square" />
        
        {/* Music Ready Badge Skeleton */}
        <div className="absolute bottom-3 right-3">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Description Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        
        {/* Platform and Score Skeleton */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Footer (Creator and Date) Skeleton */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AlbumCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  );
}
