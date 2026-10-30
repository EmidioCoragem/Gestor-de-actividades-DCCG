import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Portal Empresarial", template: "%s | Portal Empresarial" },
  description: "Portal integrado de actividades e controlo de gestão. Fundação técnica — Fase 0.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-AO"><body><PortalShell>{children}</PortalShell></body></html>;
}
