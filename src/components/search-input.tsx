"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/** Debounce with `useDebouncedValue` on the consumer side before querying. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  autoFocus,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // `type="search"` is kept for semantics and for Escape-to-clear, but
        // WebKit draws its own clear button on top of ours. Hiding the native
        // one leaves a single X that matches the rest of the UI.
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:appearance-none"
        aria-label={placeholder}
      />
      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
