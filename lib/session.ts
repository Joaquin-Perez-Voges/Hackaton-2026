import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

/** Sesión actual (o null). Cacheada por request para no repetir el lookup. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Igual que getSession pero redirige a /login si no hay sesión. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
