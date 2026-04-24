import highlight, { type Theme } from "cli-highlight";
import { promises as fs } from "fs";
import ora from "ora";
import { dumpAllYaml, getStruct, getTableNamesQuery } from "../struct";
import { app } from "../app.ts";
import { createConnection, dbFlags } from "../db.ts";

const HIGHLIGHT_THEME: Theme = {};

export const exportSchemaCmd = app
	.sub("export-schema")
	.meta({ description: "Export table definitions from existing database to YAML" })
	.flags({
		...dbFlags,
	})
	.args([
		{
			name: "outfile",
			type: "string",
			description: "YAML database schema to write",
		},
	])
	.run(async ({ args, flags }) => {
		const spinner = ora().start(`Exporting ${flags.database}`);
		const startedAt = Date.now();

		const conn = await createConnection(flags);
		const tblStream = conn.stream<{ name: string }>(getTableNamesQuery(flags.database));
		const tables = [];

		for await (const tbl of tblStream) {
			spinner.text = `Exporting ${tbl.name}`;
			const def = await getStruct(conn, flags.database, tbl.name);
			tables.push(def);
		}
		await conn.close();

		const elapsed = Date.now() - startedAt;
		const yaml = dumpAllYaml(tables);

		if (args.outfile) {
			await fs.writeFile(args.outfile, yaml);
			spinner.succeed(`Exported ${flags.database} in ${elapsed} ms`);
		} else {
			spinner.stop();
			console.log(highlight(yaml, { language: "yaml", ignoreIllegals: true, theme: HIGHLIGHT_THEME }));
		}
	});
