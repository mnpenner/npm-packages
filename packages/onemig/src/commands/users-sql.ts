import {escapeIdStrict, escapeValue} from "mysql3"
import {Command, OptType} from "clap"
import {dbOptions, dbOptionsWithoutDb} from "../db"
import highlight from 'cli-highlight'
import * as yaml from 'js-yaml'
import {promises as fs} from 'fs'




function makeGrant(privileges: string | string[] | null) {
    if (!privileges?.length) {
        return 'USAGE'
    }
    if (Array.isArray(privileges)) {
        return privileges.map(p => p.trim().toUpperCase().replace(/_/g,' ')).join(', ')
    }
    const normPriv = privileges.trim().toUpperCase().replace(/\s+/g,'_')
    if (normPriv === 'NONE' || normPriv === 'USAGE' || normPriv === 'NO_PRIVILEGES') {
        return 'USAGE'
    }
    if (normPriv === 'ALL' || normPriv === 'ALL_PRIVILEGES') {
        return 'ALL PRIVILEGES'
    }
    throw new Error(`Bad privileges: ${privileges}`)

}

const cmd: Command = {
    name: "users-sql",
    alias: 'us',
    description: "Convert users.yaml back into SQL",
    async execute(opts, args) {

        const startTime = Date.now()
        const schemaYaml = await fs.readFile(args[0], {encoding: 'utf8'})
        const schema = yaml.load(schemaYaml)

        // console.log(schema)

        let lines: string[] = []

        for (const user of schema) {
            for (const host of toArray(user.host ?? user.hosts)) {

                const [privs,grant] = cleanPrivileges(user.privileges ?? user.privs)
                let sqlString = 'GRANT ' + makeGrant(privs)


                sqlString += ` ON *.* TO ${escapeValue(user.name)}@${escapeValue(host)}`
                if (user.password) {
                    sqlString += ` IDENTIFIED BY PASSWORD ${escapeValue(user.password)}`
                }
                if (user.grantOption || grant) {
                    sqlString += ' WITH GRANT OPTION'
                }

                lines.push(sqlString + ';')

                const dbPrivs = user.databasePrivileges ?? user.databasePrivs ?? user.dbPrivs ?? user.dbPrivileges;
                if (dbPrivs) {
                    for (const [dbName, privileges] of Object.entries(dbPrivs)) {
                        const [privs,grant] = cleanPrivileges(privileges)
                        lines.push(`GRANT ${makeGrant(privs)} ON ${escapeIdStrict(dbName)}.* TO ${escapeValue(user.name)}@${escapeValue(host)}${grant ? ' WITH GRANT OPTION':''};`)
                    }
                }
                const tblPrivs = user.tablePrivileges ?? user.tblPrivs ?? user.tablePrivs ?? user.tblPrivileges;
                if(tblPrivs) {
                    for(const db of Object.keys(tblPrivs)) {
                        for(const tbl of Object.keys(tblPrivs[db])) {
                            const [privs,grant] = cleanPrivileges(tblPrivs[db][tbl])
                            lines.push(`GRANT ${makeGrant(privs)} ON ${escapeIdStrict(db)}.${escapeIdStrict(tbl)} TO ${escapeValue(user.name)}@${escapeValue(host)}${grant ? ' WITH GRANT OPTION':''};`)
                        }
                    }
                }
            }
        }


        const sqlOut = lines.map(ln => Array.isArray(ln) ? ln.join('') : ln).join('\n')
        console.log(highlight(sqlOut, {language: 'sql', ignoreIllegals: true}))

    },
    options: [
        ...dbOptionsWithoutDb,

    ],
    flags: [],
    arguments: [
        {
            name: 'schema_file',
            type: OptType.INPUT_FILE,
            required: true,
            description: "YAML file to load",
        }
    ]
}

function cleanPrivileges(privileges: string|string[]): [privileges:string[]|string|null,grantOption:boolean] {
    if(!privileges?.length) return [null,false]

    const privArray = toArray(privileges)
    for(let i=0; i<privArray.length; ++i) {
        if(/[\s_]*(WITH[\s_]+)?GRANT([\s_]+OPTION)?[\s_]*/i.test(privArray[i])) {
            privArray.splice(i,1)
            return [privArray,true]
        }
    }
    return [privileges,false]
}

function spliceOut(arr: string[], needle:string): boolean {
    const i = arr.indexOf(needle)
    if(i !== -1) {
        arr.splice(i,1)
        return true
    }
    return false
}

function toArray<T>(x: T | T[]): T[] {
    if (!x) return []
    if (Array.isArray(x)) return x
    return [x]
}

export default cmd

// GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, RELOAD, SHUTDOWN, PROCESS, FILE, REFERENCES, INDEX, ALTER, SHOW DATABASES, SUPER, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, REPLICATION SLAVE, REPLICATION CLIENT, CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, CREATE USER, EVENT, TRIGGER, DELETE HISTORY ON *.* TO 'debian-sys-maint'@'localhost' IDENTIFIED BY PASSWORD '*1199B975154D0BD469F8EA4215BBA1A92E9543BC' WITH GRANT OPTION
