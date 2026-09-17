import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the counter + search + rows, so nothing jumps when the sheet lands. */
export function AttendanceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Carregando a chamada…</span>

      <Card className="py-4">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <Skeleton className="h-9 w-full sm:w-36" />
      </div>

      <Skeleton className="h-9 w-56" />

      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2.5">
            <Skeleton className="size-6 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
