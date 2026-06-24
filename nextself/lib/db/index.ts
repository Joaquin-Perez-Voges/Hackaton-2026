import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Fallback string keeps `next build` working without a DB reachable; postgres.js
// is lazy and only connects on the first query (which never runs at build time
// because all DB-backed pages are `force-dynamic`).
const connectionString =
  process.env.POSTGRES_URL ?? "postgres://localhost:5432/nextself_placeholder";

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
