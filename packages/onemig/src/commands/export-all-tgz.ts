import {sql} from "mysql3"
import {Command, OptType} from "cli-api"
import {createConnection, dbOptions, dbOptionsWithoutDb} from "../db"
import highlight from 'cli-highlight'
import {dump} from 'js-yaml'
import {promises as fs} from 'fs'
import * as Path from 'path'
import {dumpYaml, exportDumpUsersToFile, exportTableDataToFile, getDatabases, getTableNames, getTableYaml, getUsersYaml} from '../struct'
import * as Chalk from 'chalk'
import * as Tar from 'tar-stream'
import * as Zlib from 'zlib'
import * as FileSys from 'fs'
import MemoryStream from '../utils/memory-stream'
import * as pkg from '../../package.json'

const INTERNAL_DATABASES = new Set([
    'mysql',
    'information_schema',
    'performance_schema',
])

const cmd: Command = {
    name: "export-all-tgz",
    alias: 'xaz',
    description: "Export all data from host",
    async execute(opts, args) {
        // console.log(opts);
        // return


        let skipDbRegex: RegExp|null = null
        if(opts.skipDatabaseRegex) {
            skipDbRegex = new RegExp(opts.skipDatabaseRegex)
        }

        const pack = Tar.pack()

        pack.pipe(Zlib.createGzip({level: Zlib.constants.Z_BEST_COMPRESSION})).pipe(FileSys.createWriteStream(opts.file))
        console.log(`Writing to ${Chalk.underline(opts.file)}`)

        // TODO: write metadata into file (package.json version and hg hash and date and server host name and server version...)


        const startTime = new Date
        const pool = await createConnection(opts)
        try {
            if(!opts.skipUsers) {
                const usersFile = 'users.yaml'
                pack.entry({name: usersFile}, await getUsersYaml(pool))
                console.log(`  Wrote ${Chalk.underline(usersFile)}`)
            }

            const databases = (await getDatabases(pool)).filter(db => {
                if(INTERNAL_DATABASES.has(db.name)) {
                    return false
                }
                if(skipDbRegex && skipDbRegex.test(db.name)) {
                    return false
                }
                return true
            })

            if(!opts.skipDbSchema) {
                const dbFile = 'databases.yaml'
                pack.entry({name: dbFile}, dumpYaml(databases))
                console.log(`  Wrote ${Chalk.underline(dbFile)}`)
            }

            for(const db of databases) {
                console.log(`  Exporting database ${Chalk.underline(db.name)}`)
                const tableNames = await getTableNames(pool, db.name)
                for(const tblName of tableNames) {
                    if(!opts.skipTableSchema) {
                        const tblSchemaFile = Path.join(db.name, `${tblName}.yaml`)
                        pack.entry({name: tblSchemaFile}, await getTableYaml(pool, db.name, tblName))
                        console.log(`    Wrote ${Chalk.underline(tblSchemaFile)}`)
                    }

                    if(!opts.skipData) {
                        const tblDataFile = Path.join(db.name, `${tblName}.csv`)
                        const memStream = new MemoryStream()
                        await exportTableDataToFile(pool, db.name, tblName, memStream)
                        pack.entry({name: tblDataFile}, memStream.toString())

                        console.log(`    Wrote ${Chalk.underline(tblDataFile)}`)
                    }
                }
            }

            const elapsed = Date.now() - startTime.valueOf()
            const metadataFile = 'metadata.yaml'
            const conn = await pool.getConnection()
            try {
                pack.entry({name: 'metadata.yaml'}, dumpYaml({
                    onemigVersion: pkg.version,
                    exportDate: startTime.toISOString(),
                    exportDuration: elapsed,
                    user: opts.user,
                    host: opts.host,
                    serverVersion: conn.serverVersion(),
                }))
            } finally {
                conn.release()
            }
            console.log(`  Wrote ${Chalk.underline(metadataFile)}`)
        } finally {
            pool.close()
            pack.finalize()
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
        {
            name: 'file',
            alias: 'f',
            type: OptType.OUTPUT_FILE,
            required: true,
            description: ".tar.gz file to write",
        }
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
    ],
    arguments: [

    ]
}

export default cmd
