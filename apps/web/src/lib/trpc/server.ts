import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@sanctuary/api";
import { db } from "@sanctuary/db";
import { createSupabaseServerClient } from "../supabase/server";

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

      const session = user ? { userId: user.id, email: user.email! } : null;

      return createContext(db, session);
    },
  });
}
