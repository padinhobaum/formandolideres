import { Skeleton } from "@/components/ui/skeleton";

export default function ProposalSkeletons() {
  return (
    <div className="space-y-4 animate-fade-in">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-2xl border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
