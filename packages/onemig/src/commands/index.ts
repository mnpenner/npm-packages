import { databasesSqlCmd } from "./databases-sql.ts";
import { exportAllCmd } from "./export-all.ts";
import { exportAllTgzCmd } from "./export-all-tgz.ts";
import { exportDataCmd } from "./export-data.ts";
import { exportSchemaCmd } from "./export-schema.ts";
import { exportTypescriptCmd } from "./export-typescript.ts";
import { exportUsersCmd } from "./export-users.ts";
import { importDataCmd } from "./import-data.ts";
import { schemaSqlCmd } from "./schema-sql.ts";
import { usersSqlCmd } from "./users-sql.ts";

export default [
	exportSchemaCmd,
	exportDataCmd,
	importDataCmd,
	schemaSqlCmd,
	exportUsersCmd,
	usersSqlCmd,
	exportAllCmd,
	exportAllTgzCmd,
	databasesSqlCmd,
	exportTypescriptCmd,
];
