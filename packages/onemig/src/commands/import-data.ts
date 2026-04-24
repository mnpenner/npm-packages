import * as Chalk from "chalk";
import csvParse from "csv-parse";
import fs from "fs";
import * as Path from "path";
import { sql } from "../mysql.ts";
import { NULL_STR } from "../CsvWriter";
import { DbColumnType } from "../dbtypes";
import { app } from "../app.ts";
import { createConnection, dbFlags } from "../db.ts";
import { getStruct } from "../struct";

export const importDataCmd = app
	.sub("import-data")
	.meta({ description: "Import table data from CSV file" })
	.flags({
		...dbFlags,
		filename: {
			type: "string",
			short: "f",
			description: "CSV file to import",
		},
		table: {
			type: "string",
			short: "t",
			description: "Table to import into",
		},
		batchSize: {
			type: "number",
			description: "Rows to insert per batch",
			default: 1000,
		},
	})
	.run(async ({ flags }) => {
		const table = flags.table ?? Path.parse(flags.filename).name;

		console.log(`Importing file ${Chalk.yellow(flags.filename)} into table ${Chalk.magenta(table)}`);

		const startTime = Date.now();
		const conn = await createConnection(flags);

		const def = await getStruct(conn, flags.database, table);
		if (!def) {
			throw new Error(`Could not get definition for table ${table}`);
		}

		const colMap = Object.fromEntries(def.columns.map(({ name, ...columnDef }) => [name, columnDef]));
		const fileStream = fs.createReadStream(flags.filename);
		const csvParser = fileStream.pipe(
			csvParse({
				columns: true,
			}),
		);

		let batch: any[] = [];
		let columns: string[] | undefined;
		let rowCount = 0;
		for await (const row of csvParser) {
			if (!columns) {
				columns = Object.keys(row).filter((column) => colMap[column] && !colMap[column].generated);
				if (!columns.length) {
					throw new Error("No matching columns found");
				}
			}
			const insertValues: any[] = [];
			for (const colName of columns) {
				const colDef = colMap[colName];
				if (!colDef) {
					throw new Error(`Column ${colName} not found in table ${table}`);
				}
				let value = row[colName];
				if (colDef.type === DbColumnType.BINARY || colDef.type === DbColumnType.VARBINARY) {
					value = Buffer.from(value, "base64");
				}
				if (colDef.nullable && value === NULL_STR) {
					value = null;
				}
				insertValues.push(value);
			}

			batch.push(insertValues);
			if (batch.length >= flags.batchSize) {
				await conn.exec(sql`insert into ${sql.id(table)} (${sql.columns(columns)}) values ${sql.values(batch)}`);
				process.stdout.write(".");
				batch = [];
			}
			++rowCount;
		}
		if (batch.length) {
			await conn.exec(sql`insert into ${sql.id(table)} (${sql.columns(columns!)}) values ${sql.values(batch)}`);
			process.stdout.write(".");
		}
		console.log();

		const elapsed = Date.now() - startTime;
		console.log(`Imported ${Chalk.cyan(rowCount)} rows from ${Chalk.yellow(flags.filename)} into ${Chalk.magenta(table)} in ${Chalk.green(elapsed)}ms`);
	});
