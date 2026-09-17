"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * `/settings` has no content of its own — it forwards to the first section.
 * `replace` rather than `push` so the back button does not bounce the user
 * between the redirect and its target.
 */
export default function SettingsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/congregation");
  }, [router]);

  return null;
}
