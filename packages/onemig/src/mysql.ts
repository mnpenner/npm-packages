import mysql from "mysql2";
import type { Pool as MysqlPool, PoolOptions } from "mysql2";

export type PoolConfig = PoolOptions;

export class SqlFrag {
	constructor(private readonly sqlText: string) {}

	toString() {
		throw new Error("SqlFrag cannot be cast to string");
	}

	toSqlString() {
		return this.sqlText;
	}
}

export class ConnectionPool {
	constructor(private readonly pool: MysqlPool) {}

	async query<T>(query: SqlFrag | string) {
		const [rows] = await this.pool.promise().query(toSql(query));
		return rows as T[];
	}

	async exec(query: SqlFrag | string) {
		const [rows] = await this.pool.promise().query(toSql(query));
		return rows;
	}

	async row<T>(query: SqlFrag | string) {
		const rows = await this.query<T>(query);
		return rows[0] ?? null;
	}

	async col<T>(query: SqlFrag | string) {
		const rows = await this.query<Record<string, T>>(query);
		return rows.map((row) => Object.values(row)[0] as T);
	}

	async value<T>(query: SqlFrag | string) {
		const row = await this.row<Record<string, T>>(query);
		return row ? (Object.values(row)[0] as T) : null;
	}

	async *stream<T>(query: SqlFrag | string): AsyncIterable<T> {
		const stream = this.pool.query(toSql(query)).stream({ objectMode: true });
		for await (const row of stream as AsyncIterable<T>) {
			yield row;
		}
	}

	async getConnection() {
		const connection = await this.pool.promise().getConnection();
		return {
			serverVersion: () => (connection as any).connection.serverVersion,
			release: () => connection.release(),
		};
	}

	close() {
		return this.pool.end();
	}
}

export function createPool(config: PoolConfig) {
	return new ConnectionPool(mysql.createPool(config));
}

export function isFrag(value: unknown): value is SqlFrag {
	return value instanceof SqlFrag;
}

export function frag(value: string) {
	return new SqlFrag(value);
}

export function escapeValue(value: any) {
	return frag(_escapeValue(value));
}

export function escapeIdStrict(value: string | string[] | SqlFrag) {
	return _escapeIdStrict(value);
}

function toSql(query: SqlFrag | string) {
	return isFrag(query) ? query.toSqlString() : query;
}

function _escapeValue(value: any): string {
	if (isFrag(value)) {
		return value.toSqlString();
	}
	if (Array.isArray(value)) {
		if (!value.length) {
			return "/*emptyArr*/NULL";
		}
		return value.map((item) => _escapeValue(item)).join(",");
	}
	if (Buffer.isBuffer(value)) {
		return `x'${value.toString("hex")}'`;
	}
	if (typeof value === "number" || typeof value === "bigint") {
		return String(value);
	}
	if (typeof value === "string") {
		return mysql.escape(value);
	}
	if (value === true) {
		return "1";
	}
	if (value === false) {
		return "0";
	}
	if (value === null) {
		return "NULL";
	}
	if (value instanceof Date) {
		return `TIMESTAMP'${value.toISOString().replace("T", " ").replace(/(?:\.000)?Z$/, "")}'`;
	}
	throw new Error(`Unsupported value type: ${value}`);
}

function _escapeIdStrict(value: string | string[] | SqlFrag): string {
	if (isFrag(value)) {
		return value.toSqlString();
	}
	if (Array.isArray(value)) {
		return value.map((item) => _escapeIdStrict(item)).join(".");
	}
	return `\`${String(value).replace(/`/g, "``")}\``;
}

type SqlTag = ((strings: TemplateStringsArray, ...values: any[]) => SqlFrag) & {
	id(value: string | string[]): SqlFrag;
	columns(values: string[]): SqlFrag;
	values(values: any[][]): SqlFrag;
};

export const sql: SqlTag = Object.assign(
	(strings: TemplateStringsArray, ...values: any[]) => {
		const out: string[] = [];
		let i = 0;
		for (; i < values.length; ++i) {
			out.push(strings[i], _escapeValue(values[i]));
		}
		out.push(strings[i]);
		return frag(out.join(""));
	},
	{
		id(value: string | string[]) {
			return frag(_escapeIdStrict(value));
		},
		columns(values: string[]) {
			return frag(values.map((value) => _escapeIdStrict(value)).join(", "));
		},
		values(values: any[][]) {
			return frag(values.map((row) => `(${row.map((value) => _escapeValue(value)).join(",")})`).join(",\n"));
		},
	},
);
