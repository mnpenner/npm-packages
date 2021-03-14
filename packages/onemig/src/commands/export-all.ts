import {sql} from "mysql3"
import {Command, OptType} from "cli-api"
import {createConnection, dbOptions, dbOptionsWithoutDb} from "../db"
import highlight from 'cli-highlight'
import {dump} from 'js-yaml'
import {promises as fs} from 'fs'
import * as Path from 'path'
import {dumpYaml, exportDumpUsersToFile, exportTableDataToFile, getTableNames, getTableYaml} from '../struct'
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

        // TODO: merge from export-all-tgz

        try {
            await fs.mkdir(outputDir,{recursive:true})
            console.log(`Created ${Chalk.underline(outputDir)}`)

            if(!opts.skipUsers) {
                const usersFile = Path.join(outputDir, 'users.yaml')
                await exportDumpUsersToFile(conn, usersFile)
                console.log(`  Wrote ${Chalk.underline(usersFile)}`)
            }

            const databases = (await conn.query<{name:string,defaultCollation:string}>(sql`select SCHEMA_NAME name, DEFAULT_COLLATION_NAME collation from information_schema.SCHEMATA`)).filter(db => {
                if(INTERNAL_DATABASES.has(db.name)) {
                    return false
                }
                if(skipDbRegex && skipDbRegex.test(db.name)) {
                    return false
                }
                return true
            })

            if(!opts.skipDbSchema) {
                const dbFile = Path.join(outputDir, 'databases.yaml')
                await fs.writeFile(dbFile,dumpYaml(databases))
                console.log(`  Wrote ${Chalk.underline(dbFile)}`)
            }

            for(const db of databases) {
                console.log(`  Exporting database ${Chalk.underline(db.name)}`)
                const dbDir = Path.join(outputDir,db.name)
                await fs.mkdir(dbDir)
                const tableNames = await getTableNames(conn, db.name)
                for(const tblName of tableNames) {
                    if(!opts.skipTableSchema) {
                        const tblSchemaFile = Path.join(dbDir, `${tblName}.yaml`)
                        await fs.writeFile(tblSchemaFile, await getTableYaml(conn, db.name, tblName))
                        console.log(`    Wrote ${Chalk.underline(tblSchemaFile)}`)
                    }

                    if(!opts.skipData) {
                        const tblDataFile = Path.join(dbDir, `${tblName}.csv`)
                        await exportTableDataToFile(conn, db.name, tblName, tblDataFile)
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
        {
            name: 'skip-database-schema',
            alias: [
                'skip-db-schema',
            ],
            key: 'skipDbSchema',
            defaultValue: false,
            description: "Don't export database schemas",
        },
        // TODO: add compress/tar.gz option
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
