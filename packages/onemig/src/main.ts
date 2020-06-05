import {run} from "./cli";
import * as pkg from '../package.json'
import {userInfo} from 'os';
import {OptType} from "./cli/interfaces";
import {ConnectionPool, sql} from "mysql3";
import {dump} from 'js-yaml';
import {promises as fs} from 'fs';
import {getStruct} from "./struct";

// TODO:  generate json schema
//  .\node_modules\.bin/typescript-json-schema .\src\struct.ts OneMig
//  ./node_modules/.bin/ts-json-schema-generator -p .\src\struct.ts

run({
    name: "OneMig",
    version: pkg.version,
    argv0: pkg.name,
    commands: [
        {
            name: "export",
            alias: 'x',
            description: "Export definitions from existing database",
            async execute(opts) {
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


                const tblStream = conn.stream(sql`SELECT 
                        TABLE_NAME 'name'
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLES.TABLE_SCHEMA=${opts.database} AND TABLE_TYPE='BASE TABLE'
                        ORDER BY name
                        `);


                const tables = []
                for await(const tbl of tblStream) {
                    const def = await getStruct(conn,opts.database,tbl.name)
                    tables.push(def)
                }
                await conn.close()

                const elapsed = Date.now()-t
                console.log(`Fetched database structure in ${elapsed} ms`)

                await fs.writeFile(`data/tables.yaml`,dump(tables))

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
            ]
        }
    ]
})
