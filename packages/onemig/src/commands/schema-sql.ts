import * as yaml from "js-yaml";
import {promises as fs} from "fs";
import highlight from "cli-highlight";
import {Command, OptType} from "cli-api";
import * as sql from '../utils/sql'
import {DbColumn, DbIndex} from "../dbtypes";


const cmd: Command = {
    name: "schema-sql",
    alias: 'ss',
    description: "Convert YAML schema back to MySQL",
    async execute(opts, args) {
        const schemaYaml = await fs.readFile(args[0],{encoding:'utf8'})
        const schema = yaml.loadAll(schemaYaml)

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
    if(col.fracDigits) {
        sb.push(`(${col.fracDigits})`)
    }
    if(col.precision) {
        sb.push(`(${col.precision.join(',')})`)
    }
    if (col.unsigned) {
        sb.push('unsigned')
    }
    if(col.generated || col.genExpr) {
        if(!col.generated || !col.genExpr) throw new Error("Both `generated` and `genExpr` are required")
        sb.push(`GENERATED ALWAYS AS (${col.genExpr})`,col.generated)
    } else {
        // TODO: do all of these belong in else?
        if (col.values) {
            sb.push('(' + col.values.map(sql.escapeString).join(',') + ')')
        }
        if (col.autoIncrement) {
            sb.push('auto_increment')
        }
        if (col.collation) {
            sb.push('collate', col.collation)
        }
        if (!col.nullable) {
            sb.push('not null')
        }
        if(col.default !== undefined) {
            sb.push('DEFAULT',String(col.default))
        }
    }
    if(col.comment) {
        sb.push('COMMENT',sql.escapeString(col.comment))
    }
    if(col.invisible) {
        throw new Error("invisible not implemented")
    }
    return sb.join(' ')
}

export default cmd
