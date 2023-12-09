import {ArrayOptions, SchemaOptions, Type, UnsafeOptions, TLiteral, TUnion, TEnum, TEnumKey} from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import * as FileSys from 'fs'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import * as Yaml from 'js-yaml'
import pkgJson from '../package.json'
import {isPojo} from '@mnpenner/is-type'

// type StringEnumOptions = Omit<UnsafeOptions, 'type' | 'enum'>

// const StringEnum = <T extends string[]>(values: [...T], options?: StringEnumOptions) => Type.Unsafe<T[number]>({
//     ...options,
//     type: 'string',
//     enum: values,
// })

// type IntoStringLiteralUnion<T> = {[K in keyof T]: T[K] extends string ? TLiteral<T[K]>: never }
//
// export function StringEnum<T extends string[]>(values: [...T]): TUnion<IntoStringLiteralUnion<T>> {
//     return {
//         enum: [...values],
//         type: 'string',
//     } as any // note: this is also ok. But just be aware that the properties of the
//              // underlying schema will show the `anyOf` and not the `enum`. This
//              // is generally ok if you don't need to reflect on the schema.
// }
//
// type StringLiteralOptions<T> = {[K in keyof T]: T[K] extends string ? TEnumKey: never }
//
//
// export function StringLiteralEnum<T extends (string)[]>(values: [...T]): TEnum<StringLiteralOptions<T>> {
//     const options = values.reduce((acc, c) => ({ ...acc, [c]: c } ), {}) as StringLiteralOptions<T>
//     return Type.Enum(options as any) as any
// }


const AnyOf = <T extends any[]>(values: [...T], options?: SchemaOptions) => Type.Union(values.map(val => Type.Literal(val)), options)

type SetTypeOptions = Omit<ArrayOptions, 'uniqueItems'>

const StringSet = (options: SetTypeOptions) => Type.Array(Type.String(), {
    ...options,
    uniqueItems: true,
})

const OptionalString = Type.Optional(Type.String())

