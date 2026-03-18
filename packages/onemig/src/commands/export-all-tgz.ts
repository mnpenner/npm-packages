import * as Chalk from "chalk";
import * as FileSys from "fs";
import * as Path from "path";
import * as Tar from "tar-stream";
import * as Zlib from "zlib";
import { dumpYaml, exportTableDataToFile, getDatabases, getTableNames, getTableYaml, getUsersYaml } from "../struct";
import MemoryStream from "../utils/memory-stream";
import pkg from "../../package.json";
import { app } from "../app.ts";
import { createConnection, dbFlagsWithoutDatabase } from "../db.ts";

const INTERNAL_DATABASES = new Set(["mysql", "information_schema", "performance_schema"]);

export const exportAllTgzCmd = app
	.sub("export-all-tgz")
	.meta({ description: "Export all data from host" })
	.flags({
		...dbFlagsWithoutDatabase,
		skipDatabaseRegex: {
			type: "string",
			description: "Don't export databases matching this regexp",
		},
		file: {
			type: "string",
			short: "f",
			description: ".tar.gz file to write",
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
	.run(async ({ flags }) => {
		let skipDbRegex: RegExp | null = null;
		if (flags.skipDatabaseRegex) {
			skipDbRegex = new RegExp(flags.skipDatabaseRegex);
		}

		const pack = Tar.pack();
		pack.pipe(Zlib.createGzip({ level: Zlib.constants.Z_BEST_COMPRESSION })).pipe(FileSys.createWriteStream(flags.file));
		console.log(`Writing to ${Chalk.underline(flags.file)}`);

		const startTime = new Date();
		const pool = await createConnection(flags);
		try {
			if (!flags.skipUsers) {
				const usersFile = "users.yaml";
				pack.entry({ name: usersFile }, await getUsersYaml(pool));
				console.log(`  Wrote ${Chalk.underline(usersFile)}`);
			}

			const databases = (await getDatabases(pool)).filter((db) => {
				if (INTERNAL_DATABASES.has(db.name)) {
					return false;
				}
				if (skipDbRegex && skipDbRegex.test(db.name)) {
					return false;
				}
				return true;
			});

			if (!flags.skipDbSchema) {
				const dbFile = "databases.yaml";
				pack.entry({ name: dbFile }, dumpYaml(databases));
				console.log(`  Wrote ${Chalk.underline(dbFile)}`);
			}

			for (const db of databases) {
				console.log(`  Exporting database ${Chalk.underline(db.name)}`);
				const tableNames = await getTableNames(pool, db.name);
				for (const tblName of tableNames) {
					if (!flags.skipTableSchema) {
						const tblSchemaFile = Path.join(db.name, `${tblName}.yaml`);
						pack.entry({ name: tblSchemaFile }, await getTableYaml(pool, db.name, tblName));
						console.log(`    Wrote ${Chalk.underline(tblSchemaFile)}`);
					}

					if (!flags.skipData) {
						const tblDataFile = Path.join(db.name, `${tblName}.csv`);
						const memStream = new MemoryStream();
						await exportTableDataToFile(pool, db.name, tblName, memStream);
						pack.entry({ name: tblDataFile }, memStream.toString());
						console.log(`    Wrote ${Chalk.underline(tblDataFile)}`);
					}
				}
			}

			const elapsed = Date.now() - startTime.valueOf();
			const metadataFile = "metadata.yaml";
			const conn = await pool.getConnection();
			try {
				pack.entry(
					{ name: metadataFile },
					dumpYaml({
						onemigVersion: pkg.version,
						exportDate: startTime.toISOString(),
						exportDuration: elapsed,
						user: flags.user,
						host: flags.host,
						serverVersion: conn.serverVersion(),
					}),
				);
			} finally {
				conn.release();
			}
			console.log(`  Wrote ${Chalk.underline(metadataFile)}`);
		} finally {
			pool.close();
			pack.finalize();
		}
	});
