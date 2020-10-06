import ora from "ora";
import {ConnectionPool, sql} from "mysql3";
import {getStruct} from "../struct";
import {dump} from "js-yaml";
import {promises as fs} from "fs";
import highlight, {Theme} from "cli-highlight";
import {Command, OptType} from "clap";
import {userInfo} from "os";

const HIGHLIGHT_THEME: Theme = {
    // TODO
}

const cmd: Command = {
    name: "export",
    alias: 'x',
    description: "Export definitions from existing database",
    async execute(opts, args) {
        const spinner = ora().start(`Exporting ${opts.database}`); // https://github.com/sindresorhus/ora/issues/146

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
            spinner.text = `Exporting ${tbl.name}`
            const def = await getStruct(conn,opts.database,tbl.name)
            tables.push(def)
        }
        await conn.close()


        const elapsed = Date.now()-t
        // console.log(`Fetched database structure in ${elapsed} ms`)

        const yaml = dump(tables, {lineWidth: 120, noCompatMode: true})

        if(args.length) {
            await fs.writeFile(args[0], yaml)
            spinner.succeed(`Exported ${opts.database} in ${elapsed} ms`)
        } else {
            spinner.stop()
            console.log(highlight(yaml, {language: 'yaml', ignoreIllegals: true, theme: HIGHLIGHT_THEME}));
        }
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
    ],
    arguments: [
        {
            name: 'outfile',
            type: OptType.OUTPUT_FILE,
            required: false,
            description: "YAML database schema to write",
        }
    ]
}

export default cmd
