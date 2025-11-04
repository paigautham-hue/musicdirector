import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max?: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  if (!max) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        {current} characters
      </div>
    );
  }

  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = current > max;

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            isOverLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-primary"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={cn(
        "font-mono",
        isOverLimit ? "text-destructive font-semibold" : isNearLimit ? "text-yellow-600" : "text-muted-foreground"
      )}>
        {current}/{max}
      </span>
    </div>
  );
}
