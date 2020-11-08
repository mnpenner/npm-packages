// https://app.quicktype.io?share=IVnlXO9ffmwcLE82kGRz

export enum DbColumnType {
    // Numeric Types
    BOOLEAN = 'boolean',
    TINYINT = 'tinyint',
    SMALLINT = 'smallint',
    MEDIUMINT = 'mediumint',
    INT = 'int',
    INTEGER = 'integer',
    BIGINT = 'bigint',

    DECIMAL = 'decimal',
    DEC = 'dec',
    NUMERIC = 'numeric',
    FIXED = 'fixed',

    FLOAT = 'float',
    DOUBLE = 'double',
    REAL = 'real',
    DOUBLE_PRECISION = 'double precision',

    BIT = 'bit',

    // String Types
    CHAR = 'char',
    VARCHAR = 'varchar',
    BINARY = 'binary',
    CHAR_BYTE = 'char byte',
    VARBINARY = 'varbinary',

    TINYBLOB = 'tinyblob',
    BLOB = 'blob',
    MEDIUMBLOB = 'mediumblob',
    LONGBLOB = 'longblob',

    TINYTEXT = 'tinytext',
    TEXT = 'text',
    MEDIUMTEXT = 'mediumtext',
    LONGTEXT = 'longtext',

    JSON = 'json',

    ENUM = 'enum',
    SET = 'set',

    // Date and Time
    DATE = 'date',
    TIME = 'time',
    DATETIME = 'datetime',
    TIMESTAMP = 'timestamp',
    YEAR = 'year',

    // Geometry
    POINT = 'point',
    LINESTRING = 'linestring',
    POLYGON = 'polygon',
    MULTIPOINT = 'multipoint',
    MULTILINESTRING = 'multilinestring',
    MULTIPOLYGON = 'multipolygon',
    GEOMETRYCOLLECTION = 'geometrycollection',
    GEOMETRY = 'geometry',
}


export enum DbIndexType {
    PRIMARY = 'PRIMARY',
    BTREE = 'BTREE',
    UNIQUE = 'UNIQUE',
    INDEX = 'INDEX'
}

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
