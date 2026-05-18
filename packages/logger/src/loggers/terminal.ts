import type { Logger, WriteFn } from '../logger'
import { createColors, type Colors } from '@mpen/picocolors'
import stringWidth from 'string-width'
import { jsAsciiString } from '../json.ts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    getTableColumns,
    TABLE_INDEX_COLUMN,
    type TableColumn,
    type TableRow,
    toTableRows,
} from '../table.ts'

type CellFormatter = (value: string) => string
type CellAlignment = 'left' | 'right'

interface RenderedLine {
    plain: string
    text: string
}

interface RenderedCell {
    lines: RenderedLine[]
    formatter?: CellFormatter
}

interface ErrorStackFrame {
    callee?: string
    indent: string
    location: string
    wrappedLocation: boolean
}

/**
 * Value inspection limits used when rendering terminal output.
 *
 * @example
 * ```ts
 * import { TerminalLogger, type TableInspectOptions } from '@mpen/logger'
 *
 * const inspect: TableInspectOptions = { depth: 2, maxStringLength: 120 }
 * const logger = new TerminalLogger({ table: { inspect } })
 * ```
 */
export interface TableInspectOptions {
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

/**
 * Table layout density options for [`TerminalLogger.table`]{@link TerminalLogger#table}.
 *
 * @example
 * ```ts
 * import { TableDensity, TerminalLogger } from '@mpen/logger'
 *
 * const logger = new TerminalLogger({ table: { density: TableDensity.BALANCED } })
 * ```
 */
export enum TableDensity {
    /**
     * Selects a table layout based on the rendered data and terminal width.
     */
    AUTO = 'auto',
    /**
     * Uses a compact layout for short machine-readable values.
     */
    COMPACT = 'compact',
    /**
     * Uses a middle-density layout that wraps cramped cells.
     */
    BALANCED = 'balanced',
    /**
     * Uses additional padding around cells.
     */
    COMFORTABLE = 'comfortable',
    /**
     * Renders each record vertically.
     */
    VERTICAL = 'vertical',
}

interface TableLayout {
    density: TableDensity
    hasHeaderSeparator: boolean
    hasHorizontalBorders: boolean
    hasOuterVerticals: boolean
    padding: number
}

/**
 * Terminal table rendering options.
 *
 * @example
 * ```ts
 * import { TableDensity, type TableOptions } from '@mpen/logger'
 *
 * const table: TableOptions = {
 *     showIndex: true,
 * }
 * ```
 */
export interface TableOptions {
    /**
     * Table density to use.
     * @defaultValue TableDensity.AUTO
     * @experimental Better to leave the default. Options may change over time.
     */
    density?: TableDensity
    /**
     * Value inspection limits for table cells.
     */
    inspect?: TableInspectOptions
    /**
     * Show the array index as the first column.
     * @defaultValue false
     */
    showIndex?: boolean
    /**
     * @defaultValue false
     * @experimental May allow choosing BG color or theming.
     */
    striped?: boolean
}

/**
 * Plain log rendering options for [`TerminalLogger`]{@link TerminalLogger}.
 *
 * @example
 * ```ts
 * import { TerminalLogger, type TerminalLogOptions } from '@mpen/logger'
 *
 * const log: TerminalLogOptions = { inspect: { depth: 3 } }
 * const logger = new TerminalLogger({ log })
 * ```
 */
export interface TerminalLogOptions {
    /**
     * Value inspection limits for log messages.
     */
    inspect?: TableInspectOptions
}

/**
 * Options for [`TerminalLogger`]{@link TerminalLogger}.
 *
 * @example
 * ```ts
 * import { TerminalLogger, type TerminalLoggerOptions } from '@mpen/logger'
 *
 * const options: TerminalLoggerOptions = {
 *     color: true,
 *     write: (buffer) => process.stdout.write(buffer),
 * }
 * const logger = new TerminalLogger(options)
 * ```
 */
export interface TerminalLoggerOptions {
    /**
     * Whether ANSI color output is enabled.
     */
    color?: boolean
    /**
     * Root directory used to shorten absolute file paths in rendered error stack traces.
     * @defaultValue process.cwd()
     */
    errorRootPath?: string
    /**
     * Plain log rendering options.
     */
    log?: TerminalLogOptions
    /**
     * Maximum output width before wrapping.
     */
    maxWidth?: number
    /**
     * Table rendering options.
     */
    table?: TableOptions
    /**
     * Receives formatted terminal output.
     */
    write?: WriteFn
}

const INFO_ICON = '\u2139\uFE0F'
const WARN_ICON = '\u26a0\ufe0f' //'\u{1F6A7}'
const ERROR_ICON = '\u274C'
const ANSI_PATTERN = /\x1B\[[0-?]*[ -/]*[@-~]/gu
const ANSI_RESET = '\x1B[0m'
const ERROR_STANDARD_PROPERTIES = new Set<PropertyKey>([
    'cause',
    'errors',
    'message',
    'name',
    'stack',
])

const DEFAULT_WRITE_FN: WriteFn = (str) => process.stdout.write(str)

function getLogTime(): string {
    const date = new Date()
    const hour = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${hour}:${minutes}`
}

/**
 * Writes formatted logs and tables for terminal programs.
 *
 * @example
 * ```ts
 * import { TerminalLogger } from '@mpen/logger'
 *
 * const logger = new TerminalLogger()
 * logger.info('build started')
 * logger.table([{ name: 'api', status: 'ok' }])
 * ```
 */
export class TerminalLogger implements Logger {
    private readonly _pc: Colors
    private readonly _write: WriteFn
    private readonly _tblDensity: TableDensity
    private readonly _tblStriped: boolean
    private readonly _tblIndex: boolean
    private readonly _tblInspect: Required<TableInspectOptions>
    private readonly _logInspect: Required<TableInspectOptions>
    private readonly _maxWidth: number | null
    private readonly _errorRootPath: string

    /**
     * Creates a terminal logger.
     *
     * @param options - Optional output, color, width, and formatting settings.
     */
    constructor(options?: TerminalLoggerOptions) {
        this._write = options?.write ?? DEFAULT_WRITE_FN
        this._pc = createColors(options?.color)
        this._tblDensity = options?.table?.density ?? TableDensity.AUTO
        this._tblStriped = options?.table?.striped ?? false
        this._maxWidth = options?.maxWidth ?? null
        this._errorRootPath = options?.errorRootPath ?? process.cwd()
        this._tblIndex = options?.table?.showIndex ?? false
        this._tblInspect = {
            depth: options?.table?.inspect?.depth ?? 1,
            maxArrayLength: options?.table?.inspect?.maxArrayLength ?? 8,
            maxObjectKeys: options?.table?.inspect?.maxObjectKeys ?? 8,
            maxStringLength: options?.table?.inspect?.maxStringLength ?? 80,
        }
        this._logInspect = {
            depth: options?.log?.inspect?.depth ?? 4,
            maxArrayLength: options?.log?.inspect?.maxArrayLength ?? 32,
            maxObjectKeys: options?.log?.inspect?.maxObjectKeys ?? 32,
            maxStringLength: options?.log?.inspect?.maxStringLength ?? 200,
        }
    }

    /**
     * Writes a debug-level terminal message without a timestamp prefix.
     *
     * @param data - Values to render.
     * @returns Nothing.
     */
    log(...data: any[]): void {
        const message = this.stringifyPlainLogData(data)
        const maxWidth = this.getTerminalWidth()
        const lines = message.lines.flatMap((line) => this.wrapLine(line, maxWidth))

        this._write(lines.map((line) => line.text).join('\n') + '\n')
    }

    /**
     * Writes an info-level terminal message.
     *
     * @param data - Values to render.
     * @returns Nothing.
     */
    info(...data: any[]): void {
        this.writeLogLine(INFO_ICON, data)
    }

    /**
     * Writes a warning-level terminal message.
     *
     * @param data - Values to render.
     * @returns Nothing.
     */
    warn(...data: any[]): void {
        this.writeLogLine(WARN_ICON, data)
    }

    /**
     * Writes an error-level terminal message.
     *
     * @param data - Values to render.
     * @returns Nothing.
     */
    error(...data: any[]): void {
        this.writeLogLine(ERROR_ICON, data)
    }

    /**
     * Writes tabular terminal output.
     *
     * @param tabularData - Data to render as rows.
     * @param properties - Optional property names to include and order.
     * @returns Nothing.
     */
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
        const alignments = this.getColumnAlignments(columns, rows)
        const density = this.resolveTableDensity(columns, renderedRows)

        if (density === TableDensity.VERTICAL) {
            this._write(this.renderVerticalTable(columns, renderedRows) + '\n')
            return
        }

        this._write(
            this.renderTable(this.getHeaders(columns, density), renderedRows, density, alignments) +
                '\n',
        )
    }

    private writeLogLine(icon: string, data: unknown[]): void {
        const time = getLogTime()
        const prefix = this.createRenderedLine(`${icon} ${time} `)
        const formattedPrefix = this.createRenderedLine(
            prefix.plain,
            `${icon} ${this._pc.blackBright(time)} `,
        )
        const message = this.stringifyLogData(data)
        const maxWidth = this.getTerminalWidth()
        const firstLineWidth = Math.max(1, maxWidth - this.getCellWidth(prefix.plain))
        const continuationIndent = '   '
        const continuationWidth = Math.max(1, maxWidth - this.getCellWidth(continuationIndent))
        const [firstMessageLine = this.createRenderedLine(''), ...remainingMessageLines] =
            message.lines
        const [firstLine = this.createRenderedLine(''), ...firstMessageContinuationLines] =
            this.wrapLine(firstMessageLine, firstLineWidth)
        const remainingLines = [
            ...firstMessageContinuationLines,
            ...remainingMessageLines.flatMap((line) => this.wrapLine(line, continuationWidth)),
        ]

        this._write(
            [
                formattedPrefix.text + firstLine.text,
                ...remainingLines.map((line) => continuationIndent + line.text),
            ].join('\n') + '\n',
        )
    }

    private stringifyLogData(data: unknown[]): RenderedCell {
        const lines = data
            .map((value) => this.formatRenderedCell(this.stringifyLogValue(value)))
            .reduce<RenderedLine[] | null>((result, cell) => {
                if (result == null) {
                    return cell.lines
                }

                return this.appendLogLineGroup(result, cell.lines, '  ')
            }, null)

        return { lines: lines ?? [this.createRenderedLine('')] }
    }

    private appendLogLineGroup(
        left: RenderedLine[],
        right: RenderedLine[],
        separator: string,
    ): RenderedLine[] {
        if (left.length > 1) {
            return [...left, ...right]
        }

        return this.appendRenderedLineGroup(left, right, separator)
    }

    private stringifyPlainLogData(data: unknown[]): RenderedCell {
        const lines = data
            .map((value) => this.stringifyPlainLogValue(value))
            .reduce<RenderedLine[] | null>((result, cell) => {
                if (result == null) {
                    return cell.lines
                }

                return this.appendRenderedLineGroup(result, cell.lines, '  ')
            }, null)

        return { lines: lines ?? [this.createRenderedLine('')] }
    }

    private stringifyLogValue(value: unknown): RenderedCell {
        if (typeof value === 'string') {
            return {
                lines: value.split('\n').map((line) => this.createRenderedLine(line)),
            }
        }

        return this.stringifyCell(value)
    }

    private stringifyPlainLogValue(value: unknown): RenderedCell {
        if (typeof value === 'string') {
            return {
                lines: value.split('\n').map((line) => this.createRenderedLine(line)),
            }
        }

        if (value instanceof Error) {
            return this.stringifyError(value)
        }

        if (value != null && typeof value === 'object') {
            return { lines: this.inspectPrettyValue(value, 0, new WeakSet()) }
        }

        return this.formatRenderedCell(this.stringifyCell(value))
    }

    private formatRenderedCell(cell: RenderedCell): RenderedCell {
        if (cell.formatter == null) {
            return cell
        }

        return {
            lines: cell.lines.map((line) =>
                this.createRenderedLine(line.plain, cell.formatter?.(line.plain) ?? line.text),
            ),
        }
    }

    private appendRenderedLineGroup(
        left: RenderedLine[],
        right: RenderedLine[],
        separator: string,
    ): RenderedLine[] {
        const lastLeft = left.at(-1)
        const [firstRight, ...remainingRight] = right

        if (lastLeft == null) {
            return right
        }

        if (firstRight == null) {
            return left
        }

        return [
            ...left.slice(0, -1),
            this.joinRenderedLines(
                this.joinRenderedLines(lastLeft, this.createRenderedLine(separator)),
                firstRight,
            ),
            ...remainingRight,
        ]
    }

    private renderTable(
        headers: string[],
        renderedRows: RenderedCell[][],
        density: TableDensity,
        alignments: CellAlignment[],
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
                this.createRowLines(row, widths, layout, alignments).map((line) =>
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
                this.stripeVerticalTableRow(line, rowIndex),
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
        return toTableRows(tabularData, this._tblIndex)
    }

    private getColumns(rows: TableRow[], properties?: string[]): TableColumn[] {
        return getTableColumns(rows, properties, this._tblIndex)
    }

    private getHeaders(columns: TableColumn[], density: TableDensity): string[] {
        return columns.map((column) => this.getHeader(column, density))
    }

    private getColumnAlignments(columns: TableColumn[], rows: TableRow[]): CellAlignment[] {
        return columns.map((column) => {
            let hasNumber = false

            for (const row of rows) {
                const value = column in row ? row[column] : undefined

                if (value === null || value === undefined) {
                    continue
                }

                if (typeof value !== 'number') {
                    return 'left'
                }

                hasNumber = true
            }

            return hasNumber ? 'right' : 'left'
        })
    }

    private getHeader(column: TableColumn, density: TableDensity): string {
        return column === TABLE_INDEX_COLUMN ? this.getIndexHeader(density) : column
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
                formatter: this._pc.magentaBright,
            }
        }

        if (value instanceof Error) {
            return this.stringifyError(value)
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
        if (this._maxWidth != null) {
            return this._maxWidth
        }

        const stdoutColumns = this.toPositiveInteger(process.stdout.columns)
        if (stdoutColumns != null) {
            return stdoutColumns
        }

        const stderrColumns = this.toPositiveInteger(process.stderr.columns)
        if (stderrColumns != null) {
            return stderrColumns
        }

        const envColumns = this.toPositiveInteger(process.env.COLUMNS)
        if (envColumns != null) {
            return envColumns
        }

        return 80
    }

    private toPositiveInteger(value: number | string | undefined): number | null {
        if (typeof value === 'number') {
            return Number.isSafeInteger(value) && value > 0 ? value : null
        }

        if (value == null || !/^\d+$/u.test(value.trim())) {
            return null
        }

        const parsedValue = Number(value)

        return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
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
            const text = this.jsAsciiTruncatedString(value)

            return this.createRenderedLine(text, this._pc.yellowBright(text))
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

            return this.createRenderedLine(text, this._pc.magentaBright(text))
        }

        if (value instanceof Error) {
            return this.formatErrorSummary(value)
        }

        if (depth >= this._tblInspect.depth) {
            const text = Array.isArray(value) ? '[Array]' : '[Object]'

            return this.createCollapsedValueLine(text)
        }

        if (Array.isArray(value)) {
            return this.inspectArray(value, depth)
        }

        return this.inspectObject(value as Record<string, unknown>, depth)
    }

    private stringifyError(error: Error): RenderedCell {
        return {
            lines: [
                this.formatErrorSummary(error),
                ...this.getErrorStackLines(error).map((line) => this.formatErrorStackLine(line)),
                ...this.getErrorExtraPropertyLines(error),
                ...this.getErrorDetailLines(error),
            ],
        }
    }

    private getErrorStackLines(error: Error): string[] {
        if (error.stack == null || error.stack === '') {
            return []
        }

        const lines = error.stack.split('\n').map((line) => line.trimEnd())
        const summaryLines = this.getErrorSummary(error)
            .split('\n')
            .map((line) => line.trimEnd())

        if (summaryLines.every((line, index) => lines[index] === line)) {
            return lines.slice(summaryLines.length)
        }

        const [firstLine, ...remainingLines] = lines
        if (firstLine != null && !this.isErrorStackFrameLine(firstLine)) {
            return remainingLines
        }

        return lines
    }

    private isErrorStackFrameLine(line: string): boolean {
        return /^\s*at\b/u.test(line)
    }

    private getErrorSummary(error: Error): string {
        if (error.name === '') {
            return error.message
        }

        return error.message === '' ? error.name : `${error.name}: ${error.message}`
    }

    private formatErrorSummary(error: Error): RenderedLine {
        if (error.name === '') {
            return this.createRenderedLine(error.message, this._pc.white(error.message))
        }

        if (error.message === '') {
            return this.createRenderedLine(error.name, this._pc.redBright(error.name))
        }

        return this.joinRenderedLines(
            this.joinRenderedLines(
                this.createRenderedLine(error.name, this._pc.redBright(error.name)),
                this.createRenderedLine(': ', this._pc.blackBright(': ')),
            ),
            this.createRenderedLine(error.message, this._pc.white(error.message)),
        )
    }

    private formatErrorStackLine(line: string): RenderedLine {
        const frame = this.parseErrorStackFrame(line)

        if (frame == null) {
            return this.createRenderedLine(line, this._pc.blackBright(line))
        }

        const prefix = this.createRenderedLine(
            `${frame.indent}at `,
            this._pc.blackBright(`${frame.indent}at `),
        )
        const location = this.formatErrorStackLocation(frame.location)

        if (frame.callee == null || frame.callee === '') {
            return this.joinRenderedLines(prefix, location)
        }

        const callee = this.formatErrorStackCallee(frame.callee)

        if (!frame.wrappedLocation) {
            return this.joinRenderedLines(
                this.joinRenderedLines(prefix, callee),
                this.joinRenderedLines(this.createRenderedLine(' '), location),
            )
        }

        return this.joinRenderedLines(
            this.joinRenderedLines(
                this.joinRenderedLines(prefix, callee),
                this.createRenderedLine(' (', this._pc.blackBright(' (')),
            ),
            this.joinRenderedLines(
                location,
                this.createRenderedLine(')', this._pc.blackBright(')')),
            ),
        )
    }

    private parseErrorStackFrame(line: string): ErrorStackFrame | null {
        const wrappedLocation = /^(?<indent>\s*)at\s+(?<callee>.*?)\s+\((?<location>.*)\)$/u.exec(
            line,
        )

        if (wrappedLocation?.groups != null) {
            return {
                callee: wrappedLocation.groups.callee,
                indent: wrappedLocation.groups.indent,
                location: wrappedLocation.groups.location,
                wrappedLocation: true,
            }
        }

        const locationOnly = /^(?<indent>\s*)at\s+(?<location>.+)$/u.exec(line)

        if (locationOnly?.groups == null) {
            return null
        }

        return {
            indent: locationOnly.groups.indent,
            location: locationOnly.groups.location,
            wrappedLocation: false,
        }
    }

    private formatErrorStackCallee(callee: string): RenderedLine {
        if (callee.startsWith('<') && callee.endsWith('>')) {
            return this.createRenderedLine(callee, this._pc.blackBright(callee))
        }

        return this.createRenderedLine(callee, this._pc.italic(this._pc.white(callee)))
    }

    private formatErrorStackLocation(location: string): RenderedLine {
        const parsedLocation = /^(?<filepath>.*):(?<line>\d+)(?::(?<column>\d+))?$/u.exec(location)

        if (parsedLocation?.groups == null) {
            return this.createRenderedLine(location, this._pc.blackBright(location))
        }

        const filepath = this.getRelativeErrorFilePath(parsedLocation.groups.filepath)
        const line = parsedLocation.groups.line
        const column = parsedLocation.groups.column

        let renderedLocation = this.joinRenderedLines(
            this.createRenderedLine(filepath, this._pc.cyanBright(filepath)),
            this.joinRenderedLines(
                this.createRenderedLine(':', this._pc.blackBright(':')),
                this.createRenderedLine(line, this._pc.yellowBright(line)),
            ),
        )

        if (column != null) {
            renderedLocation = this.joinRenderedLines(
                renderedLocation,
                this.joinRenderedLines(
                    this.createRenderedLine(':', this._pc.blackBright(':')),
                    this.createRenderedLine(column, this._pc.yellowBright(column)),
                ),
            )
        }

        return renderedLocation
    }

    private getRelativeErrorFilePath(filepath: string): string {
        const normalizedFilePath = this.normalizeErrorFilePath(filepath)

        if (this.isWin32AbsoluteErrorFilePath(normalizedFilePath)) {
            return path.win32.relative(this._errorRootPath, normalizedFilePath) || '.'
        }

        if (path.posix.isAbsolute(normalizedFilePath)) {
            return path.posix.relative(this._errorRootPath, normalizedFilePath) || '.'
        }

        return normalizedFilePath
    }

    private isWin32AbsoluteErrorFilePath(filepath: string): boolean {
        return /^[a-z]:[\\/]/iu.test(filepath) || /^[\\/]{2}/u.test(filepath)
    }

    private normalizeErrorFilePath(filepath: string): string {
        if (!filepath.startsWith('file://')) {
            return filepath
        }

        try {
            return fileURLToPath(filepath)
        } catch {
            return filepath
        }
    }

    private getErrorExtraPropertyLines(error: Error): RenderedLine[] {
        const keys = this.getErrorExtraPropertyKeys(error)

        return keys.flatMap((key) => {
            const labelText = `${this.formatPropertyKey(key)}: `
            const label = this.createRenderedLine(labelText, this._pc.white(labelText))
            const seen = new WeakSet<object>()
            seen.add(error)
            const [firstLine = this.createRenderedLine(''), ...remainingLines] =
                this.inspectPrettyValue(Reflect.get(error, key), 0, seen)

            return [
                this.joinRenderedLines(label, firstLine),
                ...remainingLines.map((line) => this.indentRenderedLine(line, '  ')),
            ]
        })
    }

    private getErrorExtraPropertyKeys(error: Error): (string | symbol)[] {
        return [
            ...Object.keys(error),
            ...Object.getOwnPropertySymbols(error).filter((symbol) =>
                Object.prototype.propertyIsEnumerable.call(error, symbol),
            ),
        ].filter((key) => !ERROR_STANDARD_PROPERTIES.has(key))
    }

    private getErrorDetailLines(error: Error): RenderedLine[] {
        const lines: RenderedLine[] = []
        const cause = 'cause' in error ? error.cause : undefined

        if (cause !== undefined) {
            lines.push(this.createRenderedLine('cause:', this._pc.blackBright('cause:')))
            lines.push(this.indentRenderedLine(this.inspectValue(cause, 0), '  '))
        }

        if (error instanceof AggregateError) {
            const errors = Array.from(error.errors)

            if (errors.length > 0) {
                lines.push(this.createRenderedLine('errors:', this._pc.blackBright('errors:')))

                for (const item of errors) {
                    lines.push(this.indentRenderedLine(this.inspectValue(item, 0), '  - '))
                }
            }
        }

        return lines
    }

    private inspectPrettyValue(
        value: unknown,
        depth: number,
        seen: WeakSet<object>,
    ): RenderedLine[] {
        if (value instanceof Error) {
            return this.stringifyError(value).lines
        }

        if (value == null || typeof value !== 'object') {
            return [this.inspectValue(value, depth)]
        }

        if (seen.has(value)) {
            return [this.createRenderedLine('[Circular]', this._pc.blackBright('[Circular]'))]
        }

        if (depth >= this._logInspect.depth) {
            const text = Array.isArray(value) ? '[Array]' : '[Object]'

            return [this.createCollapsedValueLine(text)]
        }

        seen.add(value)

        try {
            if (Array.isArray(value)) {
                return this.inspectPrettyArray(value, depth, seen)
            }

            return this.inspectPrettyObject(value, depth, seen)
        } finally {
            seen.delete(value)
        }
    }

    private inspectPrettyArray(
        value: readonly unknown[],
        depth: number,
        seen: WeakSet<object>,
    ): RenderedLine[] {
        if (value.length === 0) {
            return [this.createRenderedLine('[]')]
        }

        const visibleItems = value.slice(0, this._logInspect.maxArrayLength)
        const hasMore = value.length > visibleItems.length
        const entries = visibleItems.map((item, index) => {
            const lines = Object.prototype.hasOwnProperty.call(value, index)
                ? this.inspectPrettyValue(item, depth + 1, seen)
                : [this.createRenderedLine('[empty]', this._pc.blackBright('[empty]'))]

            return index === visibleItems.length - 1 && !hasMore
                ? lines
                : this.appendToLastRenderedLine(lines, this.createSeparatorLine(','))
        })
        const suffix = hasMore
            ? [
                  [
                      this.createRenderedLine(
                          `...${value.length - entries.length} more`,
                          this._pc.blackBright(`...${value.length - entries.length} more`),
                      ),
                  ],
              ]
            : []

        return [
            this.createRenderedLine('['),
            ...[...entries, ...suffix].flatMap((lines) =>
                lines.map((line) => this.indentRenderedLine(line, '  ')),
            ),
            this.createRenderedLine(']'),
        ]
    }

    private inspectPrettyObject(
        value: object,
        depth: number,
        seen: WeakSet<object>,
    ): RenderedLine[] {
        const keys = [
            ...Object.keys(value),
            ...Object.getOwnPropertySymbols(value).filter((symbol) =>
                Object.prototype.propertyIsEnumerable.call(value, symbol),
            ),
        ]

        if (keys.length === 0) {
            return [this.createRenderedLine('{}')]
        }

        const visibleKeys = keys.slice(0, this._logInspect.maxObjectKeys)
        const hasMore = keys.length > visibleKeys.length
        const entries = visibleKeys.map((key, index) => {
            const keyText = this.formatPropertyKey(key)
            const label = this.joinRenderedLines(
                this.createRenderedLine(keyText, this._pc.white(keyText)),
                this.createSeparatorLine(': '),
            )
            const lines = this.inspectPrettyValue(
                (value as Record<PropertyKey, unknown>)[key],
                depth + 1,
                seen,
            )
            const [firstLine = this.createRenderedLine(''), ...remainingLines] =
                index === visibleKeys.length - 1 && !hasMore
                    ? lines
                    : this.appendToLastRenderedLine(lines, this.createSeparatorLine(','))

            return [
                this.joinRenderedLines(label, firstLine),
                ...remainingLines.map((line) => this.indentRenderedLine(line, '  ')),
            ]
        })
        const suffix = hasMore
            ? [
                  [
                      this.createRenderedLine(
                          `...${keys.length - entries.length} more`,
                          this._pc.blackBright(`...${keys.length - entries.length} more`),
                      ),
                  ],
              ]
            : []

        return [
            this.createRenderedLine('{'),
            ...[...entries, ...suffix].flatMap((lines) =>
                lines.map((line) => this.indentRenderedLine(line, '  ')),
            ),
            this.createRenderedLine('}'),
        ]
    }

    private formatPropertyKey(key: string | symbol): string {
        return typeof key === 'symbol' ? `[${key.toString()}]` : this.formatObjectKey(key)
    }

    private appendToLastRenderedLine(lines: RenderedLine[], suffix: RenderedLine): RenderedLine[] {
        if (lines.length === 0) {
            return [suffix]
        }

        return lines.map((line, index) =>
            index === lines.length - 1 ? this.joinRenderedLines(line, suffix) : line,
        )
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
            const keyText = this.formatObjectKey(key)

            return this.joinRenderedLines(
                this.joinRenderedLines(
                    this.createRenderedLine(keyText, this._pc.white(keyText)),
                    this.createSeparatorLine(':'),
                ),
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
                this.joinRenderedLines(result, this.createSeparatorLine(separator)),
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

    private createSeparatorLine(text: string): RenderedLine {
        return this.createRenderedLine(text, this._pc.blackBright(text))
    }

    private createCollapsedValueLine(text: string): RenderedLine {
        return this.createRenderedLine(text, this._pc.magentaBright(text))
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

    private jsAsciiTruncatedString(value: string): string {
        const truncatedValue = this.truncateString(value)

        if (truncatedValue === value) {
            return jsAsciiString(value)
        }

        return this.appendToStringLiteral(jsAsciiString(truncatedValue.slice(0, -1)), '…')
    }

    private appendToStringLiteral(value: string, suffix: string): string {
        return value.slice(0, -1) + suffix + value.slice(-1)
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

    private indentRenderedLine(line: RenderedLine, indent: string): RenderedLine {
        return this.joinRenderedLines(this.createRenderedLine(indent), line)
    }

    private trimRenderedLineStart(line: RenderedLine): RenderedLine {
        const trimmedPlain = line.plain.trimStart()
        const removedLength = line.plain.length - trimmedPlain.length

        if (removedLength === 0 || line.text !== line.plain) {
            return line.text === line.plain
                ? this.createRenderedLine(trimmedPlain)
                : this.trimRenderedChars(line, 'start')
        }

        return this.createRenderedLine(trimmedPlain)
    }

    private trimRenderedLineEnd(line: RenderedLine): RenderedLine {
        const trimmedPlain = line.plain.trimEnd()

        if (line.text !== line.plain) {
            return this.trimRenderedChars(line, 'end')
        }

        return this.createRenderedLine(trimmedPlain)
    }

    private trimRenderedChars(line: RenderedLine, side: 'start' | 'end'): RenderedLine {
        const chars = this.splitRenderedChars(line)

        while (chars.length > 0) {
            const index = side === 'start' ? 0 : chars.length - 1

            if (!/\s/u.test(chars[index].plain)) {
                break
            }

            chars.splice(index, 1)
        }

        return this.joinRenderedLineParts(chars)
    }

    private splitRenderedLine(line: RenderedLine): RenderedLine[] {
        if (line.text !== line.plain) {
            return this.splitRenderedWords(line)
        }

        return line.plain.split(/(\s+)/u).map((part) => this.createRenderedLine(part))
    }

    private splitRenderedChars(line: RenderedLine): RenderedLine[] {
        if (line.text !== line.plain) {
            return this.splitAnsiRenderedChars(line)
        }

        return [...line.plain].map((char) => this.createRenderedLine(char))
    }

    private splitRenderedWords(line: RenderedLine): RenderedLine[] {
        const words: RenderedLine[] = []
        let currentWord: RenderedLine[] = []
        let currentIsSpace: boolean | null = null

        for (const char of this.splitRenderedChars(line)) {
            const isSpace = /\s/u.test(char.plain)

            if (currentIsSpace != null && currentIsSpace !== isSpace) {
                words.push(this.joinRenderedLineParts(currentWord))
                currentWord = []
            }

            currentWord.push(char)
            currentIsSpace = isSpace
        }

        if (currentWord.length > 0) {
            words.push(this.joinRenderedLineParts(currentWord))
        }

        return words
    }

    private splitAnsiRenderedChars(line: RenderedLine): RenderedLine[] {
        const chars: RenderedLine[] = []
        const activeCodes = new Map<string, string>()
        let plainIndex = 0

        for (let textIndex = 0; textIndex < line.text.length; ) {
            ANSI_PATTERN.lastIndex = textIndex

            const match = ANSI_PATTERN.exec(line.text)

            if (match != null && match.index === textIndex) {
                this.applyAnsiCode(activeCodes, match[0])
                textIndex += match[0].length
                continue
            }

            const char = [...line.text.slice(textIndex)][0]

            if (char == null) {
                break
            }

            const plainChar = [...line.plain.slice(plainIndex)][0]
            const activePrefix = [...activeCodes.values()].join('')

            chars.push(
                this.createRenderedLine(
                    plainChar ?? char,
                    activePrefix === '' ? char : activePrefix + char + ANSI_RESET,
                ),
            )

            textIndex += char.length
            plainIndex += (plainChar ?? char).length
        }

        return chars
    }

    private applyAnsiCode(activeCodes: Map<string, string>, code: string): void {
        if (!code.endsWith('m')) {
            return
        }

        const params = code
            .slice(2, -1)
            .split(';')
            .filter((part) => part !== '')
            .map((part) => Number(part))

        if (params.length === 0 || params.includes(0)) {
            activeCodes.clear()
            return
        }

        for (const param of params) {
            const category = this.getAnsiCategory(param)

            if (category == null) {
                continue
            }

            if (this.isAnsiCloseCode(param)) {
                activeCodes.delete(category)
            } else {
                activeCodes.set(category, code)
            }
        }
    }

    private getAnsiCategory(param: number): string | null {
        if (param === 1 || param === 2 || param === 22) {
            return 'intensity'
        }

        if (param === 3 || param === 23) {
            return 'italic'
        }

        if (param === 4 || param === 24) {
            return 'underline'
        }

        if (param === 7 || param === 27) {
            return 'inverse'
        }

        if (param === 8 || param === 28) {
            return 'hidden'
        }

        if (param === 9 || param === 29) {
            return 'strikethrough'
        }

        if (
            (param >= 30 && param <= 37) ||
            (param >= 90 && param <= 97) ||
            param === 38 ||
            param === 39
        ) {
            return 'foreground'
        }

        if (
            (param >= 40 && param <= 47) ||
            (param >= 100 && param <= 107) ||
            param === 48 ||
            param === 49
        ) {
            return 'background'
        }

        return null
    }

    private isAnsiCloseCode(param: number): boolean {
        return (
            param === 22 ||
            param === 23 ||
            param === 24 ||
            param === 27 ||
            param === 28 ||
            param === 29 ||
            param === 39 ||
            param === 49
        )
    }

    private joinRenderedLineParts(parts: RenderedLine[]): RenderedLine {
        return parts.reduce(
            (line, part) => this.joinRenderedLines(line, part),
            this.createRenderedLine(''),
        )
    }

    private createRowLines(
        row: RenderedLine[][],
        widths: number[],
        layout: TableLayout,
        alignments?: CellAlignment[],
    ): string[] {
        const height = Math.max(...row.map((cell) => cell.length))
        const lines: string[] = []

        for (let lineIndex = 0; lineIndex < height; lineIndex++) {
            lines.push(
                this.createLine(
                    row.map((cell) => [cell[lineIndex] ?? this.createRenderedLine('')]),
                    widths,
                    layout,
                    alignments,
                ),
            )
        }

        return lines
    }

    private createLine(
        cells: RenderedLine[][],
        widths: number[],
        layout: TableLayout,
        alignments?: CellAlignment[],
    ): string {
        const padding = ' '.repeat(layout.padding)
        const line = cells
            .map(
                (cell, index) =>
                    padding +
                    this.padCell(
                        cell[0] ?? this.createRenderedLine(''),
                        widths[index],
                        alignments?.[index] ?? 'left',
                    ) +
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

    private stripeVerticalTableRow(line: string, index: number): string {
        if (!this._tblStriped || index % 2 === 0) {
            return line
        }

        const colonIndex = line.indexOf(':')

        if (colonIndex === -1) {
            return this.stripeTableRow(line, index)
        }

        return (
            this._pc.bgRgb(24, 24, 24)(line.slice(0, colonIndex + 1)) + line.slice(colonIndex + 1)
        )
    }

    private formatHeaderRow(line: string, density: TableDensity): string {
        if (density !== TableDensity.COMPACT) {
            return line
        }

        // return this._pc.bgHex('#0100A8')(this._pc.bold(this._pc.white(line)))
        return this._pc.bgWhite(this._pc.bold(this._pc.black(line)))
    }

    private padCell(value: RenderedLine, width: number, alignment: CellAlignment = 'left'): string {
        const padding = ' '.repeat(width - this.getCellWidth(value.plain))

        return alignment === 'right' ? padding + value.text : value.text + padding
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
