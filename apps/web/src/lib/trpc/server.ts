import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@sanctuary/api";
import { db, users } from "@sanctuary/db";
import { createSupabaseServerClient } from "../supabase/server";

const syncedUsers = new Set<string>();

async function syncUser(id: string, email: string) {
  if (syncedUsers.has(id)) return;
  const name = email.split("@")[0] ?? "user";
  await db
    .insert(users)
    .values({ id, email, name, role: "contributor" })
    .onConflictDoNothing({ target: users.id });
  syncedUsers.add(id);
}

export async function handleTRPC(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        return createContext(db, null);
      }

      await syncUser(user.id, user.email);
      const session = { userId: user.id, email: user.email };

      return createContext(db, session);
    },
  });
}
