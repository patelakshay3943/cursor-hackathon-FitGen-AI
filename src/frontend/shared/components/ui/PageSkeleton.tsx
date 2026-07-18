export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 fit-fade-in" aria-hidden>
      <div className="fit-skeleton h-8 w-2/3 rounded-xl" />
      <div className="fit-skeleton h-4 w-1/2 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="fit-skeleton h-24 rounded-2xl" />
      ))}
    </div>
  );
}
