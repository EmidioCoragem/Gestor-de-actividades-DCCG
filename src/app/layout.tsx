import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Gestor de Actividades",
    template: "%s | Gestor de Actividades",
  },
  applicationName: "Gestor de Actividades",
  description:
    "Gestor de Actividades — Gestão Integrada de actividades e controlo de gestão. Identidade, organização e permissões — Fase 1.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-AO">
      <body>{children}</body>
    </html>
  );
}
