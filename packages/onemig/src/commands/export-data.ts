import {escapeId, sql} from "mysql3";
import {Command, OptType} from "clap";
import CsvWriter from "../CsvWriter";
import {createConnection, dbOptions} from "../db";
import * as Chalk from "chalk";


const cmd: Command = {
    name: "export-data",
    alias: 'xd',
    description: "Export table data in CSV format",
    async execute(opts, args) {
        console.log(`Exporting database ${Chalk.cyan(opts.database)} ...`);


        const startTime = Date.now()
        const conn = createConnection(opts)

        let tables: string[]
        if (opts.table) {
            tables = [opts.table]
        } else if (opts.all) {
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

        for (const tbl of tables) {
            process.stdout.write(`  Exporting table ${Chalk.yellow(tbl)} ...`)
            const tblTime = Date.now()
            const csv = new CsvWriter(`${args[0]}/${tbl}.csv`)
            try {
                let first = true
                for await(const row of conn.stream(sql`select * from ${escapeId(tbl)}`)) {
                    if (first) {
                        // TODO: find a way to write these headers even with 0 records
                        csv.writeLine(Object.keys(row))
                        first = false
                    }
                    csv.writeLine(Object.values(row))
                }
            } finally {
                csv.close()
            }
            process.stdout.write(` ${Chalk.green(Date.now() - tblTime)}ms\n`)
        }

        await conn.close()


        const elapsed = Date.now() - startTime

        console.log(`Exported ${Chalk.cyan(opts.database)} in ${Chalk.green(elapsed)}ms`)
        return 0

    },
    options: [
        ...dbOptions,
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
            valuePlaceholder: 'table_name',
            description: "Table to export",
        },
    ],
    flags: [
        {
            name: 'all',
            alias: 'A',
            description: "Export all tables",
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
