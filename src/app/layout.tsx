import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EnvironmentBanner } from "@/components/environment-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Igreja — Assembleia de Deus Paulistana",
  description:
    "Gestão de membros, cultos, chamada e visitantes, com métricas para o ofício pastoral.",
};

// No `next/font/google`: remote font fetching makes `next build` depend on
// network access to Google's CDN. A system stack keeps the build hermetic.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `suppressHydrationWarning` is required by next-themes: it writes the theme
    // class onto <html> before React hydrates, which would otherwise be flagged
    // as a server/client mismatch.
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <EnvironmentBanner />
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
