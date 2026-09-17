import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const SETUP_STEPS = ["Congregação", "Acessos", "Concluir"] as const;

export type SetupStep = 1 | 2 | 3;

interface SetupStepsProps {
  current: SetupStep;
}

/** The "you are here" strip above the wizard. Purely informative — not clickable. */
export function SetupSteps({ current }: SetupStepsProps) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {SETUP_STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;

        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "truncate text-center text-xs sm:text-left sm:text-sm",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span className="sr-only">{`Etapa ${step} de ${SETUP_STEPS.length}: `}</span>
                {label}
              </span>
            </div>
            {step < SETUP_STEPS.length ? (
              <span
                aria-hidden="true"
                className={cn("h-px min-w-3 flex-1", done ? "bg-primary" : "bg-border")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
