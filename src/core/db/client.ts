// the shared on-device database client. it has no consumers — nothing in src/
// imports it outside its own colocated test. everything the app persists today
// goes to the keychain (src/auth/helpers/session-storage.ts and
// src/auth/helpers/last-server-url.ts) and everything it reads comes from
// TanStack Query over the Payload REST API.
// it is kept as scaffolding for the first feature that needs persistence, and
// the shape that layer has to take is in docs/conventions/data-layer.md and
// README.md.
//
// that first feature's change must also define a table in ./schema.ts, commit
// the migration `npm run db-migrate:generate` produces under ./migrations/, and
// wire Drizzle's expo-sqlite migrator (useMigrations) into src/app/_layout.tsx.
// the migrator is not wired yet, so until then a committed migration would
// never run. it must also correct the four places that say this module has no
// consumer — this comment, ./client.test.ts's header, README.md, and
// docs/conventions/data-layer.md — because nothing checks that claim for them.
//
// because no other module imports it, ./client.test.ts is the only thing that
// executes this module. that test mocks expo-sqlite, so the native open below
// stays unverified until a real consumer arrives.
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
