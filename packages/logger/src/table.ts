/**
 * @internal
 */
export const TABLE_INDEX_COLUMN = Symbol('index')

const PREFERRED_COLUMNS = ['index', 'idx', 'id', 'key', 'name', 'title']
const COLUMN_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/**
 * @internal
 */
export type TableColumn = string | typeof TABLE_INDEX_COLUMN

/**
 * @internal
 */
export type TableRow = Record<string, unknown> &
    Partial<Record<typeof TABLE_INDEX_COLUMN, string | number>>

/**
 * @internal
 */
export function toTableRows(tabularData: unknown, showIndex: boolean): TableRow[] {
    if (tabularData == null) {
        return []
    }

    if (Array.isArray(tabularData)) {
        return tabularData.map((value, index) => toTableRow(value, index, showIndex))
    }

    if (typeof tabularData === 'object') {
        return Object.entries(tabularData).map(([key, value]) => toTableRow(value, key, showIndex))
    }

    return [toTableRow(tabularData, 0, showIndex)]
}

/**
 * @internal
 */
export function getTableColumns(
    rows: TableRow[],
    properties: string[] | undefined,
    showIndex: boolean,
): TableColumn[] {
    if (properties != null) {
        return showIndex ? [TABLE_INDEX_COLUMN, ...properties] : properties
    }

    const columns = new Set<string>()

    for (const row of rows) {
        for (const column of Object.keys(row)) {
            columns.add(column)
        }
    }

    const sortedColumns = sortTableColumns([...columns])

    return showIndex ? [TABLE_INDEX_COLUMN, ...sortedColumns] : sortedColumns
}

/**
 * @internal
 */
export function sortTableColumns(columns: string[]): string[] {
    const columnSet = new Set(columns)
    const preferredColumns = PREFERRED_COLUMNS.filter((column) => columnSet.delete(column))
    const remainingColumns = [...columnSet].toSorted((a, b) => COLUMN_COLLATOR.compare(a, b))

    return [...preferredColumns, ...remainingColumns]
}

function toTableRow(value: unknown, index: string | number, showIndex: boolean): TableRow {
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
        return showIndex
            ? { [TABLE_INDEX_COLUMN]: index, ...(value as Record<string, unknown>) }
            : (value as Record<string, unknown>)
    }

    return showIndex ? { [TABLE_INDEX_COLUMN]: index, Values: value } : { Values: value }
}
