import {getStruct, getTableNamesQuery} from "../struct"
import {promises as fs} from "fs"
import {Command, OptType} from "cli-api"
import {createConnection, dbOptions} from "../db"
import {DbColumn} from '../dbtypes'
import * as Lo from 'lodash'
import {Resolvable, resolveValue} from '../utils/resolve'
import * as inflection from 'inflection'

const dbTsTypeMap: Record<string, Resolvable<string, [DbColumn]>> = {
    enum: col => col.values? col.values.map(v => JSON.stringify(v)).join('|') : 'unknown',
    set: 'string', // maybe?
    tinyint: 'number',
    smallint: 'number',
    mediumint: 'number',
    int: 'number',
    bigint: 'number',
    float: 'number',
    decimal: 'string', // ??
    double: 'number',
    bit: col => {
        if(!col.length || col.length === 1) {
            return 'boolean'
        }
        return 'Buffer'
    },
    char: 'string',
    varchar: 'string',
    binary: 'Buffer',
    varbinary: 'Buffer',
    year: 'number',
    tinytext: 'string',
    text: 'string',
    mediumtext: 'string',
    longtext: 'string',
    tinyblob: 'Buffer',
    blob: 'Buffer',
    mediumblob: 'Buffer',
    longblob: 'Buffer',
    time: 'string',
    datetime: 'string',
    timestamp: 'string',
    date: 'string',
    polygon: 'string',  // ???
}


const cmd: Command = {
    name: "export-typescript",
    alias: 'ts',
    description: "Export TypeScript interfaces",
    async execute(opts, args) {
        const conn = await createConnection({
            ...opts,
        })

        const tblStream = conn.stream<{ name: string }>(getTableNamesQuery(opts.database))
        const lines = []
        lines.push(`declare namespace ${opts.namespace||columnToKey(opts.database)} {`)

        for await(const tbl of tblStream) {
            const def = await getStruct(conn, opts.database, tbl.name)
            if(!def) continue

            lines.push(`interface ${columnToKey(tbl.name)} {`)
            for(const col of def.columns) {
                let colType = resolveValue(dbTsTypeMap[col.type], col)
                if(!colType) throw new Error(`Unhandled column type "${col.type}"`)
                if(col.nullable) {
                    colType += "|null"
                }
                if(col.comment) {
                    lines.push(`  /** ${col.comment.replace(/^(UNUSED|DEPRECATED)\b/i,'@deprecated')} */`)
                }
                lines.push(`  ${escapeCol(col.name)}: ${colType},`)
            }
            lines.push('}\n')
        }
        lines.push('}')

        await conn.close()
        await fs.writeFile(args[0], lines.join("\n"))
    },
    options: [
        ...dbOptions,
        {
            name: 'namespace',
            // alias: 'm',
            description: "Namespace",
            type: OptType.STRING,
            required: false,
        },
    ],
    arguments: [
        {
            name: 'outfile',
            type: OptType.OUTPUT_FILE,
            required: true,
            description: ".d.ts file to write",
        },
    ]
}

export default cmd


function escapeCol(col: string) {
    if(/\W/i.test(col)) {
        return JSON.stringify(col)
    }
    return col
}

function columnToKey(name: string) {
    return inflection.classify(name)
    name = name.replace(/#/g, 'Nbr')
    name = name.replace(/\$/g, 'Dlr')
    name = Lo.camelCase(name)
    if(/^\d/.test(name)) name = '_' + name
    return name[0].toUpperCase() + name.slice(1)
}
