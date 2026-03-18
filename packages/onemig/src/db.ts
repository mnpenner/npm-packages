import { userInfo } from "os";
import { createPool } from "./mysql.ts";
import type { PoolConfig } from "./mysql.ts";

export function createConnection(opts: PoolConfig) {
	return createPool({
		connectionLimit: 25,
		dateStrings: true,
		...opts,
	});
}

export const dbFlagsWithoutDatabase = {
	host: {
		type: "string",
		short: "h",
		description: "Connect to the MySQL server on the given host.",
		default: process.env.DB_HOST ?? "localhost",
	},
	port: {
		type: "number",
		short: "P",
		description: "For TCP/IP connections, the port number to use.",
		default: process.env.DB_PORT !== undefined ? Number(process.env.DB_PORT) : 3306,
	},
	user: {
		type: "string",
		short: "u",
		description: "The user name of the MySQL account to use for connecting to the server.",
		default: process.env.DB_USER ?? userInfo().username,
	},
	password: {
		type: "string",
		short: "p",
		description: "The password of the MySQL account used for connecting to the server.",
		default: process.env.DB_PASSWORD,
	},
} as const;

export const dbFlags = {
	...dbFlagsWithoutDatabase,
	database: {
		type: "string",
		short: "D",
		description: "The database to use.",
	},
} as const;
