import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import { requireViewer } from "@/modules/auth/session";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer();
  return <PortalShell viewer={viewer}>{children}</PortalShell>;
}
