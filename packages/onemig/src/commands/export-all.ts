import {sql} from "mysql3"
import {Command, OptType} from "clap"
import {createConnection, dbOptions, dbOptionsWithoutDb} from "../db"
import highlight from 'cli-highlight'
import {dump} from 'js-yaml'
import {promises as fs} from 'fs'
import * as Path from 'path'
import {exportDumpUsersToFile, exportTableDataToFile, getTableNames, getTableYaml} from '../struct'
import * as Chalk from 'chalk'


const INTERNAL_DATABASES = new Set([
    'mysql',
    'information_schema',
    'performance_schema',
])

const cmd: Command = {
    name: "export-all",
    alias: 'xa',
    description: "Export all data from host",
    async execute(opts, [outputDir]) {
        // console.log(opts);
        // return
        const startTime = Date.now()
        const conn = await createConnection(opts)

        let skipDbRegex: RegExp|null = null
        if(opts.skipDatabaseRegex) {
            skipDbRegex = new RegExp(opts.skipDatabaseRegex)
        }

        try {
            await fs.mkdir(outputDir,{recursive:true})
            console.log(`Created ${Chalk.underline(outputDir)}`)

            if(!opts.skipUsers) {
                const usersFile = Path.join(outputDir, 'users.yaml')
                await exportDumpUsersToFile(conn, usersFile)
                console.log(`  Wrote ${Chalk.underline(usersFile)}`)
            }

            const databaseNames = (await conn.col<string>(sql`show databases`)).filter(db => {
                if(INTERNAL_DATABASES.has(db)) {
                    return false
                }
                if(skipDbRegex && skipDbRegex.test(db)) {
                    return false
                }
                return true
            })
            for(const dbName of databaseNames) {
                console.log(`  Exporting database ${Chalk.underline(dbName)}`)
                const dbDir = Path.join(outputDir,dbName)
                await fs.mkdir(dbDir)
                const tableNames = await getTableNames(conn, dbName)
                for(const tblName of tableNames) {
                    if(!opts.skipTableSchema) {
                        const tblSchemaFile = Path.join(dbDir, `${tblName}.yaml`)
                        await fs.writeFile(tblSchemaFile, await getTableYaml(conn, dbName, tblName))
                        console.log(`    Wrote ${Chalk.underline(tblSchemaFile)}`)
                    }

                    if(!opts.skipData) {
                        const tblDataFile = Path.join(dbDir, `${tblName}.csv`)
                        await exportTableDataToFile(conn, dbName, tblName, tblDataFile)
                        console.log(`    Wrote ${Chalk.underline(tblDataFile)}`)
                    }
                }
            }
        } finally {
            conn.close()
        }


    },
    options: [
        ...dbOptionsWithoutDb,
        {
            name: 'skip-database-regex',
            alias: [
                // 'skip-database-regexp',
                // 'skip-db-regexp',
                'skip-db-regex',
            ],
            valuePlaceholder: 'regex',
            key: 'skipDatabaseRegex',
            description: "Don't export databases matching this regexp",
        },
    ],
    flags: [
        {
            name: 'skip-users',
            key: 'skipUsers',
            defaultValue: false,
            description: "Don't export users",
        },
        {
            name: 'skip-data',
            key: 'skipData',
            defaultValue: false,
            description: "Don't export table data",
        },
        {
            name: 'skip-table-schema',
            key: 'skipTableSchema',
            defaultValue: false,
            description: "Don't export table schemas",
        },
    ],
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
