import * as Chalk from "chalk";
import { promises as fs } from "fs";
import * as Path from "path";
import { sql } from "../mysql.ts";
import { dumpYaml, exportDumpUsersToFile, exportTableDataToFile, getTableNames, getTableYaml } from "../struct";
import { app } from "../app.ts";
import { createConnection, dbFlagsWithoutDatabase } from "../db.ts";

const INTERNAL_DATABASES = new Set(["mysql", "information_schema", "performance_schema"]);

export const exportAllCmd = app
	.sub("export-all")
	.meta({ description: "Export all data from host" })
	.flags({
		...dbFlagsWithoutDatabase,
		skipDatabaseRegex: {
			type: "string",
			description: "Don't export databases matching this regexp",
		},
		skipUsers: {
			type: "boolean",
			description: "Don't export users",
		},
		skipData: {
			type: "boolean",
			description: "Don't export table data",
		},
		skipTableSchema: {
			type: "boolean",
			description: "Don't export table schemas",
		},
		skipDbSchema: {
			type: "boolean",
			description: "Don't export database schemas",
		},
	})
	.args([
		{
			name: "outdir",
			type: "string",
			description: "Directory to write data to",
		},
	])
	.run(async ({ args, flags }) => {
		const conn = await createConnection(flags);

		let skipDbRegex: RegExp | null = null;
		if (flags.skipDatabaseRegex) {
			skipDbRegex = new RegExp(flags.skipDatabaseRegex);
		}

		try {
			await fs.mkdir(args.outdir, { recursive: true });
			console.log(`Created ${Chalk.underline(args.outdir)}`);

			if (!flags.skipUsers) {
				const usersFile = Path.join(args.outdir, "users.yaml");
				await exportDumpUsersToFile(conn, usersFile);
				console.log(`  Wrote ${Chalk.underline(usersFile)}`);
			}

			const databases = (
				await conn.query<{ name: string; defaultCollation: string }>(
					sql`select SCHEMA_NAME name, DEFAULT_COLLATION_NAME collation from information_schema.SCHEMATA`,
				)
			).filter((db) => {
				if (INTERNAL_DATABASES.has(db.name)) {
					return false;
				}
				if (skipDbRegex && skipDbRegex.test(db.name)) {
					return false;
				}
				return true;
			});

			if (!flags.skipDbSchema) {
				const dbFile = Path.join(args.outdir, "databases.yaml");
				await fs.writeFile(dbFile, dumpYaml(databases));
				console.log(`  Wrote ${Chalk.underline(dbFile)}`);
			}

			for (const db of databases) {
				console.log(`  Exporting database ${Chalk.underline(db.name)}`);
				const dbDir = Path.join(args.outdir, db.name);
				await fs.mkdir(dbDir);
				const tableNames = await getTableNames(conn, db.name);
				for (const tblName of tableNames) {
					if (!flags.skipTableSchema) {
						const tblSchemaFile = Path.join(dbDir, `${tblName}.yaml`);
						await fs.writeFile(tblSchemaFile, await getTableYaml(conn, db.name, tblName));
						console.log(`    Wrote ${Chalk.underline(tblSchemaFile)}`);
					}

					if (!flags.skipData) {
						const tblDataFile = Path.join(dbDir, `${tblName}.csv`);
						await exportTableDataToFile(conn, db.name, tblName, tblDataFile);
						console.log(`    Wrote ${Chalk.underline(tblDataFile)}`);
					}
				}
			}
		} finally {
			conn.close();
		}
	});
