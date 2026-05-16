import type { Logger, WriteFn } from '../logger';
import {createColors, type Colors} from '@mpen/picocolors'
import {stringWidth} from 'bun'

const INDEX_COLUMN = Symbol('index')
const PREFERRED_COLUMNS = ['index', 'idx', 'id', 'key', 'name', 'title']
const COLUMN_COLLATOR = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'})

type TableColumn = string | typeof INDEX_COLUMN
type TableRow = Record<string, unknown> & Partial<Record<typeof INDEX_COLUMN, string | number>>
type CellFormatter = (value: string) => string

interface RenderedLine {
    plain: string
    text: string
}

interface RenderedCell {
    lines: RenderedLine[]
    formatter?: CellFormatter
}

interface TableInspectOptions {
    /**
     * @defaultValue 1
     */
    depth?: number
    /**
     * @defaultValue 8
     */
    maxArrayLength?: number
    /**
     * @defaultValue 8
     */
    maxObjectKeys?: number
    /**
     * @defaultValue 80
     */
    maxStringLength?: number
}

export enum TableDensity {
    AUTO = 'auto',
    COMPACT ='compact',
    BALANCED = 'balanced',
    COMFORTABLE = 'comfortable',
    VERTICAL = 'vertical',
}

interface TableLayout {
    density: TableDensity
    hasHeaderSeparator: boolean
    hasHorizontalBorders: boolean
    hasOuterVerticals: boolean
    padding: number
}

interface TableOptions {
    density?: TableDensity
    inspect?: TableInspectOptions
    maxWidth?: number
    /**
     * @defaultValue false
     */
    showIndex?: boolean
    /**
     * @defaultValue false
     */
    striped?: boolean
}

interface EmojiLoggerOptions {
    color?: boolean
    table?: TableOptions
    write?: WriteFn
}

const INFO_ICON = '\u2139\uFE0F'
const WARN_ICON = '\u26a0\ufe0f'//'\u{1F6A7}'
const ERROR_ICON = '\u274C'

const DEFAULT_WRITE_FN: WriteFn = (str) => process.stdout.write(str)

export class TerminalLogger implements Logger {
    private readonly _pc: Colors
    private readonly _write: WriteFn
    private readonly _tblDensity: TableDensity
    private readonly _tblStriped: boolean
    private readonly _tblIndex: boolean
    private readonly _tblInspect: Required<TableInspectOptions>
    private readonly _tblMaxWidth: number | null

    constructor(options?: EmojiLoggerOptions) {
        this._write = options?.write ?? DEFAULT_WRITE_FN
        this._pc = createColors(options?.color)
        this._tblDensity = options?.table?.density ?? TableDensity.AUTO
        this._tblStriped = options?.table?.striped ?? false
        this._tblMaxWidth = options?.table?.maxWidth ?? null
        this._tblIndex = options?.table?.showIndex ?? false
        this._tblInspect = {
            depth: options?.table?.inspect?.depth ?? 1,
            maxArrayLength: options?.table?.inspect?.maxArrayLength ?? 8,
            maxObjectKeys: options?.table?.inspect?.maxObjectKeys ?? 8,
            maxStringLength: options?.table?.inspect?.maxStringLength ?? 80,
        }
    }

    log(...data: any[]): void {
        this._write(data.map((x) => String(x)).join('  ') + '\n')
    }

    info(...data: any[]): void {
        this._write(INFO_ICON + ' ' + data.map((x) => String(x)).join('  ') + '\n')
    }

    warn(...data: any[]): void {
        this._write(WARN_ICON + ' ' + data.map((x) => this._pc.yellow(x)).join('  ') + '\n')
    }

    error(...data: any[]): void {
        this._write(ERROR_ICON + ' ' + data.map((x) => this._pc.red(x)).join('  ') + '\n')
    }

    table(tabularData?: any, properties?: string[]): void {
        const rows = this.toRows(tabularData)
        const columns = this.getColumns(rows, properties)

        if (columns.length === 0) {
            this._write('(empty)\n')
            return
        }

        const renderedRows = rows.map((row) =>
            columns.map((column) =>
                this.stringifyCell(column in row ? row[column] : undefined, !(column in row)),
            ),
        )
        const density = this.resolveTableDensity(columns, renderedRows)

        if (density === TableDensity.VERTICAL) {
            this._write(this.renderVerticalTable(columns, renderedRows) + '\n')
            return
        }

        this._write(
            this.renderTable(this.getHeaders(columns, density), renderedRows, density) + '\n',
        )
    }

