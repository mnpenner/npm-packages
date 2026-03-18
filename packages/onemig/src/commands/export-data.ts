import * as Chalk from "chalk";
import { sql } from "../mysql.ts";
import { exportTableDataToFile } from "../struct";
import { app } from "../app.ts";
import { createConnection, dbFlags } from "../db.ts";

export const exportDataCmd = app
	.sub("export-data")
	.meta({ description: "Export table data in CSV format" })
	.flags({
		...dbFlags,
		null: {
			type: "string",
			description: "Value used to represent NULL",
			default: "\\N",
		},
		table: {
			type: "string",
			short: "t",
			description: "Table to export",
		},
		all: {
			type: "boolean",
			short: "A",
			description: "Export all tables",
		},
	})
	.args([
		{
			name: "outdir",
			type: "string",
			description: "Directory to write tables to",
		},
	])
	.run(async ({ args, flags }) => {
		console.log(`Exporting database ${Chalk.cyan(flags.database)} ...`);

		const startTime = Date.now();
		const conn = await createConnection(flags);

		let tables: string[];
		if (flags.table) {
			tables = [flags.table];
		} else if (flags.all) {
			const result = await conn.query<{ name: string }>(
				sql`SELECT TABLE_NAME 'name'
						FROM INFORMATION_SCHEMA.TABLES
						WHERE TABLES.TABLE_SCHEMA=${flags.database} AND TABLE_TYPE='BASE TABLE'
						ORDER BY name`,
			);
			tables = result.map((r) => r.name);
		} else {
			throw new Error("Must specify --table or --all");
		}

		for (const tbl of tables) {
			process.stdout.write(`  Exporting table ${Chalk.yellow(tbl)} ...`);
			const tblTime = Date.now();

			await exportTableDataToFile(conn, flags.database, tbl, `${args.outdir}/${tbl}.csv`);

			process.stdout.write(` ${Chalk.green(Date.now() - tblTime)}ms\n`);
		}

		await conn.close();

		const elapsed = Date.now() - startTime;
		console.log(`Exported ${Chalk.cyan(flags.database)} in ${Chalk.green(elapsed)}ms`);
	});
