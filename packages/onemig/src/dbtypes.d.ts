// https://app.quicktype.io?share=IVnlXO9ffmwcLE82kGRz

type DbColumnType =
    // Numeric Types
    'boolean'|
    'tinyint'|'smallint'|'mediumint'|'int'|'integer'|'bigint'|
    'decimal'|'dec'|'numeric'|'fixed'|
    'float'|'double'|'real'|'double precision'|
    'bit'|
    // String Types
    'char'|'varchar'|'binary'|'char byte'|'varbinary'|
    'tinyblob'|'blob'|'mediumblob'|'longblob'|
    'tinytext'|'text'|'mediumtext'|'longtext'|
    'json'|
    'enum'|'set'|
    // Date and Time
    'date'|'time'|'datetime'|'timestamp'|'year'|
    // Geometry
    'point'|'linestring'|'polygon'|'multipoint'|'multilinestring'|'multipolygon'|'geometrycollection'|'geometry';


type DbIndexType = 'PRIMARY' | 'BTREE' | 'UNIQUE' | 'INDEX'

export interface DbColumn {
    name: string
    type: DbColumnType
    comment?: string
    default?: string | number | 'NULL' | 'current_timestamp()'
    collation?: string
    autoIncrement?: boolean
    // extra?: 'on update current_timestamp()'|'STORED GENERATED'|string
    onUpdate?: 'current_timestamp()', // TODO: anything else?

    generated?: 'STORED'|'VIRTUAL'|'PERSISTENT',
    /** Generation expression */
    genExpr?: string
    values?: string[]
    zerofill?: number | boolean
    unsigned?: boolean
    precision?: [number, number]
    length?: number
    width?: number
    nullable?: boolean
    /**
     * These columns will then not be listed in the results of a SELECT * statement, nor do they need to be assigned a value in an INSERT statement, unless INSERT explicitly mentions them by name.
     * @see https://mariadb.com/kb/en/invisible-columns/
     */
    invisible?: boolean
}

export interface DbIndex {
    name: string
    type: DbIndexType
    columns: string[]
    comment?: string
}

/** https://mariadb.com/kb/en/foreign-keys/ */
type DbReferenceOption = 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'SET DEFAULT'

export interface DbForeignKey {
    name: string
    columns: string[]
    refTable: string
    refColumns: string[]
    onDelete: DbReferenceOption
    onUpdate: DbReferenceOption
    refDatabase?: string
}

interface DbTableOptions {
    engine?: string
    comment?: string
    collation?: string
}

export interface DbTable {
    name: string
    options: DbTableOptions
    columns: DbColumn[]
    indexes: DbIndex[]
    foreignKeys: DbForeignKey[]
    triggers?: DbTrigger[]
}

export interface DbTrigger {
    name: string
    timing: string
    event: string
    statement: string
}

export type DbIndexMap = Record<string, DbIndex>
export type DbFkMap = Record<string, DbForeignKey>
