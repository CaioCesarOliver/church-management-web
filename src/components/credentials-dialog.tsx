"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Pares rótulo/valor. O valor é monoespaçado e copiável. */
  fields: Array<{ label: string; value: string }>;
  /** Aviso final — o que fazer com isso, ou por que não aparece de novo. */
  note?: string;
}

/**
 * Comunicação de credencial, em modal.
 *
 * Deliberadamente NÃO é um toast. Um toast some em segundos, some se a pessoa
 * estiver olhando para outro canto da tela, e empilha com outros avisos. Senha
 * inicial é informação que precisa ser lida, copiada e repassada — e que não
 * volta a aparecer. Exige um passo consciente para fechar.
 */
export function CredentialsDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  note,
}: CredentialsDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 2000);
    } catch {
      // Área de transferência bloqueada (sem HTTPS, permissão negada). O valor
      // está na tela e é selecionável — não há nada a avisar.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-full">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="divide-y rounded-lg border">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">{field.label}</p>
                <p className="font-mono text-sm break-all">{field.value}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Copiar ${field.label.toLowerCase()}`}
                onClick={() => void copy(field.label, field.value)}
              >
                {copied === field.label ? (
                  <Check className="text-primary size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        {note ? <p className="text-muted-foreground text-sm text-pretty">{note}</p> : null}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
