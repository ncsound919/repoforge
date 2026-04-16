export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded ${className}`} style={style} />;
}

export function RunSkeleton() {
  return (
    <div className="card p-4 mb-2">
      <Skeleton className="h-4 w-3/5 mb-2" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}

export function ApprovalSkeleton() {
  return (
    <div className="card p-4 mb-3">
      <Skeleton className="h-4 w-2/5 mb-3" />
      <Skeleton className="h-2 w-full mb-1.5" />
      <Skeleton className="h-2 w-full mb-1.5" />
      <Skeleton className="h-2 w-full mb-1.5" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}
