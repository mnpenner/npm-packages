import {sql} from "mysql3"
import {Command, OptType} from "clap"
import {createConnection, dbOptions, dbOptionsWithoutDb} from "../db"
import highlight from 'cli-highlight'
import {dump} from 'js-yaml'
import {promises as fs} from 'fs'
import * as Path from 'path'
import {exportTableDataToFile, getTableNames, getTableYaml} from '../struct'
import * as Chalk from 'chalk'

const cmd: Command = {
    name: "export-all",
    alias: 'xa',
    description: "Export all data from host",
    async execute(opts, [outputDir]) {
        const startTime = Date.now()
        const conn = await createConnection(opts)
        try {
            await fs.mkdir(outputDir,{recursive:true})
            console.log(`Created ${Chalk.underline(outputDir)}`)

            const databaseNames = (await conn.col<string>(sql`show databases`)).filter(db => db !== 'mysql' && db !== 'information_schema')
            for(const dbName of databaseNames) {
                console.log(`  Exporting database ${Chalk.underline(dbName)}`)
                const dbDir = Path.join(outputDir,dbName)
                await fs.mkdir(dbDir)
                const tableNames = await getTableNames(conn, dbName)
                for(const tblName of tableNames) {
                    const tblSchemaFile = Path.join(dbDir,`${tblName}.yaml`)
                    await fs.writeFile(tblSchemaFile, await getTableYaml(conn, dbName, tblName))
                    console.log(`    Wrote ${Chalk.underline(tblSchemaFile)}`)

                    const tblDataFile = Path.join(dbDir,`${tblName}.csv`)
                    await exportTableDataToFile(conn,dbName,tblName,tblDataFile)
                    console.log(`    Wrote ${Chalk.underline(tblDataFile)}`)
                }
            }
        } finally {
            conn.close()
        }


    },
    options: [
        ...dbOptionsWithoutDb,

    ],
    flags: [],
    arguments: [
        {
            name: 'outdir',
            type: OptType.EMPTY_DIRECTORY,
            required: true,
            description: "Directory to write data to",
        }
    ]
}

export default cmd
