"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The name/slug pair is asked for in two places — the first-run wizard and the
 * "Nova congregação" dialog in Configurações. They share this component so the
 * validation rules and the slug derivation cannot drift apart.
 */

export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export interface CongregationFormValues {
  name: string;
  slug: string;
}

/** "Assembleia Jardim São Paulo" -> "assembleia-jardim-sao-paulo". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    // Strip the combining accents NFD just split off.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Field-keyed pt-BR messages, matching what the API would reject. */
export function validateCongregationValues(
  values: CongregationFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  const slug = values.slug.trim();

  if (name.length < 2) {
    errors.name = "Informe ao menos 2 caracteres.";
  }
  if (slug.length < 2) {
    errors.slug = "Informe ao menos 2 caracteres.";
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = "Use apenas letras minúsculas, números e hífens.";
  }

  return errors;
}

interface CongregationFormFieldsProps {
  /** Keeps the input ids unique when two of these render on the same screen. */
  idPrefix: string;
  values: CongregationFormValues;
  onChange: (values: CongregationFormValues) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  autoFocus?: boolean;
  /**
   * Derive the slug from the name while the user types. Off when editing an
   * existing congregation: its slug is already in use and must not move on its
   * own, since it is part of the addresses people have.
   */
  deriveSlug?: boolean;
}

export function CongregationFormFields({
  idPrefix,
  values,
  onChange,
  errors = {},
  disabled = false,
  autoFocus = false,
  deriveSlug = true,
}: CongregationFormFieldsProps) {
  // Once the slug has been typed into by hand, the name stops driving it —
  // otherwise the next keystroke in "Nome" would silently undo the edit.
  const [slugTouched, setSlugTouched] = useState(false);

  const nameId = `${idPrefix}-name`;
  const slugId = `${idPrefix}-slug`;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={nameId}>Nome</Label>
        <Input
          id={nameId}
          value={values.name}
          onChange={(event) => {
            const name = event.target.value;
            onChange({
              name,
              slug: deriveSlug && !slugTouched ? slugify(name) : values.slug,
            });
          }}
          placeholder="Igreja Central"
          autoComplete="organization"
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
        />
        {errors.name ? (
          <p id={`${nameId}-error`} className="text-sm text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={slugId}>Slug</Label>
        <Input
          id={slugId}
          value={values.slug}
          onChange={(event) => {
            setSlugTouched(true);
            onChange({ name: values.name, slug: event.target.value });
          }}
          placeholder="igreja-central"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={Boolean(errors.slug)}
          aria-describedby={`${slugId}-hint`}
        />
        <p id={`${slugId}-hint`} className="text-xs text-muted-foreground">
          Identificador único usado em endereços. Apenas letras minúsculas, números e hífens.
        </p>
        {errors.slug ? <p className="text-sm text-destructive">{errors.slug}</p> : null}
      </div>
    </>
  );
}