    private renderTable(
        headers: string[],
        renderedRows: RenderedCell[][],
        density: TableDensity,
    ): string {
        const layout = this.getTableLayout(density)
        const allocatedWidths = this.getColumnWidths(headers, renderedRows, layout)
        const wrappedColumns = headers.map((column, index) =>
            this.wrapCell([this.createRenderedLine(column)], allocatedWidths[index]),
        )
        const wrappedRows = renderedRows.map((row) => {
            return row.map((cell, index) =>
                this.wrapCell(cell.lines, allocatedWidths[index], cell.formatter),
            )
        })
        const widths = this.getRenderedColumnWidths(wrappedColumns, wrappedRows)

        const top = this.createBorder('╒', '╤', '╕', widths, layout, '═')
        const headerSeparator = this.createBorder('╞', '╪', '╡', widths, layout, '═')
        const bottom = this.createBorder('└', '┴', '┘', widths, layout)
        const lines = [
            ...(layout.hasHorizontalBorders ? [top] : []),
            ...this.createRowLines(wrappedColumns, widths, layout).map((line) =>
                this.formatHeaderRow(line, density),
            ),
            ...(layout.hasHeaderSeparator ? [headerSeparator] : []),
            ...wrappedRows.flatMap((row, index) =>
                this.createRowLines(row, widths, layout).map((line) =>
                    this.stripeTableRow(line, index),
                ),
            ),
            ...(layout.hasHorizontalBorders ? [bottom] : []),
        ]

        return lines.join('\n')
    }

    private renderVerticalTable(columns: TableColumn[], renderedRows: RenderedCell[][]): string {
        const labels = this.getHeaders(columns, TableDensity.VERTICAL)
        const labelWidth = Math.max(...labels.map((label) => this.getCellWidth(label)), 0)
        const maxWidth = this.getTerminalWidth()
        const valueWidth = Math.max(1, maxWidth - labelWidth - 4)
        const lines = renderedRows.flatMap((row, rowIndex) => {
            return this.createVerticalRecordLines(labels, row, labelWidth, valueWidth).map((line) =>
                this.stripeTableRow(line, rowIndex),
            )
        })

        return lines.join('\n')
    }

    private createVerticalRecordLines(
        labels: string[],
        row: RenderedCell[],
        labelWidth: number,
        valueWidth: number,
    ): string[] {
        const lines = row.flatMap((cell, columnIndex) => {
            const label = this.padPlainStart(labels[columnIndex], labelWidth)
            const wrappedValue = this.wrapCell(cell.lines, valueWidth, cell.formatter)

            return wrappedValue.map((line, lineIndex) => {
                const renderedLabel = lineIndex === 0 ? label : ' '.repeat(labelWidth)

                return `${renderedLabel}: ${line.text}`
            })
        })

        return lines.map((line, index) => {
            const marker = this.getVerticalRecordMarker(index, lines.length)

            return `${marker} ${line}`
        })
    }

    private getVerticalRecordMarker(index: number, lineCount: number): string {
        if (lineCount === 1) {
            return '◆'
        }

        if (index === 0) {
            return '┌'
        }

        if (index === lineCount - 1) {
            return '└'
        }

        return '│'
    }

    private toRows(tabularData: unknown): TableRow[] {
        if (tabularData == null) {
            return []
        }

        if (Array.isArray(tabularData)) {
            return tabularData.map((value, index) => this.toRow(value, index))
        }

        if (typeof tabularData === 'object') {
            return Object.entries(tabularData).map(([key, value]) => this.toRow(value, key))
        }

        return [this.toRow(tabularData, 0)]
    }

    private toRow(value: unknown, index: string | number): TableRow {
        if (value != null && typeof value === 'object' && !Array.isArray(value)) {
            return this._tblIndex
                ? { [INDEX_COLUMN]: index, ...(value as Record<string, unknown>) }
                : (value as Record<string, unknown>)
        }

        return this._tblIndex ? { [INDEX_COLUMN]: index, Values: value } : { Values: value }
    }

    private getColumns(rows: TableRow[], properties?: string[]): TableColumn[] {
        if (properties != null) {
            return this._tblIndex ? [INDEX_COLUMN, ...properties] : properties
        }

        const columns = new Set<string>()

        for (const row of rows) {
            for (const column of Object.keys(row)) {
                columns.add(column)
            }
        }

        const sortedColumns = this.sortColumns([...columns])

        return this._tblIndex ? [INDEX_COLUMN, ...sortedColumns] : sortedColumns
    }

