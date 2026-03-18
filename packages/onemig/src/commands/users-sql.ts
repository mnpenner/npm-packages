import highlight from "cli-highlight";
import { promises as fs } from "fs";
import { escapeIdStrict, escapeValue } from "../mysql.ts";
import * as yaml from "js-yaml";
import { app } from "../app.ts";
import { dbFlagsWithoutDatabase } from "../db.ts";

function makeGrant(privileges: string | string[] | null) {
	if (!privileges?.length) {
		return "USAGE";
	}
	if (Array.isArray(privileges)) {
		return privileges.map((p) => p.trim().toUpperCase().replace(/_/g, " ")).join(", ");
	}
	const normPriv = privileges.trim().toUpperCase().replace(/\s+/g, "_");
	if (normPriv === "NONE" || normPriv === "USAGE" || normPriv === "NO_PRIVILEGES") {
		return "USAGE";
	}
	if (normPriv === "ALL" || normPriv === "ALL_PRIVILEGES") {
		return "ALL PRIVILEGES";
	}
	throw new Error(`Bad privileges: ${privileges}`);
}

export const usersSqlCmd = app
	.sub("users-sql")
	.meta({ description: "Convert users.yaml back into SQL" })
	.flags({
		...dbFlagsWithoutDatabase,
	})
	.args([
		{
			name: "schemaFile",
			type: "string",
			description: "YAML file to load",
		},
	])
	.run(async ({ args }) => {
		const schemaYaml = await fs.readFile(args.schemaFile, { encoding: "utf8" });
		const schema = yaml.load(schemaYaml) as Array<Record<string, any>>;
		const lines: string[] = [];

		for (const user of schema) {
			for (const host of toArray(user.host ?? user.hosts)) {
				const [privs, grant] = cleanPrivileges(user.privileges ?? user.privs);
				let sqlString = "GRANT " + makeGrant(privs);

				sqlString += ` ON *.* TO ${escapeValue(user.name)}@${escapeValue(host)}`;
				if (user.password) {
					sqlString += ` IDENTIFIED BY PASSWORD ${escapeValue(user.password)}`;
				}
				if (user.grantOption || grant) {
					sqlString += " WITH GRANT OPTION";
				}

				lines.push(sqlString + ";");

				const dbPrivs = user.databasePrivileges ?? user.databasePrivs ?? user.dbPrivs ?? user.dbPrivileges;
				if (dbPrivs) {
					for (const [dbName, privileges] of Object.entries(dbPrivs)) {
						const [databasePrivs, dbGrant] = cleanPrivileges(privileges as string | string[]);
						lines.push(`GRANT ${makeGrant(databasePrivs)} ON ${escapeIdStrict(dbName)}.* TO ${escapeValue(user.name)}@${escapeValue(host)}${dbGrant ? " WITH GRANT OPTION" : ""};`);
					}
				}
				const tblPrivs = user.tablePrivileges ?? user.tblPrivs ?? user.tablePrivs ?? user.tblPrivileges;
				if (tblPrivs) {
					for (const db of Object.keys(tblPrivs)) {
						for (const tbl of Object.keys(tblPrivs[db])) {
							const [tablePrivs, tableGrant] = cleanPrivileges(tblPrivs[db][tbl]);
							lines.push(`GRANT ${makeGrant(tablePrivs)} ON ${escapeIdStrict(db)}.${escapeIdStrict(tbl)} TO ${escapeValue(user.name)}@${escapeValue(host)}${tableGrant ? " WITH GRANT OPTION" : ""};`);
						}
					}
				}
			}
		}

		const sqlOut = lines.join("\n");
		console.log(highlight(sqlOut, { language: "sql", ignoreIllegals: true }));
	});

function cleanPrivileges(privileges: string | string[]): [privileges: string[] | string | null, grantOption: boolean] {
	if (!privileges?.length) {
		return [null, false];
	}

	const privArray = toArray(privileges);
	for (let i = 0; i < privArray.length; ++i) {
		if (/[\s_]*(WITH[\s_]+)?GRANT([\s_]+OPTION)?[\s_]*/i.test(privArray[i])) {
			privArray.splice(i, 1);
			return [privArray, true];
		}
	}
	return [privileges, false];
}

function toArray<T>(value: T | T[]): T[] {
	if (!value) {
		return [];
	}
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
}
