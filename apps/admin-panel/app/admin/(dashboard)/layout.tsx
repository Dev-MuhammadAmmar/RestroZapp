import type { ReactNode } from "react";
import { requireOwner } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const owner = await requireOwner();
  return <AdminShell email={owner.email}>{children}</AdminShell>;
}
