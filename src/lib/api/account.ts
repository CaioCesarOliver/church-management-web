import { apiPatch, apiPost } from "@/lib/api-client";
import type { AuthUser } from "@/types/api";

/** What the signed-in user may change about themselves, whatever their role. */

export function updateMyAccount(input: { name: string }): Promise<AuthUser> {
  return apiPatch<AuthUser>("/api/auth/me", input);
}

/**
 * Answers 204 on success. The current password is required on purpose — a wrong
 * one comes back as a 422 with `fieldErrors.currentPassword`.
 */
export function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return apiPost<void>("/api/auth/change-password", input);
}
