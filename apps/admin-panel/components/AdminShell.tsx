import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Archive,
  Building2,
  LifeBuoy,
  LayoutDashboard,
  Laptop,
  LogOut,
  PackageOpen,
} from "lucide-react";
import Image from "next/image";
import { logoutAction } from "@/app/admin/actions";

const navigation = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/restaurants", label: "Restaurants", icon: Building2 },
  { href: "/admin/devices", label: "Devices", icon: Laptop },
  { href: "/admin/backups", label: "Backups", icon: Archive },
  { href: "/admin/versions", label: "Versions", icon: PackageOpen },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export function AdminShell({ children, email }: { children: ReactNode; email?: string }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="sidebar-brand" href="/admin/overview">
          <span><Image src="/restrozapp-icon.png" alt="" width={42} height={42} priority /></span>
          <div><b>RestroZapp</b><small>Owner Console</small></div>
        </Link>
        <nav>{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon />{label}</Link>)}</nav>
        <div className="sidebar-account"><small>Signed in as</small><b>{email || "Owner"}</b><form action={logoutAction}><button><LogOut />Sign out</button></form></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase().replaceAll("_", "-")}`}>{value.replaceAll("_", " ")}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
