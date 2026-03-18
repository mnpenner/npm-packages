import highlight from "cli-highlight";
import { promises as fs } from "fs";
import * as yaml from "js-yaml";
import { DbColumn, DbIndex } from "../dbtypes";
import { app } from "../app.ts";
import * as sql from "../utils/sql";

export const schemaSqlCmd = app
	.sub("schema-sql")
	.meta({ description: "Convert YAML schema back to MySQL" })
	.flags({
		exists: {
			type: "boolean",
			short: "e",
			description: "Add IF NOT EXISTS to CREATE TABLE",
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
		const schema = yaml.loadAll(schemaYaml) as Array<Record<string, any>>;
		const lines = [];

		for (const table of schema) {
			lines.push(`CREATE TABLE ${flags.exists ? "IF NOT EXISTS " : ""}${sql.escapeId(table.name)} (`);
			const columns = [];
			for (const col of table.columns ?? []) {
				columns.push(`  ${sql.escapeId(col.name)} ${getType(col)}`);
			}
			for (const idx of table.indexes ?? []) {
				columns.push(`  ${getIndex(idx)}`);
			}
			lines.push(columns.join(",\n"));
			lines.push(");");
		}

		const sqlOut = lines.join("\n");
		console.log(highlight(sqlOut, { language: "sql", ignoreIllegals: true }));
	});

function getIndex(idx: DbIndex): string {
	const sb: string[] = [idx.type];
	if (idx.type.toUpperCase() === "PRIMARY") {
		sb.push("KEY");
	} else if (idx.name) {
		sb.push(sql.escapeId(idx.name));
	}
	sb.push("(" + idx.columns.map(sql.escapeId).join(",") + ")");
	return sb.join(" ");
}

function getType(col: DbColumn): string {
	const sb: string[] = [col.type];

	if (col.length) {
		sb.push(`(${col.length})`);
	}
	if (col.fracDigits) {
		sb.push(`(${col.fracDigits})`);
	}
	if (col.precision) {
		sb.push(`(${col.precision.join(",")})`);
	}
	if (col.unsigned) {
		sb.push("unsigned");
	}
	if (col.generated || col.genExpr) {
		if (!col.generated || !col.genExpr) {
			throw new Error("Both `generated` and `genExpr` are required");
		}
		sb.push(`GENERATED ALWAYS AS (${col.genExpr})`, col.generated);
	} else {
		if (col.values) {
			sb.push("(" + col.values.map(sql.escapeString).join(",") + ")");
		}
		if (col.autoIncrement) {
			sb.push("auto_increment");
		}
		if (col.collation) {
			sb.push("collate", col.collation);
		}
		if (!col.nullable) {
			sb.push("not null");
		}
		if (col.default !== undefined) {
			sb.push("DEFAULT", String(col.default));
		}
	}
	if (col.comment) {
		sb.push("COMMENT", sql.escapeString(col.comment));
	}
	if (col.invisible) {
		throw new Error("invisible not implemented");
	}
	return sb.join(" ");
}
