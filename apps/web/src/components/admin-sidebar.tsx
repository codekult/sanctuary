"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bug, Eye, Calendar, Image, MapPin, Leaf, LogOut, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user: { email: string } | null;
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Taxa", href: "/admin/taxa", icon: Leaf, enabled: true },
  { label: "Individuals", href: "/admin/individuals", icon: Bug, enabled: false },
  { label: "Observations", href: "/admin/observations", icon: Eye, enabled: false },
  { label: "Phenology", href: "/admin/phenology", icon: Calendar, enabled: false },
  { label: "Media", href: "/admin/media", icon: Image, enabled: false },
  { label: "Property", href: "/admin/property", icon: MapPin, enabled: false },
];

export function AdminSidebar({ user, open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin/taxa" className="text-lg font-semibold">
            Sanctuary
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            if (!item.enabled) {
              return (
                <button
                  key={item.href}
                  disabled
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
                  title="Coming soon"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="px-4 py-3">
          {user && <p className="mb-2 truncate text-xs text-muted-foreground">{user.email}</p>}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