    private sortColumns(columns: string[]): string[] {
        const columnSet = new Set(columns)
        const preferredColumns = PREFERRED_COLUMNS.filter((column) => columnSet.delete(column))
        const remainingColumns = [...columnSet].toSorted((a, b) => COLUMN_COLLATOR.compare(a, b))

        return [...preferredColumns, ...remainingColumns]
    }

    private getHeaders(columns: TableColumn[], density: TableDensity): string[] {
        return columns.map((column) => this.getHeader(column, density))
    }

    private getHeader(column: TableColumn, density: TableDensity): string {
        return column === INDEX_COLUMN ? this.getIndexHeader(density) : column
    }

    private getIndexHeader(density: TableDensity): string {
        switch (density) {
            case TableDensity.COMPACT:
                return '#'

            case TableDensity.VERTICAL:
                return '(index)'

            case TableDensity.BALANCED:
                return ''

            case TableDensity.COMFORTABLE:
                return ''
        }
        throw new Error('Unhandled density')
    }

    private stringifyCell(value: unknown, isUnset = false): RenderedCell {
        if (isUnset) {
            return { lines: [this.createRenderedLine('')] }
        }

        if (value === undefined) {
            return {
                lines: [this.createRenderedLine('undefined')],
                formatter: this._pc.blackBright,
            }
        }

        if (value === null) {
            return { lines: [this.createRenderedLine('null')], formatter: this._pc.blackBright }
        }

        if (typeof value === 'string') {
            return {
                lines: value
                    .split('\n')
                    .map((line) => this.createRenderedLine(this.truncateString(line))),
            }
        }

        if (typeof value === 'number') {
            return {
                lines: [this.createRenderedLine(String(value))],
                formatter: this._pc.blueBright,
            }
        }

        if (typeof value === 'bigint') {
            return {
                lines: [this.createRenderedLine(`${value.toString()}n`)],
                formatter: this._pc.blueBright,
            }
        }

        if (typeof value === 'boolean') {
            return {
                lines: [this.createRenderedLine(String(value))],
                formatter: value ? this._pc.greenBright : this._pc.redBright,
            }
        }

        if (typeof value === 'symbol') {
            return {
                lines: [this.createRenderedLine(value.toString())],
                formatter: this._pc.magentaBright,
            }
        }

        if (typeof value === 'function') {
            return {
                lines: [
                    this.createRenderedLine(
                        value.name === '' ? '[Function]' : `[Function:${value.name}]`,
                    ),
                ],
                formatter: this._pc.yellowBright,
            }
        }

        if (value != null && typeof value === 'object') {
            return { lines: [this.inspectValue(value, 0)] }
        }

        return { lines: [this.createRenderedLine(String(value))] }
    }

    private resolveTableDensity(columns: TableColumn[], rows: RenderedCell[][]): TableDensity {
        if (this._tblDensity !== TableDensity.AUTO) {
            return this._tblDensity
        }

        const balancedLayout = this.getTableLayout(TableDensity.BALANCED)
        const balancedHeaders = this.getHeaders(columns, TableDensity.BALANCED)
        const balancedWidths = this.getColumnWidths(balancedHeaders, rows, balancedLayout)

        if (this.shouldUseVerticalTable(balancedHeaders, rows, balancedWidths)) {
            return TableDensity.VERTICAL
        }

        const comfortableLayout = this.getTableLayout(TableDensity.COMFORTABLE)
        const headers = this.getHeaders(columns, TableDensity.COMFORTABLE)
        const widths = this.getColumnWidths(headers, rows, comfortableLayout)
        const requiresWrapping = this.requiresWrapping(headers, rows, widths)
        const containsSpaces = rows.some((row) =>
            row.some((cell) => cell.lines.some((line) => line.plain.includes(' '))),
        )

        if (containsSpaces && requiresWrapping) {
            return TableDensity.BALANCED
        }

        if (containsSpaces) {
            return TableDensity.COMFORTABLE
        }

        return requiresWrapping ? TableDensity.BALANCED : TableDensity.COMPACT
    }

