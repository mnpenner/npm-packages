import ora from "ora";
import {ConnectionPool, escapeId, sql} from "mysql3";
import {getStruct} from "../struct";
import {dump} from "js-yaml";
import {promises as fs} from "fs";
import highlight, {Theme} from "cli-highlight";
import {Command, OptType} from "clap";
import {userInfo} from "os";
import CsvWriter from "../CsvWriter";

const HIGHLIGHT_THEME: Theme = {
    // TODO
}

const cmd: Command = {
    name: "export-data",
    alias: 'xd',
    description: "Export table data in CSV format",
    async execute(opts, args) {
        const spinner = ora().start(`Exporting ${opts.database}`); // https://github.com/sindresorhus/ora/issues/146

        try {
            const t = Date.now()
            const conn = new ConnectionPool({
                user: opts.user,
                password: opts.password,
                host: opts.host,
                database: opts.database,
                port: opts.port,
                printQueries: false,
                connectionLimit: 25,
            })

            let tables: string[]
            if(opts.table) {
                tables = [opts.table]
            } else if(opts.all) {
                const result = await conn.query(sql`SELECT 
                        TABLE_NAME 'name'
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLES.TABLE_SCHEMA=${opts.database} AND TABLE_TYPE='BASE TABLE'
                        ORDER BY name
                        `);
                tables = result.map(r => r.name)
            } else {
                throw new Error("Must specify --table or --all")
            }

            for(const tbl of tables) {
                spinner.text = `Exporting ${tbl}`
                const csv = new CsvWriter(`${args[0]}/${tbl}.csv`)
                try {
                    let first = true
                    for await(const row of conn.stream(sql`select * from ${escapeId(tbl)}`)) {
                        if(first) {
                            // TODO: find a way to write these headers even with 0 records
                            csv.writeLine(Object.keys(row))
                            first = false
                        }
                        csv.writeLine(Object.values(row))
                    }
                } finally {
                    csv.close()
                }
            }

            await conn.close()


            const elapsed = Date.now() - t

            spinner.succeed(`Exported ${opts.database} in ${elapsed} ms`)
            return 0
        } catch(err) {
            spinner.stop()
            throw err
        } finally {
            spinner.stop()
        }
        return 255
    },
    options: [
        {
            name: 'host',
            alias: 'h',
            description: "Connect to the MySQL server on the given host.",
            defaultValue: process.env.DB_HOST ?? 'localhost',
            valuePlaceholder: 'host_name',
        },
        {
            name: 'port',
            alias: 'P',
            description: "For TCP/IP connections, the port number to use.",
            type: OptType.INT,
            defaultValue: process.env.DB_PORT !== undefined ? Number(process.env.DB_PORT) : 3306,
        },
        {
            name: 'database',
            alias: 'D',
            description: "The database to use.",
            valuePlaceholder: 'db_name',
            defaultValue: process.env.DB_NAME,
            required: true
        },
        {
            name: 'user',
            alias: 'u',
            description: "The user name of the MySQL account to use for connecting to the server.",
            defaultValue: () => process.env.DB_USER ?? userInfo().username,
            valuePlaceholder: 'user_name',
        },
        {
            name: 'password',
            alias: 'p',
            description: "The password of the MySQL account used for connecting to the server.",
            defaultValue: process.env.DB_PASSWORD,
            defaultValueText: process.env.DB_PASSWORD !== undefined ? '$DB_PASSWORD' : '(no pasword)',
        },
        {
            // TODO
            name: 'null',
            description: "Value used to represent NULL",
            defaultValue: '\\N',
            defaultValueText: '\\N',
            valuePlaceholder: 'str',
        },
        {
            name: 'table',
            alias: 't',
            valuePlaceholder: 'name',
            description: "Table to export.",
        },
    ],
    flags: [
        {
            name: 'all',
            alias: 'A',
            description: "Export all tables.",
        },
    ],
    arguments: [
        {
            name: 'outdir',
            type: OptType.OUTPUT_DIRECTORY,
            required: true,
            description: "Directory to write tables to",
        }
    ]
}

export default cmd