const TextCollation = AnyOf([
    "armscii8_bin",
    "armscii8_general_ci",
    "armscii8_general_nopad_ci",
    "armscii8_nopad_bin",
    "ascii_bin",
    "ascii_general_ci",
    "ascii_general_nopad_ci",
    "ascii_nopad_bin",
    "big5_bin",
    "big5_chinese_ci",
    "big5_chinese_nopad_ci",
    "big5_nopad_bin",
    "binary",
    "cp1250_bin",
    "cp1250_croatian_ci",
    "cp1250_czech_cs",
    "cp1250_general_ci",
    "cp1250_general_nopad_ci",
    "cp1250_nopad_bin",
    "cp1250_polish_ci",
    "cp1251_bin",
    "cp1251_bulgarian_ci",
    "cp1251_general_ci",
    "cp1251_general_cs",
    "cp1251_general_nopad_ci",
    "cp1251_nopad_bin",
    "cp1251_ukrainian_ci",
    "cp1256_bin",
    "cp1256_general_ci",
    "cp1256_general_nopad_ci",
    "cp1256_nopad_bin",
    "cp1257_bin",
    "cp1257_general_ci",
    "cp1257_general_nopad_ci",
    "cp1257_lithuanian_ci",
    "cp1257_nopad_bin",
    "cp850_bin",
    "cp850_general_ci",
    "cp850_general_nopad_ci",
    "cp850_nopad_bin",
    "cp852_bin",
    "cp852_general_ci",
    "cp852_general_nopad_ci",
    "cp852_nopad_bin",
    "cp866_bin",
    "cp866_general_ci",
    "cp866_general_nopad_ci",
    "cp866_nopad_bin",
    "cp932_bin",
    "cp932_japanese_ci",
    "cp932_japanese_nopad_ci",
    "cp932_nopad_bin",
    "dec8_bin",
    "dec8_nopad_bin",
    "dec8_swedish_ci",
    "dec8_swedish_nopad_ci",
    "eucjpms_bin",
    "eucjpms_japanese_ci",
    "eucjpms_japanese_nopad_ci",
    "eucjpms_nopad_bin",
    "euckr_bin",
    "euckr_korean_ci",
    "euckr_korean_nopad_ci",
    "euckr_nopad_bin",
    "gb2312_bin",
    "gb2312_chinese_ci",
    "gb2312_chinese_nopad_ci",
    "gb2312_nopad_bin",
    "gbk_bin",
    "gbk_chinese_ci",
    "gbk_chinese_nopad_ci",
    "gbk_nopad_bin",
    "geostd8_bin",
    "geostd8_general_ci",
    "geostd8_general_nopad_ci",
    "geostd8_nopad_bin",
    "greek_bin",
    "greek_general_ci",
    "greek_general_nopad_ci",
    "greek_nopad_bin",
    "hebrew_bin",
    "hebrew_general_ci",
    "hebrew_general_nopad_ci",
    "hebrew_nopad_bin",
    "hp8_bin",
    "hp8_english_ci",
    "hp8_english_nopad_ci",
    "hp8_nopad_bin",
    "keybcs2_bin",
    "keybcs2_general_ci",
    "keybcs2_general_nopad_ci",
    "keybcs2_nopad_bin",
    "koi8r_bin",
    "koi8r_general_ci",
    "koi8r_general_nopad_ci",
    "koi8r_nopad_bin",
    "koi8u_bin",
    "koi8u_general_ci",
    "koi8u_general_nopad_ci",
    "koi8u_nopad_bin",
    "latin1_bin",
    "latin1_danish_ci",
    "latin1_general_ci",
    "latin1_general_cs",
    "latin1_german1_ci",
    "latin1_german2_ci",
    "latin1_nopad_bin",
    "latin1_spanish_ci",
    "latin1_swedish_ci",
    "latin1_swedish_nopad_ci",
    "latin2_bin",
    "latin2_croatian_ci",
    "latin2_czech_cs",
    "latin2_general_ci",
    "latin2_general_nopad_ci",
    "latin2_hungarian_ci",
    "latin2_nopad_bin",
    "latin5_bin",
    "latin5_nopad_bin",
    "latin5_turkish_ci",
    "latin5_turkish_nopad_ci",
    "latin7_bin",
    "latin7_estonian_cs",
    "latin7_general_ci",
    "latin7_general_cs",
    "latin7_general_nopad_ci",
    "latin7_nopad_bin",
    "macce_bin",
    "macce_general_ci",
    "macce_general_nopad_ci",
    "macce_nopad_bin",
    "macroman_bin",
    "macroman_general_ci",
    "macroman_general_nopad_ci",
    "macroman_nopad_bin",
    "sjis_bin",
    "sjis_japanese_ci",
    "sjis_japanese_nopad_ci",
    "sjis_nopad_bin",
    "swe7_bin",
    "swe7_nopad_bin",
    "swe7_swedish_ci",
    "swe7_swedish_nopad_ci",
    "tis620_bin",
    "tis620_nopad_bin",
    "tis620_thai_ci",
    "tis620_thai_nopad_ci",
    "ucs2_bin",
    "ucs2_croatian_ci",
    "ucs2_croatian_mysql561_ci",
    "ucs2_czech_ci",
    "ucs2_danish_ci",
    "ucs2_esperanto_ci",
    "ucs2_estonian_ci",
    "ucs2_general_ci",
    "ucs2_general_mysql500_ci",
    "ucs2_general_nopad_ci",
    "ucs2_german2_ci",
    "ucs2_hungarian_ci",
    "ucs2_icelandic_ci",
    "ucs2_latvian_ci",
    "ucs2_lithuanian_ci",
    "ucs2_myanmar_ci",
    "ucs2_nopad_bin",
    "ucs2_persian_ci",
    "ucs2_polish_ci",
    "ucs2_roman_ci",
    "ucs2_romanian_ci",
    "ucs2_sinhala_ci",
    "ucs2_slovak_ci",
    "ucs2_slovenian_ci",
    "ucs2_spanish2_ci",
    "ucs2_spanish_ci",
    "ucs2_swedish_ci",
    "ucs2_thai_520_w2",
    "ucs2_turkish_ci",
    "ucs2_unicode_520_ci",
    "ucs2_unicode_520_nopad_ci",
    "ucs2_unicode_ci",
    "ucs2_unicode_nopad_ci",
    "ucs2_vietnamese_ci",
    "ujis_bin",
    "ujis_japanese_ci",
    "ujis_japanese_nopad_ci",
    "ujis_nopad_bin",
    "utf16_bin",
    "utf16_croatian_ci",
    "utf16_croatian_mysql561_ci",
    "utf16_czech_ci",
    "utf16_danish_ci",
    "utf16_esperanto_ci",
    "utf16_estonian_ci",
    "utf16_general_ci",
    "utf16_general_nopad_ci",
    "utf16_german2_ci",
    "utf16_hungarian_ci",
    "utf16_icelandic_ci",
    "utf16_latvian_ci",
    "utf16_lithuanian_ci",
    "utf16_myanmar_ci",
    "utf16_nopad_bin",
    "utf16_persian_ci",
    "utf16_polish_ci",
    "utf16_roman_ci",
    "utf16_romanian_ci",
    "utf16_sinhala_ci",
    "utf16_slovak_ci",
    "utf16_slovenian_ci",
    "utf16_spanish2_ci",
    "utf16_spanish_ci",
    "utf16_swedish_ci",
    "utf16_thai_520_w2",
    "utf16_turkish_ci",
    "utf16_unicode_520_ci",
    "utf16_unicode_520_nopad_ci",
    "utf16_unicode_ci",
    "utf16_unicode_nopad_ci",
    "utf16_vietnamese_ci",
    "utf16le_bin",
    "utf16le_general_ci",
    "utf16le_general_nopad_ci",
    "utf16le_nopad_bin",
    "utf32_bin",
    "utf32_croatian_ci",
    "utf32_croatian_mysql561_ci",
    "utf32_czech_ci",
    "utf32_danish_ci",
    "utf32_esperanto_ci",
    "utf32_estonian_ci",
    "utf32_general_ci",
    "utf32_general_nopad_ci",
    "utf32_german2_ci",
    "utf32_hungarian_ci",
    "utf32_icelandic_ci",
    "utf32_latvian_ci",
    "utf32_lithuanian_ci",
    "utf32_myanmar_ci",
    "utf32_nopad_bin",
    "utf32_persian_ci",
    "utf32_polish_ci",
    "utf32_roman_ci",
    "utf32_romanian_ci",
    "utf32_sinhala_ci",
    "utf32_slovak_ci",
    "utf32_slovenian_ci",
    "utf32_spanish2_ci",
    "utf32_spanish_ci",
    "utf32_swedish_ci",
    "utf32_thai_520_w2",
    "utf32_turkish_ci",
    "utf32_unicode_520_ci",
    "utf32_unicode_520_nopad_ci",
    "utf32_unicode_ci",
    "utf32_unicode_nopad_ci",
    "utf32_vietnamese_ci",
    "utf8_bin",
    "utf8_croatian_ci",
    "utf8_croatian_mysql561_ci",
    "utf8_czech_ci",
    "utf8_danish_ci",
    "utf8_esperanto_ci",
    "utf8_estonian_ci",
    "utf8_general_ci",
    "utf8_general_mysql500_ci",
    "utf8_general_nopad_ci",
    "utf8_german2_ci",
    "utf8_hungarian_ci",
    "utf8_icelandic_ci",
    "utf8_latvian_ci",
    "utf8_lithuanian_ci",
    "utf8_myanmar_ci",
    "utf8_nopad_bin",
    "utf8_persian_ci",
    "utf8_polish_ci",
    "utf8_roman_ci",
    "utf8_romanian_ci",
    "utf8_sinhala_ci",
    "utf8_slovak_ci",
    "utf8_slovenian_ci",
    "utf8_spanish2_ci",
    "utf8_spanish_ci",
    "utf8_swedish_ci",
    "utf8_thai_520_w2",
    "utf8_turkish_ci",
    "utf8_unicode_520_ci",
    "utf8_unicode_520_nopad_ci",
    "utf8_unicode_ci",
    "utf8_unicode_nopad_ci",
    "utf8_vietnamese_ci",
    "utf8mb4_bin",
    "utf8mb4_croatian_ci",
    "utf8mb4_croatian_mysql561_ci",
    "utf8mb4_czech_ci",
    "utf8mb4_danish_ci",
    "utf8mb4_esperanto_ci",
    "utf8mb4_estonian_ci",
    "utf8mb4_general_ci",
    "utf8mb4_general_nopad_ci",
    "utf8mb4_german2_ci",
    "utf8mb4_hungarian_ci",
    "utf8mb4_icelandic_ci",
    "utf8mb4_latvian_ci",
    "utf8mb4_lithuanian_ci",
    "utf8mb4_myanmar_ci",
    "utf8mb4_nopad_bin",
    "utf8mb4_persian_ci",
    "utf8mb4_polish_ci",
    "utf8mb4_roman_ci",
    "utf8mb4_romanian_ci",
    "utf8mb4_sinhala_ci",
    "utf8mb4_slovak_ci",
    "utf8mb4_slovenian_ci",
    "utf8mb4_spanish2_ci",
    "utf8mb4_spanish_ci",
    "utf8mb4_swedish_ci",
    "utf8mb4_thai_520_w2",
    "utf8mb4_turkish_ci",
    "utf8mb4_unicode_520_ci",
    "utf8mb4_unicode_520_nopad_ci",
    "utf8mb4_unicode_ci",
    "utf8mb4_unicode_nopad_ci",
    "utf8mb4_vietnamese_ci"
])

