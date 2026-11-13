import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import pg from "pg";
import * as schema from "./schema";

// Driver-agnostic type: production uses node-postgres, tests use PGlite.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  const db = drizzle(pool, { schema });
  return {
    db: db as unknown as Db,
    migrate: (folder: string) => migrate(db, { migrationsFolder: folder }),
    close: () => pool.end(),
  };
}

export { schema };
