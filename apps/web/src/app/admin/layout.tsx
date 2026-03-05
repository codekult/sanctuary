import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <AdminShell userEmail={user?.email ?? null}>{children}</AdminShell>
      <Toaster />
    </>
  );
}
