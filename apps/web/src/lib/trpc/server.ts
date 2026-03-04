import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { appRouter, createContext } from "@sanctuary/api";
import { db, users } from "@sanctuary/db";
import { createSupabaseServerClient } from "../supabase/server";

async function syncUser(id: string, email: string) {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (existing) return;

  const name = email.split("@")[0] ?? "user";
  await db.insert(users).values({ id, email, name, role: "contributor" });
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

      if (!user) {
        return createContext(db, null);
      }

      await syncUser(user.id, user.email!);
      const session = { userId: user.id, email: user.email! };

      return createContext(db, session);
    },
  });
}
