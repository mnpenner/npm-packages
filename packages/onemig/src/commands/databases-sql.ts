import {escapeIdStrict, escapeValue} from "mysql3"
import {Command, OptType} from "cli-api"
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
    name: "databases-sql",
    alias: 'ds',
    description: "Convert users.yaml back into SQL",
    async execute(opts, [inputFile]) {

        const startTime = Date.now()
        const schemaYaml = await fs.readFile(inputFile, {encoding: 'utf8'})
        const schema = yaml.load(schemaYaml)


        let lines: string[] = []


        for(const db of schema) {
            let line = 'CREATE DATABASE ';
            if(opts.exists) {
                line += 'IF NOT EXISTS '
            }
            line += escapeIdStrict(db.name)
            const charset = db.charset ?? db.characterSet ?? db.defaultCharset ?? db.defaultCharacterSet;
            if(charset) {
                line += ` CHARACTER SET ${charset}`
            }
            const collate = db.collation ?? db.defaultCollation ?? db.defaultCollationName;
            if(collate) {
                line += ` COLLATE ${collate}`
            }
            if(db.encrypted != null) {
                line += ` ENCRYPTION ${db.encrypted ? "'Y'" : "'N'"}`
            }
            line += ';'
            lines.push(line)
        }



        const sqlOut = lines.map(ln => Array.isArray(ln) ? ln.join('') : ln).join('\n')
        console.log(highlight(sqlOut, {language: 'sql', ignoreIllegals: true}))

    },
    options: [
        ...dbOptionsWithoutDb,

    ],
    flags: [
        {
            name: 'if-not-exists',
            alias: 'e',
            description: "Add IF NOT EXISTS to CREATE DATABASE",
            key: 'exists',
        }
    ],
    arguments: [
        {
            name: 'schema_file',
            type: OptType.INPUT_FILE,
            required: true,
            description: "YAML file to load",
        }
    ]
}

export default cmd