const DbColumnType = AnyOf([
    "bigint",
    "binary",
    "bit",
    "blob",
    "boolean",
    "char",
    "char byte",
    "date", "datetime",
    "dec",
    "decimal",
    "double",
    "double precision",
    "enum",
    "fixed",
    "float",
    "geometry",
    "geometrycollection",
    "int",
    "integer",
    "json",
    "linestring",
    "longblob",
    "longtext",
    "mediumblob",
    "mediumint",
    "mediumtext",
    "multilinestring",
    "multipoint",
    "multipolygon",
    "numeric",
    "point",
    "polygon",
    "real",
    "set",
    "smallint",
    "text",
    "time",
    "timestamp",
    "tinyblob",
    "tinyint",
    "tinytext",
    "varbinary",
    "varchar",
    "year"
])

const DbIndexType = AnyOf([
    "BTREE",
    "INDEX",
    "PRIMARY",
    "UNIQUE",
    "HASH"
])

const DbReferenceOption = AnyOf([
    "CASCADE",
    "NO ACTION",
    "RESTRICT",
    "SET DEFAULT",
    "SET NULL"
], {
    title: "Foreign key reference action",
    description: "https://mariadb.com/kb/en/foreign-keys/",
})

const JSON_SCHEMA_VERSION = "http://json-schema.org/draft-07/schema#"
const SCHEMA_ID = `${pkgJson.name}@${pkgJson.version}`

