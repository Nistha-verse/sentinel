import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A single animated skeleton block. Combine for complex loading states. */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={style}
    />
  );
}

/** A skeleton card placeholder with a configurable number of lines. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: `${75 - i * 12}%` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/** Full-row table skeleton  */
export function SkeletonTableRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3 py-3">
              <Skeleton
                className="h-4"
                style={{ width: `${50 + ((r * cols + c) * 17) % 40}%` } as React.CSSProperties}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
