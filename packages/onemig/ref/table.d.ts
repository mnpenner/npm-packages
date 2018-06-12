// https://app.quicktype.io?share=IVnlXO9ffmwcLE82kGRz

interface Table {
    name: string
    versions: TableVersion
}

interface TableVersion {
    databases: string[]
    columns: Column[]
    indexes: Index[]
    foreignKeys: ForeignKey[]
}

interface TableOptions {
    engine?: string
    comment?: string
    collation?: string
}

interface BaseColumn {
    name: string
}

type IntStr = number | string;

interface IntColumn extends BaseColumn {
    type: "int"
    default?: IntStr
}

interface TinyIntColumn extends BaseColumn {
    type: "tinyint"
    default?: IntStr
}

interface Index {
    name: string
    type: string
    columns: string[]
}

interface ForeignKey {
    name: string
    columns: string[]
    refTable: string
    refColumns: string[]
    onDelete: string
    onUpdate: string
    refDatabase?: string | AppRef
}

interface AppRef {
    $app: string
}

type Column = IntColumn | TinyIntColumn