const DbColumn = Type.Object({
    name: Type.String({
        minLength: 1,
        maxLength: 64,
    }),
    type: DbColumnType,  // TODO: be more strict about which props go with which type
    comment: OptionalString,
    default: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    collation: Type.Optional(TextCollation),
    autoIncrement: Type.Optional(Type.Boolean()),
    onUpdate: Type.Optional(AnyOf(["current_timestamp()"])),
    generated: Type.Optional(AnyOf([
        "PERSISTENT",
        "STORED",
        "VIRTUAL"
    ])),
    genExpr: OptionalString,
    fracDigits: Type.Optional(Type.Number({
        minimum: 0,
        maximum: 6,
        title: "Fractional seconds digits",
    })),
    values: Type.Optional(StringSet({minItems: 1})),
    zerofill: Type.Optional(Type.Union([Type.Number(), Type.Boolean()], {title: "Zero-fill"})),
    unsigned: Type.Optional(Type.Boolean()),
    precision: Type.Optional(Type.Tuple([
        Type.Number({
            title: 'digits (M)',
            minimum: 0,
            maximum: 65,
        }),
        Type.Number({
            title: 'decimals (D)',
            minimum: 0,
            maximum: 38,
            default: 10,
        }),
    ], {
        description: "https://mariadb.com/kb/en/decimal/",
    })),
    length: Type.Optional(Type.Number()),
    nullable: Type.Optional(Type.Boolean()),
    invisible: Type.Optional(Type.Boolean({
        title: "invisible",
        description: "These columns will then not be listed in the results of a SELECT * statement, nor do they need to be assigned a value in an INSERT statement, unless INSERT explicitly mentions them by name.",
    })),
}, {
    title: "Database column",
})

const DbTableOptions = Type.Object({
    engine: OptionalString,
    comment: OptionalString,
    collation: Type.Optional(TextCollation),
}, {
    title: "Table options"
})


const DbIndex = Type.Object({
    name: Type.String(),
    type: DbIndexType,
    columns: Type.Array(Type.String()),
    comment: OptionalString,
}, {
    title: "Column index"
})