    private shouldUseVerticalTable(
        columns: string[],
        rows: RenderedCell[][],
        widths: number[],
    ): boolean {
        const wrappingCellCount = this.getWrappingCellCount(rows, widths)
        const cellCount = rows.length * columns.length

        if (wrappingCellCount === 0) {
            return false
        }

        const wrappingRatio = wrappingCellCount / cellCount

        return wrappingRatio > 0.75 || this.hasCrampedColumn(columns, rows, widths)
    }

    private hasCrampedColumn(columns: string[], rows: RenderedCell[][], widths: number[]): boolean {
        return widths.some((width, columnIndex) => {
            if (width >= 4) {
                return false
            }

            return this.getColumnMaxWidth(columns, rows, columnIndex) > width
        })
    }

    private getColumnMaxWidth(
        columns: string[],
        rows: RenderedCell[][],
        columnIndex: number,
    ): number {
        return Math.max(
            this.getCellWidth(columns[columnIndex]),
            ...rows.flatMap((row) =>
                row[columnIndex].lines.map((line) => this.getCellWidth(line.plain)),
            ),
        )
    }

    private getWrappingCellCount(rows: RenderedCell[][], widths: number[]): number {
        return rows.reduce((count, row) => {
            return (
                count +
                row.filter((cell, columnIndex) => {
                    return cell.lines.some(
                        (line) => this.getCellWidth(line.plain) > widths[columnIndex],
                    )
                }).length
            )
        }, 0)
    }

    private getTableLayout(density: TableDensity): TableLayout {
        switch (density) {
            case TableDensity.COMPACT:
                return {
                    density,
                    hasHeaderSeparator: false,
                    hasHorizontalBorders: false,
                    hasOuterVerticals: false,
                    padding: 0,
                }

            case TableDensity.BALANCED:
            case TableDensity.VERTICAL:
                return {
                    density: TableDensity.BALANCED,
                    hasHeaderSeparator: true,
                    hasHorizontalBorders: true,
                    hasOuterVerticals: true,
                    padding: 0,
                }

            case TableDensity.AUTO:
            case TableDensity.COMFORTABLE:
                return {
                    density: TableDensity.COMFORTABLE,
                    hasHeaderSeparator: true,
                    hasHorizontalBorders: true,
                    hasOuterVerticals: true,
                    padding: 1,
                }
        }
    }

    private requiresWrapping(columns: string[], rows: RenderedCell[][], widths: number[]): boolean {
        return columns.some((column, columnIndex) => {
            if (this.getCellWidth(column) > widths[columnIndex]) {
                return true
            }

            return rows.some((row) =>
                row[columnIndex].lines.some(
                    (line) => this.getCellWidth(line.plain) > widths[columnIndex],
                ),
            )
        })
    }

    private getColumnWidths(
        columns: string[],
        rows: RenderedCell[][],
        layout: TableLayout,
    ): number[] {
        const overheadWidth = this.getTableOverheadWidth(columns.length, layout)
        const availableWidth = Math.max(this.getTerminalWidth() - overheadWidth, columns.length)
        const columnMeasurements = columns.map((column, columnIndex) => {
            const widths = [
                this.getCellWidth(column),
                ...rows.flatMap((row) =>
                    row[columnIndex].lines.map((line) => this.getCellWidth(line.plain)),
                ),
            ]

            return {
                header: this.getCellWidth(column),
                max: Math.max(...widths),
                median: this.getMedian(widths),
            }
        })
        const maxTotalWidth = columnMeasurements.reduce((total, column) => total + column.max, 0)

        if (maxTotalWidth <= availableWidth) {
            return columnMeasurements.map((column) => column.max)
        }

        const minimumWidths = columnMeasurements.map((column) => {
            return Math.min(column.max, Math.max(column.header, Math.min(column.median, 8)))
        })
        const minimumTotalWidth = minimumWidths.reduce((total, width) => total + width, 0)

        if (minimumTotalWidth <= availableWidth) {
            const remainingWidth = availableWidth - minimumTotalWidth
            const targetWidths = this.distributeProportionalWidth(
                minimumWidths,
                columnMeasurements.map((column) => column.max),
                columnMeasurements.map((column) => column.median),
                remainingWidth,
            )

            return this.distributeRemainingWidth(
                targetWidths,
                columnMeasurements.map((column) => column.max),
                availableWidth,
            )
        }

        const scaledWidths = this.scaleWidths(minimumWidths, availableWidth)

        return this.distributeRemainingWidth(
            scaledWidths,
            columnMeasurements.map((column) => column.max),
            availableWidth,
        )
    }

