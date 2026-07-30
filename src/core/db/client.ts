// The shared on-device database client. Nothing imports it yet: everything the
// app persists today goes to the keychain (src/auth/helpers/session-storage.ts,
// last-server-url.ts) and everything it reads comes from TanStack Query over
// the Payload REST API. It is kept as scaffolding for the first feature that
// needs persistence — see AGENTS.md § Data Layer and README.md.
//
// That first feature's change must also define a table in ./schema.ts, commit
// the migration `npm run db-migrate:generate` produces under ./migrations/, and
// wire Drizzle's expo-sqlite migrator (useMigrations) into src/app/_layout.tsx.
// The migrator is not wired yet, so until then a migration would never run.
//
// Because there is no importer, only ./client.test.ts exercises this module.
// That test mocks expo-sqlite, so the native open below is unverified until a
// real consumer arrives.
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { createModuleLogger } from "~/core/helpers/logging";
import * as schema from "./schema";

const DATABASE_NAME = "nakami.db";

const logger = createModuleLogger("core/db");

const expoDb = openDatabaseSync(DATABASE_NAME, {
	enableChangeListener: true,
});

logger.debug("Opened the on-device database.", { name: DATABASE_NAME });

export const db = drizzle(expoDb, { schema });
