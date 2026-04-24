import { escapeIdStrict } from "../mysql.ts";
import highlight from "cli-highlight";
import { promises as fs } from "fs";
import * as yaml from "js-yaml";
import { app } from "../app.ts";
import { dbFlagsWithoutDatabase } from "../db.ts";

export const databasesSqlCmd = app
	.sub("databases-sql")
	.meta({ description: "Convert databases.yaml back into SQL" })
	.flags({
		...dbFlagsWithoutDatabase,
		exists: {
			type: "boolean",
			short: "e",
			description: "Add IF NOT EXISTS to CREATE DATABASE",
		},
	})
	.args([
		{
			name: "schemaFile",
			type: "string",
			description: "YAML file to load",
		},
	])
	.run(async ({ args, flags }) => {
		const schemaYaml = await fs.readFile(args.schemaFile, { encoding: "utf8" });
		const schema = yaml.load(schemaYaml) as Array<Record<string, any>>;

		const lines: string[] = [];

		for (const db of schema) {
			let line = "CREATE DATABASE ";
			if (flags.exists) {
				line += "IF NOT EXISTS ";
			}
			line += escapeIdStrict(db.name);
			const charset = db.charset ?? db.characterSet ?? db.defaultCharset ?? db.defaultCharacterSet;
			if (charset) {
				line += ` CHARACTER SET ${charset}`;
			}
			const collate = db.collation ?? db.defaultCollation ?? db.defaultCollationName;
			if (collate) {
				line += ` COLLATE ${collate}`;
			}
			if (db.encrypted != null) {
				line += ` ENCRYPTION ${db.encrypted ? "'Y'" : "'N'"}`;
			}
			line += ";";
			lines.push(line);
		}

		const sqlOut = lines.join("\n");
		console.log(highlight(sqlOut, { language: "sql", ignoreIllegals: true }));
	});