    private getTableOverheadWidth(columnCount: number, layout: TableLayout): number {
        const paddingWidth = columnCount * layout.padding * 2
        const separatorWidth = Math.max(0, columnCount - 1)
        const outerVerticalWidth = layout.hasOuterVerticals ? 2 : 0

        return paddingWidth + separatorWidth + outerVerticalWidth
    }

    private getRenderedColumnWidths(headers: RenderedLine[][], rows: RenderedLine[][][]): number[] {
        return headers.map((header, columnIndex) => {
            return Math.max(
                ...header.map((line) => this.getCellWidth(line.plain)),
                ...rows.flatMap((row) =>
                    row[columnIndex].map((line) => this.getCellWidth(line.plain)),
                ),
            )
        })
    }

    private distributeProportionalWidth(
        widths: number[],
        maxWidths: number[],
        weights: number[],
        availableWidth: number,
    ): number[] {
        if (availableWidth <= 0) {
            return widths
        }

        const totalWeight = weights.reduce((total, weight, index) => {
            return widths[index] < maxWidths[index] ? total + weight : total
        }, 0)

        if (totalWeight === 0) {
            return widths
        }

        let distributedWidth = 0

        for (let index = 0; index < widths.length; index++) {
            if (widths[index] >= maxWidths[index]) {
                continue
            }

            const extraWidth = Math.min(
                maxWidths[index] - widths[index],
                Math.floor((weights[index] / totalWeight) * availableWidth),
            )

            widths[index] += extraWidth
            distributedWidth += extraWidth
        }

        return this.distributeRemainingWidth(
            widths,
            maxWidths,
            widths.reduce((total, width) => total + width, 0) + availableWidth - distributedWidth,
        )
    }

    private scaleWidths(widths: number[], availableWidth: number): number[] {
        const totalWidth = widths.reduce((total, width) => total + width, 0)

        if (totalWidth === 0) {
            return widths.map(() => 1)
        }

        return widths.map((width) => Math.max(1, Math.floor((width / totalWidth) * availableWidth)))
    }

    private distributeRemainingWidth(
        widths: number[],
        maxWidths: number[],
        availableWidth: number,
    ): number[] {
        let remainingWidth = availableWidth - widths.reduce((total, width) => total + width, 0)

        while (remainingWidth > 0) {
            let distributed = false

            for (let index = 0; index < widths.length && remainingWidth > 0; index++) {
                if (widths[index] < maxWidths[index]) {
                    widths[index]++
                    remainingWidth--
                    distributed = true
                }
            }

            if (!distributed) {
                break
            }
        }

        return widths
    }

    private getMedian(values: number[]): number {
        const sortedValues = values.toSorted((a, b) => a - b)
        const middle = Math.floor(sortedValues.length / 2)

        if (sortedValues.length % 2 === 1) {
            return sortedValues[middle]
        }

        return Math.ceil((sortedValues[middle - 1] + sortedValues[middle]) / 2)
    }

    private getTerminalWidth(): number {
        if (this._tblMaxWidth != null) {
            return this._tblMaxWidth
        }

        if (process.stdout.columns != null && process.stdout.columns > 0) {
            return process.stdout.columns
        }

        if (process.stderr.columns != null && process.stderr.columns > 0) {
            return process.stderr.columns
        }

        return 80
    }

    private wrapCell(
        lines: RenderedLine[],
        width: number,
        formatter?: CellFormatter,
    ): RenderedLine[] {
        return lines
            .flatMap((line) => this.wrapLine(line, width))
            .map((line) =>
                formatter == null
                    ? line
                    : this.createRenderedLine(line.plain, formatter(line.plain)),
            )
    }

    private wrapLine(line: RenderedLine, width: number): RenderedLine[] {
        if (line.plain === '') {
            return [line]
        }

        const wrappedLines: RenderedLine[] = []
        let currentLine = this.createRenderedLine('')

        for (const word of this.splitRenderedLine(line)) {
            if (word.plain === '') {
                continue
            }

            if (this.getCellWidth(word.plain) > width) {
                if (currentLine.plain.trimEnd() !== '') {
                    wrappedLines.push(this.trimRenderedLineEnd(currentLine))
                    currentLine = this.createRenderedLine('')
                }

                wrappedLines.push(...this.breakWord(word, width))
                continue
            }

            const candidateLine = this.joinRenderedLines(currentLine, word)

            if (
                currentLine.plain !== '' &&
                this.getCellWidth(candidateLine.plain.trimEnd()) > width
            ) {
                wrappedLines.push(this.trimRenderedLineEnd(currentLine))
                currentLine = this.trimRenderedLineStart(word)
            } else {
                currentLine = candidateLine
            }
        }

        if (currentLine.plain.trimEnd() !== '') {
            wrappedLines.push(this.trimRenderedLineEnd(currentLine))
        }

        return wrappedLines.length === 0 ? [this.createRenderedLine('')] : wrappedLines
    }

