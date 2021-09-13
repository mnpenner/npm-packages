import {getStruct, getTableNamesQuery} from "../struct"
import {promises as fs} from "fs"
import {Command, OptType} from "cli-api"
import {createConnection, dbOptions} from "../db"
import {DbColumn, DbTable} from '../dbtypes'
import {Resolvable, resolveValue} from '../utils/resolve'
import * as inflection from 'inflection'
import {longestCommonSuffix} from '../utils/longest-common-substring'
import * as json5 from 'json5'

const dbTsTypeMap: Record<string, Resolvable<string, [DbColumn]>> = {
    enum: col => col.values ? col.values.map(v => json5.stringify(v)).join('|') : 'unknown',
    set: col => col.values ? 'Array<' + col.values.map(v => json5.stringify(v)).join('|') + '>' : 'unknown',
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
    polygon: 'unknown',  // ???
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
        lines.push(`import {sql} from 'mysql3'\n`)
        if(opts.namespace) {
            lines.push(`export namespace ${opts.namespace || columnToKey(opts.database)} {`)
        }

        const tables: DbTable[] = []
        const enums = new Map<string, string[]>()

        for await(const tbl of tblStream) {
            const def = await getStruct(conn, opts.database, tbl.name)
            if(!def) continue
            tables.push(def)

            for(const col of def.columns) {
                if(col.type === 'enum' || col.type === 'set') {
                    const values = JSON.stringify(col.values)
                    const name = inflection.singularize(tbl.name) + '_' + col.name
                    if(enums.has(values)) {
                        enums.get(values)!.push(name)
                    } else {
                        enums.set(values, [name])
                    }
                }
            }
        }
        // console.log(enums)

        let enumCounter = 0
        const enumNames = new Map<string, string>()

        if(opts.enums) {
            for(const [values, colNames] of enums.entries()) {
                const lcs = longestCommonSuffix(colNames) // giving wrong result for booking_passenger_pri_phone_type ???
                const items: string[] = JSON.parse(values)
                const name = lcs ? columnToKey(lcs) : `Unknown${++enumCounter}`
                lines.push(`const enum ${name} {`)
                for(const it of items) {
                    lines.push(`  ${columnToKey(it.toLowerCase())} = ${json5.stringify(it)},`)
                }
                lines.push('}\n')
                enumNames.set(values, name)
            }
        }

        const tblmap = Object.create(null)
        for(const def of tables) {
            const interfaceName = columnToKey(def.name)
            tblmap[inflection.camelize(def.name, false)] = def.name
            lines.push(`export interface ${interfaceName} {`)
            for(const col of def.columns) {
                // if(col.type === 'set') console.log(col)
                let colType = resolveValue(dbTsTypeMap[col.type], col)
                if(!colType) throw new Error(`Unhandled column type "${col.type}"`)
                if(col.type === 'enum' || col.type === 'set') {
                    const valuesStr = JSON.stringify(col.values)
                    if(enumNames.has(valuesStr)) {
                        colType += '|' + enumNames.get(valuesStr)
                        if(col.type === 'set') {
                            colType += '[]'
                        }
                    }
                }
                if(col.nullable) {
                    colType += "|null"
                }
                if(col.comment) {
                    lines.push(`  /** ${col.comment.replace(/^(UNUSED|DEPRECATED)\b/i, '@deprecated')} */`)
                }
                lines.push(`  ${escapeCol(col.name)}: ${colType},`)
            }
            lines.push('}\n')

            if(opts.colmaps) {
                // const map = Object.create(null)
                // for(const col of def.columns) {
                //     map[inflection.camelize(col.name, true)] = col.name
                // }
                // lines.push(`export const ${columnToKey(def.name)}Columns = Object.freeze<Record<string,keyof ${interfaceName}>>(${json5.stringify(map, null, 2)})\n`)

                lines.push(`export const ${columnToKey(def.name)}Columns = Object.freeze({`) // ${json5.stringify(tblmap, null, 2)})\n
                for(const col of def.columns) {
                    let colName = json5.stringify(col.name)
                    if(opts.mysql3) {
                       colName = `sql.id(${colName})`
                    }
                    lines.push(`  ${inflection.camelize(col.name, true)}: ${colName},`)
                }
                lines.push('})\n')
            }
        }

        if(opts.tablemap) {
            lines.push(`export const tbl = Object.freeze({`) // ${json5.stringify(tblmap, null, 2)})\n
            for(const [k, v] of Object.entries(tblmap)) {
                let tblName = json5.stringify(v)
                if(opts.mysql3) {
                    tblName = `sql.id(${tblName})`
                }
                lines.push(`  ${k}: ${tblName},`)
            }
            lines.push('})\n')
        }

        if(opts.namespace) {
            lines.push('}')
        }

        await conn.close()
        await fs.writeFile(args[0], lines.join("\n"))
    },
    flags: [
        {
            name: 'enums',
            description: "Export enums",
        },
        {
            name: 'colmaps',
            alias: ['columnmaps'],
            description: "Export camelCase mappings of column names",
        },
        {
            name: 'tablemap',
            alias: ['tblmap'],
            description: "Export camelCase mappings of column names",
        },
        {
            name: 'mysql3',
            description: "Enable mysql3 compatiability",
        },
    ],
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
    if(/^[A-Z_]+$/.test(name)) name = name.toLowerCase()
    name = inflection.classify(name)
    name = name.replace(/#/g, 'Nbr')
    name = name.replace(/\$/g, 'Dlr')
    // name = Lo.camelCase(name)
    if(/^\d/.test(name)) name = '_' + name
    return name
    return name[0].toUpperCase() + name.slice(1)
}
