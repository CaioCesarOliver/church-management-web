"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReferralSources } from "@/hooks/use-referral-sources";
import { ApiError } from "@/lib/api-client";
import { toggleMemberAttendance, toggleVisitorAttendance } from "@/lib/api/attendance";
import { createMember } from "@/lib/api/members";
import { createVisitor } from "@/lib/api/visitors";

type RegisterKind = "member" | "visitor";

interface QuickRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  /** Whatever is typed in the search box: "procurei, não achei, cadastro". */
  defaultName: string;
  onRegistered: (kind: RegisterKind) => Promise<void> | void;
}

const MIN_NAME_LENGTH = 3;

/** shadcn's Select rejects an empty string, so "não informado" needs a sentinel. */
const REFERRAL_NONE = "__none__";

export function QuickRegisterDialog({
  open,
  onOpenChange,
  meetingId,
  defaultName,
  onRegistered,
}: QuickRegisterDialogProps) {
  const { items: referralSources, loading: loadingSources } = useReferralSources();
  const [kind, setKind] = useState<RegisterKind>("member");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralSourceId, setReferralSourceId] = useState(REFERRAL_NONE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaultName.trim());
    setPhone("");
    setReferralSourceId(REFERRAL_NONE);
    setFieldErrors({});
  }, [open, defaultName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < MIN_NAME_LENGTH) {
      setFieldErrors({ name: "Informe o nome completo (mínimo de 3 caracteres)." });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    const trimmedPhone = phone.trim() || null;

    try {
      let markPresent: () => Promise<unknown>;

      if (kind === "member") {
        const member = await createMember({ name: trimmedName, phone: trimmedPhone });
        markPresent = () => toggleMemberAttendance(meetingId, member.id, true);
      } else {
        const visitor = await createVisitor({
          name: trimmedName,
          phone: trimmedPhone,
          referralSourceId: referralSourceId === REFERRAL_NONE ? null : referralSourceId,
        });
        markPresent = () => toggleVisitorAttendance(meetingId, visitor.id, true);
      }

      // The record already exists at this point, so a failure to mark presence
      // must not read as a failed registration — it is a one-tap fix in the list.
      try {
        await markPresent();
        toast.success(`${trimmedName} cadastrado e marcado como presente.`);
      } catch {
        toast.error(`${trimmedName} foi cadastrado, mas a presença não foi marcada. Marque na lista.`);
      }

      await onRegistered(kind);
      onOpenChange(false);
    } catch (err) {
      const errors = err instanceof ApiError ? err.fieldErrors : {};
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar durante a chamada</DialogTitle>
          <DialogDescription>
            A pessoa é cadastrada e já entra como presente neste culto.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(value) => setKind(value as RegisterKind)}>
          <TabsList className="w-full">
            <TabsTrigger value="member">Membro</TabsTrigger>
            <TabsTrigger value="visitor">Visitante</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="quick-register-name">Nome</Label>
              <Input
                id="quick-register-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome completo"
                autoComplete="off"
                autoFocus
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "quick-register-name-error" : undefined}
              />
              {fieldErrors.name ? (
                <p id="quick-register-name-error" className="text-destructive text-sm">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-register-phone">Telefone (opcional)</Label>
              <Input
                id="quick-register-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(11) 98888-7777"
                inputMode="tel"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "quick-register-phone-error" : undefined}
              />
              {fieldErrors.phone ? (
                <p id="quick-register-phone-error" className="text-destructive text-sm">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>

            <TabsContent value="visitor" className="m-0 space-y-2">
              <Label htmlFor="quick-register-referral">Como conheceu (opcional)</Label>
              {loadingSources ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select value={referralSourceId} onValueChange={setReferralSourceId}>
                  <SelectTrigger
                    id="quick-register-referral"
                    className="w-full"
                    aria-invalid={Boolean(fieldErrors.referralSourceId)}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={REFERRAL_NONE}>Não informado</SelectItem>
                    {referralSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldErrors.referralSourceId ? (
                <p className="text-destructive text-sm">{fieldErrors.referralSourceId}</p>
              ) : null}
            </TabsContent>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Cadastrar e marcar presente
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
