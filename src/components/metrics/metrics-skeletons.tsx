import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Each skeleton mirrors the real tab layout so nothing jumps when data lands. */

export function ChartTabSkeleton() {
  return (
    <Card aria-busy="true">
      <span className="sr-only">Carregando o gráfico de assiduidade…</span>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-[320px] w-full" />
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertsTabSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <span className="sr-only">Carregando os alertas de ausência…</span>
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-8 w-full sm:w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
