import ora from "ora";
import {ConnectionPool, sql} from "mysql3";
import {getStruct} from "../struct";
import {dump} from "js-yaml";
import {promises as fs} from "fs";
import highlight, {Theme} from "cli-highlight";
import {Command, OptType} from "clap";
import {userInfo} from "os";
import {createConnection, dbOptions} from "../db";

const HIGHLIGHT_THEME: Theme = {
    // TODO
}

const cmd: Command = {
    name: "export-schema",
    alias: 'xs',
    description: "Export table definitions from existing database",
    async execute(opts, args) {
        const spinner = ora().start(`Exporting ${opts.database}`); // https://github.com/sindresorhus/ora/issues/146

        const t = Date.now()

        const conn = await createConnection({
            ...opts,
            // printQueries: false,
        })

        const tblStream = conn.stream<{name:string}>(sql`SELECT 
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

        const yaml =  tables.map(t => dump(t, {lineWidth: 120, noCompatMode: true})).join('---\n')

        if(args.length) {
            await fs.writeFile(args[0], yaml)
            spinner.succeed(`Exported ${opts.database} in ${elapsed} ms`)
        } else {
            spinner.stop()
            console.log(highlight(yaml, {language: 'yaml', ignoreIllegals: true, theme: HIGHLIGHT_THEME}));
        }
    },
    options: [
        ...dbOptions,
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