    private breakWord(word: RenderedLine, width: number): RenderedLine[] {
        const lines: RenderedLine[] = []
        let currentLine = this.createRenderedLine('')

        for (const char of this.splitRenderedChars(word)) {
            const candidateLine = this.joinRenderedLines(currentLine, char)

            if (currentLine.plain !== '' && this.getCellWidth(candidateLine.plain) > width) {
                lines.push(currentLine)
                currentLine = char
            } else {
                currentLine = candidateLine
            }
        }

        if (currentLine.plain !== '') {
            lines.push(currentLine)
        }

        return lines
    }

    private inspectValue(value: unknown, depth: number): RenderedLine {
        if (value === undefined) {
            return this.createRenderedLine('undefined', this._pc.blackBright('undefined'))
        }

        if (value === null) {
            return this.createRenderedLine('null', this._pc.blackBright('null'))
        }

        if (typeof value === 'string') {
            const text = JSON.stringify(this.truncateString(value))

            return this.createRenderedLine(text, text)
        }

        if (typeof value === 'number') {
            return this.createRenderedLine(String(value), this._pc.blueBright(value))
        }

        if (typeof value === 'bigint') {
            const text = `${value.toString()}n`

            return this.createRenderedLine(text, this._pc.blueBright(text))
        }

        if (typeof value === 'boolean') {
            const text = String(value)

            return this.createRenderedLine(
                text,
                value ? this._pc.greenBright(text) : this._pc.redBright(text),
            )
        }

        if (typeof value === 'symbol') {
            const text = value.toString()

            return this.createRenderedLine(text, this._pc.magentaBright(text))
        }

        if (typeof value === 'function') {
            const text = value.name === '' ? '[Function]' : `[Function:${value.name}]`

            return this.createRenderedLine(text, this._pc.yellowBright(text))
        }

        if (depth >= this._tblInspect.depth) {
            const text = Array.isArray(value) ? '[Array]' : '[Object]'

            return this.createRenderedLine(text, this._pc.yellowBright(text))
        }

        if (Array.isArray(value)) {
            return this.inspectArray(value, depth)
        }

        return this.inspectObject(value as Record<string, unknown>, depth)
    }

    private inspectArray(value: readonly unknown[], depth: number): RenderedLine {
        const entries = value
            .slice(0, this._tblInspect.maxArrayLength)
            .map((item) => this.inspectValue(item, depth + 1))
        const hasMore = value.length > entries.length
        const suffix = hasMore
            ? [
                  this.createRenderedLine(
                      `...${value.length - entries.length} more`,
                      this._pc.blackBright(`...${value.length - entries.length} more`),
                  ),
              ]
            : []

        return this.joinRenderedParts('[', [...entries, ...suffix], ',', ']')
    }

    private inspectObject(value: Record<string, unknown>, depth: number): RenderedLine {
        const keys = Object.keys(value)
        const entries = keys.slice(0, this._tblInspect.maxObjectKeys).map((key) => {
            return this.joinRenderedLines(
                this.createRenderedLine(`${this.formatObjectKey(key)}:`),
                this.inspectValue(value[key], depth + 1),
            )
        })
        const hasMore = keys.length > entries.length
        const suffix = hasMore
            ? [
                  this.createRenderedLine(
                      `...${keys.length - entries.length} more`,
                      this._pc.blackBright(`...${keys.length - entries.length} more`),
                  ),
              ]
            : []

        return this.joinRenderedParts('{', [...entries, ...suffix], ',', '}')
    }

    private joinRenderedParts(
        open: string,
        parts: RenderedLine[],
        separator: string,
        close: string,
    ): RenderedLine {
        const content = parts.reduce<RenderedLine | null>((result, part) => {
            if (result == null) {
                return part
            }

            return this.joinRenderedLines(
                this.joinRenderedLines(result, this.createRenderedLine(separator)),
                part,
            )
        }, null)

        return this.joinRenderedLines(
            this.joinRenderedLines(
                this.createRenderedLine(open),
                content ?? this.createRenderedLine(''),
            ),
            this.createRenderedLine(close),
        )
    }

