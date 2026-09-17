import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CongregationTabSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Carregando os dados da congregação…</span>

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="gap-2 py-4">
            <CardHeader className="gap-1 px-4">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="px-4">
              <Skeleton className="h-7 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>

      <Skeleton className="h-4 w-full max-w-xl" />

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}

/** Mirrors a vocabulary table (tipos de culto / origens de visitante). */
export function DomainTabSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Carregando a lista…</span>
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-3">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="ml-auto hidden h-4 w-16 sm:block" />
            <Skeleton className="hidden h-5 w-16 md:block" />
            <Skeleton className="size-8 shrink-0" />
            <Skeleton className="size-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
