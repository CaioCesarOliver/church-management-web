"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  CongregationFormFields,
  validateCongregationValues,
  type CongregationFormValues,
} from "@/components/settings/congregation-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { createCongregation } from "@/lib/api/settings";
import type { Congregation } from "@/types/api";

interface CreateCongregationStepProps {
  onCreated: (congregation: Congregation) => void;
}

/** Step 1 of the first-run wizard: nothing else can exist before this. */
export function CreateCongregationStep({ onCreated }: CreateCongregationStepProps) {
  const [values, setValues] = useState<CongregationFormValues>({ name: "", slug: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateCongregationValues(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const congregation = await createCongregation({
        name: values.name.trim(),
        slug: values.slug.trim(),
      });
      toast.success("Congregação criada.");
      onCreated(congregation);
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        // A taken slug comes back as a 409 with no per-field detail.
        setErrors(
          error.status === 409 && Object.keys(fieldErrors).length === 0
            ? { slug: error.message }
            : fieldErrors,
        );
        toast.error(error.message);
      } else {
        toast.error("Não foi possível criar a congregação.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar a congregação</CardTitle>
        <CardDescription>
          Comece pela congregação principal. Você poderá cadastrar outras depois, em Configurações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <CongregationFormFields
            idPrefix="setup-congregation"
            values={values}
            onChange={setValues}
            errors={errors}
            disabled={saving}
            autoFocus
          />

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Criar e continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