const DbForeignKey = Type.Object({
    name: Type.String(),
    columns: Type.Array(Type.String(), {minItems: 1}),
    refTable: Type.String(),
    refColumns: Type.Array(Type.String(), {minItems: 1}),
    onDelete: DbReferenceOption,
    onUpdate: DbReferenceOption,
    refDatabase: OptionalString,
}, {
    title: "Foreign key definition",
})

const DbTrigger = Type.Object({
    name: Type.String(),
    timing: Type.String(),
    event: Type.String(),
    statement: Type.String(),
}, {
    title: "Trigger"
})

const DbTable = Type.Object({
    name: Type.String(),
    options: Type.Optional(DbTableOptions),
    columns: Type.Array(DbColumn),
    indexes: Type.Optional(Type.Array(DbIndex)),
    foreignKeys: Type.Optional(Type.Array(DbForeignKey)),
    triggers: Type.Optional(Type.Array(DbTrigger)),
}, {
    title: "Table definition"
})

const ROOT = DbTable

function objectHash(x: any) {
    return JSON.stringify(x)
}

function makeSchema(root: any) {
    const map = new Map<string,[any,number]>
    let counter = 0

    function recurse(obj: any) {
        if(isPojo(obj)) {
            const k = objectHash(obj)
            const c = map.get(k)
            if(c != null) {
                map.set(k, [obj,c[1]+1])
            } else {
                map.set(k,[obj,1])

            }
            for(const value of Object.values(obj)) {
                recurse(value)
            }
        }
    }

    recurse(root)

    // console.log(map)

    const schema = {
        $schema: JSON_SCHEMA_VERSION,
        $id: SCHEMA_ID,
        definitions: {} as Record<string,any>
    }

    const pruned = new Map<any,string>()
    for(const [hash,[obj,count]] of map.entries()) {
        if(count > 1) {
            const key = (counter++).toString(36)
            pruned.set(hash,key)
            schema.definitions[key] = obj
        }
    }


    // FIXME: this is kind of a ghetto way to replace some nested values
   return {...schema,...JSON.parse(JSON.stringify(root,(key,value) => {
       const k = pruned.get(objectHash(value))
       if(k != null) {
           return {$ref: `#/definitions/${k}`}
       }
       return value
   }))}
}

async function main(programArgs: string[]): Promise<number | void> {

    // console.log(makeSchema(ROOT))
    //
    // return
    //
    // const schema = {
    //     $schema: JSON_SCHEMA_VERSION,
    //     $id: SCHEMA_ID,
    //     ...ROOT,
    // }
    //
    // console.log(schema)

    const schemaString = JSON.stringify(makeSchema(ROOT), null, 2)


    Bun.write(`${__dirname}/../schema2.json`, schemaString)



    const dbSchemaYaml = FileSys.readFileSync(`${__dirname}/../data/imagegather.yaml`, 'utf8')

    // console.log(dbSchemaYaml)



    const schemaValidator = TypeCompiler.Compile(Type.Array(DbTable))

    // Bun.write(`${__dirname}/../schema2.js`, schemaValidator.Code())

    // https://github.com/oven-sh/bun/issues/5960#issuecomment-1848296133
    // const schemaFile = Bun.file(`${__dirname}/../data/imagegather.yaml`)

    // console.log(schemaFile.size)
    //
    // const dbSchemaYaml = await schemaFile.text()
    //
    // console.log(dbSchemaYaml)
    //
    const tableSchemas = Yaml.loadAll(dbSchemaYaml)

    const errors = [...schemaValidator.Errors(tableSchemas)]

    if(errors.length) {
        console.error(`Found ${errors.length} error(s):`, errors)
        return 1
    }
    // console.log([...schemaValidator.Errors(tableSchemas)])

    const tableSpecs = schemaValidator.Decode(tableSchemas)
    console.log(tableSpecs)

    // console.log(tableSchemas[0])
    //
    // const t1 = Value.Errors(DbTable, tableSchemas[0])
    //
    // console.log(t1)

    // const dbTables = tableSchemas.map(tbl => Value.Decode(DbTable, tbl))

    // console.log(dbTables)



}


if(process.isBun && process.argv[1] === __filename) {
    main(process.argv.slice(2))
        .then(exitCode => {
            if(exitCode != null) {
                process.exitCode = exitCode
            }
        }, err => {
            console.error(err || "an unknown error occurred")
            process.exitCode = 1
        })
}