    private formatObjectKey(key: string): string {
        return /^[a-z_$][\w$]*$/i.test(key) ? key : JSON.stringify(key)
    }

    private truncateString(value: string): string {
        if (this.getCellWidth(value) <= this._tblInspect.maxStringLength) {
            return value
        }

        let result = ''

        for (const char of value) {
            if (this.getCellWidth(result + char) > this._tblInspect.maxStringLength - 1) {
                break
            }

            result += char
        }

        return result + '…'
    }

    private createRenderedLine(plain: string, text = plain): RenderedLine {
        return { plain, text }
    }

    private joinRenderedLines(left: RenderedLine, right: RenderedLine): RenderedLine {
        return {
            plain: left.plain + right.plain,
            text: left.text + right.text,
        }
    }

    private trimRenderedLineStart(line: RenderedLine): RenderedLine {
        const trimmedPlain = line.plain.trimStart()
        const removedLength = line.plain.length - trimmedPlain.length

        if (removedLength === 0 || line.text !== line.plain) {
            return line.text === line.plain ? this.createRenderedLine(trimmedPlain) : line
        }

        return this.createRenderedLine(trimmedPlain)
    }

    private trimRenderedLineEnd(line: RenderedLine): RenderedLine {
        const trimmedPlain = line.plain.trimEnd()

        if (line.text !== line.plain) {
            return line
        }

        return this.createRenderedLine(trimmedPlain)
    }

    private splitRenderedLine(line: RenderedLine): RenderedLine[] {
        if (line.text !== line.plain) {
            return [line]
        }

        return line.plain.split(/(\s+)/u).map((part) => this.createRenderedLine(part))
    }

    private splitRenderedChars(line: RenderedLine): RenderedLine[] {
        if (line.text !== line.plain) {
            return [...line.plain].map((char) =>
                this.createRenderedLine(char, line.text === line.plain ? char : char),
            )
        }

        return [...line.plain].map((char) => this.createRenderedLine(char))
    }

    private createRowLines(row: RenderedLine[][], widths: number[], layout: TableLayout): string[] {
        const height = Math.max(...row.map((cell) => cell.length))
        const lines: string[] = []

        for (let lineIndex = 0; lineIndex < height; lineIndex++) {
            lines.push(
                this.createLine(
                    row.map((cell) => [cell[lineIndex] ?? this.createRenderedLine('')]),
                    widths,
                    layout,
                ),
            )
        }

        return lines
    }

    private createLine(cells: RenderedLine[][], widths: number[], layout: TableLayout): string {
        const padding = ' '.repeat(layout.padding)
        const line = cells
            .map(
                (cell, index) =>
                    padding +
                    this.padCell(cell[0] ?? this.createRenderedLine(''), widths[index]) +
                    padding,
            )
            .join('│')

        return layout.hasOuterVerticals ? '│' + line + '│' : line
    }

    private createBorder(
        left: string,
        middle: string,
        right: string,
        widths: number[],
        layout: TableLayout,
        horizontal = '─',
    ): string {
        const line = widths
            .map((width) => horizontal.repeat(width + layout.padding * 2))
            .join(middle)

        return layout.hasOuterVerticals ? left + line + right : line
    }

    private stripeTableRow(line: string, index: number): string {
        if (!this._tblStriped || index % 2 === 0) {
            return line
        }

        return this._pc.bgRgb(24, 24, 24)(line)
    }

    private formatHeaderRow(line: string, density: TableDensity): string {
        if (density !== TableDensity.COMPACT) {
            return line
        }

        // return this._pc.bgHex('#0100A8')(this._pc.bold(this._pc.white(line)))
        return this._pc.bgWhite(this._pc.bold(this._pc.black(line)))
    }

    private padCell(value: RenderedLine, width: number): string {
        return value.text + ' '.repeat(width - this.getCellWidth(value.plain))
    }

    private padPlain(value: string, width: number): string {
        return value + ' '.repeat(width - this.getCellWidth(value))
    }

    private padPlainStart(value: string, width: number): string {
        return ' '.repeat(width - this.getCellWidth(value)) + value
    }

    private getCellWidth(value: string): number {
        return stringWidth(value)
    }
}
