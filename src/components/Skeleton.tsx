/** Generic skeleton shimmer for loading states */

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
  mb?: number;
}

export function Skeleton({ height = 20, width = "100%", borderRadius = 6, mb = 8 }: SkeletonProps) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        marginBottom: mb,
        background: "linear-gradient(90deg, #1e293b 25%, #273549 50%, #1e293b 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

export function RunSkeleton() {
  return (
    <div
      style={{
        padding: "12px 16px",
        marginBottom: 8,
        background: "#1e293b",
        borderRadius: 8,
        border: "1px solid #334155",
      }}
    >
      <Skeleton height={16} width="60%" mb={8} />
      <Skeleton height={12} width="30%" mb={0} />
    </div>
  );
}

export function ApprovalSkeleton() {
  return (
    <div
      style={{
        padding: 16,
        marginBottom: 12,
        background: "#1e293b",
        borderRadius: 8,
        border: "1px solid #334155",
      }}
    >
      <Skeleton height={16} width="40%" mb={12} />
      <Skeleton height={8} mb={6} />
      <Skeleton height={8} mb={6} />
      <Skeleton height={8} mb={6} />
      <Skeleton height={8} mb={0} />
    </div>
  );
}
