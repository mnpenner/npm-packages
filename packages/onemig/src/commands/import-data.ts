import {escapeId, sql} from "mysql3";
import {Command, OptType} from "clap";
import CsvWriter, {NULL_STR} from "../CsvWriter";
import {createConnection, dbOptions} from "../db";
import * as Chalk from "chalk";
import * as Path from 'path'
import {getStruct} from "../struct";
import fs from "fs";
import csvParse from 'csv-parse'
import {printSql} from "../util";
import {DbColumn, DbColumnType} from "../dbtypes";

const cmd: Command = {
    name: "import-data",
    alias: 'id',
    description: "Export table data in CSV format",
    async execute(opts, args) {
        const table = opts.table ?? Path.parse(opts.filename).name

        console.log(`Importing file ${Chalk.yellow(opts.filename)} into table ${Chalk.magenta(table)}`);

        const startTime = Date.now()
        const conn = createConnection(opts)

        const def = await getStruct(conn,opts.database,table)
        if(!def) throw new Error(`Could not get definition for table ${table}`)

        const colMap = Object.fromEntries(def.columns.map(({name,...def}) => [name,def]))

        // console.log(colMap);return

        const fileStream = fs.createReadStream(opts.filename);
        const csvParser = fileStream.pipe(csvParse({
            columns: true,
        }))

        let batch = []
        let columns;
        let rowCount = 0
        for await(const row of csvParser) {
            if(!columns) {
                columns = Object.keys(row).filter(c => colMap[c] && !colMap[c].generated)
                if(!columns.length) throw new Error("No matching columns found")
            }
            const ins: any[] = []
            for(const colName of columns) {
                const colDef = colMap[colName];
                if(!colDef) throw new Error(`Column ${colName} not found in table ${table}`)
                let value = row[colName]
                if(colDef.type === DbColumnType.BINARY) {
                    value = Buffer.from(value,'base64')
                }
                if(colDef.nullable && value === NULL_STR) {
                    value = null
                }
                ins.push(value)
            }

            batch.push(ins)
            if(batch.length >= opts.batchSize) {
                await conn.exec(sql`insert into ${sql.id(table)} (${sql.columns(columns)}) values ${sql.values(batch)}`)
                process.stdout.write('.')
                batch = []
            }
            ++rowCount
        }
        if(batch.length) {
            await conn.exec(sql`insert into ${sql.id(table)} (${sql.columns(columns)}) values ${sql.values(batch)}`)
            process.stdout.write('.')
        }
        console.log()

        const elapsed = Date.now() - startTime
        console.log(`Imported ${Chalk.cyan(rowCount)} rows from ${Chalk.yellow(opts.filename)} into ${Chalk.magenta(table)} in ${Chalk.green(elapsed)}ms`)
        return 0

    },
    options: [
        ...dbOptions,
        {
            name: 'filename',
            alias: 'f',
            description: "CSV file to import",
            required: true,
        },
        {
            name: 'table',
            alias: 't',
            description: "Table to import into",
            required: false,
        },
        {
            name: 'batch-size',
            key: 'batchSize',
            description: "Table to import into",
            defaultValue: 1000,
            type: OptType.INT,
        },
    ],

}

export default cmd
