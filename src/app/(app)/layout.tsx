"use client";

import { Fragment, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SETTINGS_NAV } from "@/components/settings/settings-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

const SECTION_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/meetings": "Cultos",
  "/members": "Membros",
  "/visitors": "Visitantes",
  "/metrics": "Métricas",
  "/settings": "Configurações",
};

interface Crumb {
  label: string;
  href?: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === "/") return [{ label: SECTION_LABELS["/"] }];

  const segments = pathname.split("/").filter(Boolean);
  const sectionHref = `/${segments[0]}`;
  const sectionLabel = SECTION_LABELS[sectionHref];
  if (!sectionLabel) return [{ label: SECTION_LABELS["/"], href: "/" }];

  // /meetings/[id]/attendance is the one nested screen: show "Cultos / Chamada"
  // rather than leaking the record id into the breadcrumb.
  if (sectionHref === "/meetings" && segments[2] === "attendance") {
    return [{ label: sectionLabel, href: sectionHref }, { label: "Chamada" }];
  }

  // Settings sections are real routes now. Labels come from the same definition
  // the settings nav uses, so renaming a section renames it in both places.
  if (sectionHref === "/settings" && segments[1]) {
    const target = `/settings/${segments[1]}`;
    const item = SETTINGS_NAV.flatMap((group) => group.items).find((it) => it.href === target);
    if (item) {
      return [{ label: sectionLabel, href: sectionHref }, { label: item.label }];
    }
  }

  return [{ label: sectionLabel }];
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect once the session has actually been resolved. Redirecting
    // while `loading` is still true logs the user out on every page refresh,
    // because the stored token has not been read back yet.
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    // A brand-new installation has a SUPER_ADMIN but no congregation at all, so
    // there is no tenant for any of these screens to read. Send them to the
    // first-run wizard, which lives outside this layout precisely because the
    // sidebar has nothing to show yet.
    if (!loading && user && user.role === "SUPER_ADMIN" && user.congregation === null) {
      router.replace("/setup");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <span className="sr-only">Carregando…</span>
        </div>
      </div>
    );
  }

  const crumbs = buildCrumbs(pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {/* The separator renders its own <li>, so it has to be a SIBLING
                    of the item inside the <ol> — nesting it produced invalid
                    HTML and a hydration error. */}
                {crumbs.map((crumb, index) => (
                  <Fragment key={crumb.label}>
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < crumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
