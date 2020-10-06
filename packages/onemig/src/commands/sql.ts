import * as yaml from "js-yaml";
import {promises as fs} from "fs";
import highlight from "cli-highlight";
import {Command, OptType} from "clap";
import * as sql from '../utils/sql'
import {DbColumn, DbIndex} from "../dbtypes";


const cmd: Command = {
    name: "sql",
    alias: 's',
    description: "Convert YAML schema back to MySQL",
    async execute(opts, args) {
        const schemaYaml = await fs.readFile(args[0],{encoding:'utf8'})
        const schema = yaml.safeLoad(schemaYaml)

        const lines = [];

        for(const table of schema) {
            lines.push(`CREATE TABLE ${opts.exists ? 'IF NOT EXISTS ' : ''}${sql.escapeId(table.name)} (`)
            const columns = []
            for(const col of table.columns ?? []) {
                columns.push(`  ${sql.escapeId(col.name)} ${getType(col)}`)
            }
            for(const idx of table.indexes ?? []) {
                columns.push(`  ${getIndex(idx)}`)
            }
            lines.push(columns.join(',\n'))
            lines.push(');')
        }


        const sqlOut = lines.map(ln => Array.isArray(ln) ? ln.join('') : ln).join('\n')
        console.log(highlight(sqlOut, {language: 'sql', ignoreIllegals: true}));
    },
    options: [

    ],
    flags: [
        {
            name: 'if-not-exists',
            alias: 'e',
            description: "Add IF NOT EXISTS to CREATE TABLE",
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

function getIndex(idx: DbIndex): string {
    const sb: string[] = [idx.type]
    if(idx.type.toUpperCase() === 'PRIMARY') {
        sb.push('KEY')
    } else if(idx.name) {
        sb.push(sql.escapeId(idx.name))
    }
    sb.push('('+idx.columns.map(sql.escapeId).join(',')+')')
    return sb.join(' ')
}

function getType(col: DbColumn): string {
    const sb: string[] = [col.type]

    if(col.length) {
        sb.push(`(${col.length})`)
    }
    if(col.values) {
        sb.push('('+col.values.map(sql.escapeString).join(',')+')')
    }

    if(col.unsigned) {
        sb.push('unsigned')
    }
    if(col.autoIncrement) {
        sb.push('auto_increment')
    }
    if(col.collation) {
        sb.push('collate',col.collation)
    }
    if(!col.nullable) {
        sb.push('not null')
    }
    return sb.join(' ')
}

export default cmd
