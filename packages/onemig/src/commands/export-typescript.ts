import { promises as fs } from "fs";
import * as inflection from "inflection";
import * as json5 from "json5";
import { escapeIdStrict } from "../mysql.ts";
import { DbColumn, type DbTable } from "../dbtypes";
import { app } from "../app.ts";
import { createConnection, dbFlags } from "../db.ts";
import { getStruct, getTableNamesQuery } from "../struct";
import { longestCommonSuffix } from "../utils/longest-common-substring";
import { type Resolvable, resolveValue } from "../utils/resolve";

const dbTsTypeMap: Record<string, Resolvable<string, [DbColumn]>> = {
	enum: (col) => (col.values ? col.values.map((v) => json5.stringify(v)).join("|") : "unknown"),
	set: (col) => (col.values ? `Array<${col.values.map((v) => json5.stringify(v)).join("|")}>` : "unknown"),
	tinyint: "number",
	smallint: "number",
	mediumint: "number",
	int: "number",
	bigint: "number",
	float: "number",
	decimal: "string",
	double: "number",
	bit: (col) => {
		if (!col.length || col.length === 1) {
			return "boolean";
		}
		return "Buffer";
	},
	char: "string",
	varchar: "string",
	binary: "Buffer",
	varbinary: "Buffer",
	year: "number",
	tinytext: "string",
	text: "string",
	mediumtext: "string",
	longtext: "string",
	tinyblob: "Buffer",
	blob: "Buffer",
	mediumblob: "Buffer",
	longblob: "Buffer",
	time: "string",
	datetime: "string",
	timestamp: "string",
	date: "string",
	polygon: "unknown",
};

