"use client";

import { useState } from "react";

import { AbsenceAlertsTab } from "@/components/metrics/absence-alerts-tab";
import { AttendanceOverTimeTab } from "@/components/metrics/attendance-over-time-tab";
import { AttendanceRankingTab } from "@/components/metrics/attendance-ranking-tab";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type MetricsTab = "attendance" | "ranking" | "alerts";

const TABS: { value: MetricsTab; label: string }[] = [
  { value: "attendance", label: "Assiduidade" },
  { value: "ranking", label: "Ranking" },
  { value: "alerts", label: "Alertas de ausência" },
];

export default function MetricsPage() {
  const [tab, setTab] = useState<MetricsTab>("attendance");
  // Each tab fetches its own data on first activation; `forceMount` then keeps it
  // alive so switching back does not re-request what is already on screen.
  const [activated, setActivated] = useState<MetricsTab[]>(["attendance"]);

  function handleTabChange(value: string) {
    const next = value as MetricsTab;
    setTab(next);
    setActivated((current) => (current.includes(next) ? current : [...current, next]));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Métricas"
        description="Assiduidade, frequência e alertas de ausência"
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList>
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            forceMount
            className={cn("mt-2", tab !== item.value && "hidden")}
          >
            {activated.includes(item.value) ? (
              item.value === "attendance" ? (
                <AttendanceOverTimeTab />
              ) : item.value === "ranking" ? (
                <AttendanceRankingTab />
              ) : (
                <AbsenceAlertsTab />
              )
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
