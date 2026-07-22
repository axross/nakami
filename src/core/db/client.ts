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