export const exportTypescriptCmd = app
	.sub("export-typescript")
	.meta({ description: "Export TypeScript interfaces" })
	.flags({
		...dbFlags,
		enums: {
			type: "boolean",
			description: "Export enums",
		},
		colmaps: {
			type: "boolean",
			description: "Export camelCase mappings of column names",
		},
		tablemap: {
			type: "boolean",
			description: "Export camelCase mappings of table names",
		},
		mysql3: {
			type: "boolean",
			description: "Enable mysql3 compatiability",
		},
		namespace: {
			type: "string",
			description: "Namespace",
		},
		classname: {
			type: "string",
			description: "Database class name",
		},
	})
	.args([
		{
			name: "outfile",
			type: "string",
			description: ".d.ts file to write",
		},
	])
	.run(async ({ args, flags }) => {
		const conn = await createConnection(flags);

		const tblStream = conn.stream<{ name: string }>(getTableNamesQuery(flags.database));
		const lines: string[] = [];
		if (flags.mysql3) {
			lines.push("import {ConnectionPool, sql, SqlFrag} from 'mysql3'\n");
		}
		if (flags.namespace) {
			lines.push(`export namespace ${flags.namespace || columnToKey(flags.database)} {`);
		}

		const tables: DbTable[] = [];
		const enums = new Map<string, string[]>();

		for await (const tbl of tblStream) {
			const def = await getStruct(conn, flags.database, tbl.name);
			if (!def) {
				continue;
			}
			tables.push(def);

			for (const col of def.columns) {
				if (col.type === "enum" || col.type === "set") {
					const values = JSON.stringify(col.values);
					const name = inflection.singularize(tbl.name) + "_" + col.name;
					if (enums.has(values)) {
						enums.get(values)!.push(name);
					} else {
						enums.set(values, [name]);
					}
				}
			}
		}

		let enumCounter = 0;
		const enumNames = new Map<string, string>();

		if (flags.enums) {
			for (const [values, colNames] of enums.entries()) {
				const lcs = longestCommonSuffix(colNames);
				const items: string[] = JSON.parse(values);
				const name = lcs ? columnToKey(lcs) : `Unknown${++enumCounter}`;
				lines.push(`const enum ${name} {`);
				for (const it of items) {
					lines.push(`  ${columnToKey(it.toLowerCase())} = ${json5.stringify(it)},`);
				}
				lines.push("}\n");
				enumNames.set(values, name);
			}
		}

		const tblmap = Object.create(null);
		for (const def of tables) {
			const interfaceName = columnToKey(def.name);
			tblmap[inflection.camelize(def.name, false)] = def.name;
			lines.push(`export interface ${interfaceName} {`);
			for (const col of def.columns) {
				let colType = resolveValue(dbTsTypeMap[col.type], col);
				if (!colType) {
					throw new Error(`Unhandled column type "${col.type}"`);
				}
				if (col.type === "enum" || col.type === "set") {
					const valuesStr = JSON.stringify(col.values);
					if (enumNames.has(valuesStr)) {
						colType += "|" + enumNames.get(valuesStr);
						if (col.type === "set") {
							colType += "[]";
						}
					}
				}
				if (col.nullable) {
					colType += "|null";
				}
				if (col.comment) {
					lines.push(`  /** ${col.comment.replace(/^(UNUSED|DEPRECATED)\b/i, "@deprecated")} */`);
				}
				lines.push(`  ${escapeCol(col.name)}: ${colType},`);
			}
			lines.push("}\n");

			if (flags.colmaps) {
				lines.push(`export const ${columnToKey(def.name)}Columns = Object.freeze({`);
				for (const col of def.columns) {
					let colName = json5.stringify(col.name);
					if (flags.mysql3) {
						colName = `sql.id(${colName})`;
					}
					lines.push(`  ${inflection.camelize(col.name, true)}: ${colName},`);
				}
				lines.push("})\n");
			}
		}

		if (flags.tablemap) {
			lines.push("export const tbl = Object.freeze({");
			for (const [k, v] of Object.entries(tblmap)) {
				let tblName = json5.stringify(v);
				if (flags.mysql3) {
					tblName = `sql.id(${tblName})`;
				}
				lines.push(`  ${k}: ${tblName},`);
			}
			lines.push("})\n");
		}

		if (flags.mysql3 && flags.tablemap && flags.colmaps) {
			lines.push(`export class ${columnToKey(flags.classname ?? flags.database)} {`);
			lines.push("  constructor(private readonly db: ConnectionPool){}");
			for (const def of tables) {
				const tableName = inflection.camelize(def.name, false);
				const interfaceName = columnToKey(def.name);
				const columnNames = def.columns.map((c) => c.name);
				lines.push(`  query${tableName}<C extends keyof ${interfaceName}>(columns: C[]|null, postfix: SqlFrag|((t:SqlFrag)=>SqlFrag)) {`);
				lines.push("    const t=sql.id('t')");
				lines.push(`    let q=sql\`select \${sql.columns(columns??${json5.stringify(columnNames)})} from ${dumbScape(def.name)} as \${t}\``);
				lines.push("    if(postfix) q=sql`\${q} \${typeof postfix === 'function' ? postfix(t) : postfix}`");
				lines.push(`    return this.db.query<Pick<${interfaceName}, C>>(q)`);
				lines.push("  }");
				const pk = def.indexes.find((idx) => idx.type === "PRIMARY" && idx.columns.length === 1);
				if (pk) {
					const name = columnToKey(inflection.singularize(def.name));
					const pkCol = pk.columns[0];
					const varName = inflection.camelize(pkCol, true);
					lines.push(`  get${name}<C extends keyof ${interfaceName}>(${varName}: ${interfaceName}[${json5.stringify(pkCol)}], columns?: C[]) {`);
					lines.push(`    return this.db.row<${interfaceName}>(sql\`select \${sql.columns(columns??${json5.stringify(columnNames)})} from ${dumbScape(def.name)} where ${dumbScape(pkCol)}=\${${varName}}\`)`);
					lines.push("  }");
				}
			}
			lines.push("}");
		}

		if (flags.namespace) {
			lines.push("}");
		}

		await conn.close();
		await fs.writeFile(args.outfile, lines.join("\n"));
	});

function dumbScape(name: string) {
	return escapeIdStrict(name).replace(/`/g, "\\`");
}

function escapeCol(col: string) {
	if (/\W/i.test(col)) {
		return JSON.stringify(col);
	}
	return col;
}

function columnToKey(name: string) {
	if (/^[A-Z_]+$/.test(name)) {
		name = name.toLowerCase();
	}
	name = inflection.classify(name);
	name = name.replace(/#/g, "Nbr");
	name = name.replace(/\$/g, "Dlr");
	if (/^\d/.test(name)) {
		name = "_" + name;
	}
	return name;
}
