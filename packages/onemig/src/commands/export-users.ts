import highlight from "cli-highlight";
import { promises as fs } from "fs";
import { dumpYaml } from "../struct";
import { getMysqlUsers } from "../utils/mysql-users";
import { app } from "../app.ts";
import { createConnection, dbFlags } from "../db.ts";

export const exportUsersCmd = app
	.sub("export-users")
	.meta({ description: "Export users in YAML format" })
	.flags({
		...dbFlags,
	})
	.args([
		{
			name: "outfile",
			type: "string",
			description: "YAML file to write",
		},
	])
	.run(async ({ args, flags }) => {
		const conn = await createConnection(flags);
		try {
			const users = await getMysqlUsers(conn);
			const yaml = dumpYaml(users);

			if (args.outfile) {
				await fs.writeFile(args.outfile, yaml);
			} else {
				console.log(highlight(yaml, { language: "yaml", ignoreIllegals: true }));
			}
		} finally {
			conn.close();
		}
	});
