import type { Logger, WriteFn } from '../logger';
import { inspect } from 'node:util'
import {createColors, type Colors} from '@mpen/picocolors'
import {stringWidth} from 'bun'

type TableRow = Record<string, unknown>

enum TableDensity {
    AUTO = 'auto',
    COMPACT ='compact',
    BALANCED = 'balanced',
    COMFORTABLE = 'comfortable',
}

interface TableOptions {
    density?: TableDensity
    maxWidth?: number
    /**
     * @defaultValue false
     */
    showIndex?: boolean
    /**
     * @defaultValue true
     */
    striped?: boolean
}

interface EmojiLoggerOptions {
    color?: boolean
    table?: TableOptions
    write?: WriteFn
}

const INFO_ICON = '\u2139\uFE0F'
const WARN_ICON = '\u{1F6A7}'
const ERROR_ICON = '\u274C'

const DEFAULT_WRITE_FN: WriteFn = (str) => process.stdout.write(str + '\n')

export class EmojiLogger implements Logger {
    private readonly  _pc: Colors
    private readonly  _write: WriteFn
    private readonly  _tblDensity: TableDensity
    private readonly  _tblStriped: boolean
    private readonly  _tblIndex: boolean
    private readonly  _tblMaxWidth: number|null

    constructor(options?: EmojiLoggerOptions) {
        this._write = options?.write ?? DEFAULT_WRITE_FN
        this._pc = createColors(options?.color)
        this._tblDensity = options?.table?.density ?? TableDensity.AUTO
        this._tblStriped = options?.table?.striped ?? true
        this._tblMaxWidth = options?.table?.maxWidth ?? null
        this._tblIndex = options?.table?.showIndex ?? false
    }

    info(...data: any[]): void {
        this._write(INFO_ICON+ ' ' + data.map((x) => String(x)).join('  ') + '\n')
    }

    warn(...data: any[]): void {
        this._write(WARN_ICON+' ' + data.map((x) => this._pc.yellow(x)).join('  ') + '\n')
    }

    error(...data: any[]): void {
        this._write(ERROR_ICON+' ' + data.map((x) => this._pc.red(x)).join('  ') + '\n')
    }


    table(tabularData?: any, properties?: string[]): void {
        const rows = this.toRows(tabularData)
        const columns = this.getColumns(rows, properties)

        if(columns.length === 0) {
            this._write('(empty)\n')
            return
        }

        const renderedRows = rows.map((row) => columns.map((column) => this.stringifyCell(row[column])))
        const widths = this.getColumnWidths(columns, renderedRows)
        const wrappedColumns = columns.map((column, index) => this.wrapCell([column], widths[index]))
        const wrappedRows = renderedRows.map((row) => row.map((cell, index) => this.wrapCell(cell, widths[index])))

        const top = this.createBorder('┌', '┬', '┐', widths)
        const headerSeparator = this.createBorder('╞', '╪', '╡', widths, '═')
        const bottom = this.createBorder('└', '┴', '┘', widths)
        const lines = [
            top,
            ...this.createRowLines(wrappedColumns, widths),
            headerSeparator,
            ...wrappedRows.flatMap((row, index) => this.createRowLines(row, widths).map((line) => this.stripeTableRow(line, index))),
            bottom,
        ]

        this._write(lines.join('\n') + '\n')
    }

    private toRows(tabularData: unknown): TableRow[] {
        if(tabularData == null) {
            return []
        }

        if(Array.isArray(tabularData)) {
            return tabularData.map((value) => this.toRow(value))
        }

        if(typeof tabularData === 'object') {
            return Object.values(tabularData).map((value) => this.toRow(value))
        }

        return [{ Values: tabularData }]
    }

    private toRow(value: unknown): TableRow {
        if(value != null && typeof value === 'object' && !Array.isArray(value)) {
            return value as Record<string, unknown>
        }

        return { Values: value }
    }

    private getColumns(rows: TableRow[], properties?: string[]): string[] {
        if(properties != null) {
            return properties
        }

        const columns = new Set<string>()

        for(const row of rows) {
            for(const column of Object.keys(row)) {
                columns.add(column)
            }
        }

        return [...columns]
    }

    private stringifyCell(value: unknown): string[] {
        if(value === undefined) {
            return ['']
        }

        if(typeof value === 'string') {
            return value.split('\n')
        }

        if(typeof value === 'bigint') {
            return [`${value.toString()}n`]
        }

        if(typeof value === 'symbol') {
            return [value.toString()]
        }

        if(typeof value === 'function') {
            return [value.name === '' ? '[Function]' : `[Function: ${value.name}]`]
        }

        if(value != null && typeof value === 'object') {
            return [inspect(value, { breakLength: Infinity, compact: true })]
        }

        return [String(value)]
    }

    private getColumnWidths(columns: string[], rows: string[][][]): number[] {
        const overheadWidth = columns.length * 3 + 1
        const availableWidth = Math.max(this.getTerminalWidth() - overheadWidth, columns.length)
        const columnMeasurements = columns.map((column, columnIndex) => {
            const widths = [
                this.getCellWidth(column),
                ...rows.flatMap((row) => row[columnIndex].map((line) => this.getCellWidth(line))),
            ]

            return {
                header: this.getCellWidth(column),
                max: Math.max(...widths),
                median: this.getMedian(widths),
            }
        })
        const maxTotalWidth = columnMeasurements.reduce((total, column) => total + column.max, 0)

        if(maxTotalWidth <= availableWidth) {
            return columnMeasurements.map((column) => column.max)
        }

        const minimumWidths = columnMeasurements.map((column) => {
            return Math.min(column.max, Math.max(column.header, Math.min(column.median, 8)))
        })
        const minimumTotalWidth = minimumWidths.reduce((total, width) => total + width, 0)

        if(minimumTotalWidth <= availableWidth) {
            const remainingWidth = availableWidth - minimumTotalWidth
            const targetWidths = this.distributeProportionalWidth(
                minimumWidths,
                columnMeasurements.map((column) => column.max),
                columnMeasurements.map((column) => column.median),
                remainingWidth,
            )

            return this.distributeRemainingWidth(targetWidths, columnMeasurements.map((column) => column.max), availableWidth)
        }

        const scaledWidths = this.scaleWidths(minimumWidths, availableWidth)

        return this.distributeRemainingWidth(scaledWidths, columnMeasurements.map((column) => column.max), availableWidth)
    }

    private distributeProportionalWidth(widths: number[], maxWidths: number[], weights: number[], availableWidth: number): number[] {
        if(availableWidth <= 0) {
            return widths
        }

        const totalWeight = weights.reduce((total, weight, index) => {
            return widths[index] < maxWidths[index] ? total + weight : total
        }, 0)

        if(totalWeight === 0) {
            return widths
        }

        let distributedWidth = 0

        for(let index = 0; index < widths.length; index++) {
            if(widths[index] >= maxWidths[index]) {
                continue
            }

            const extraWidth = Math.min(
                maxWidths[index] - widths[index],
                Math.floor((weights[index] / totalWeight) * availableWidth),
            )

            widths[index] += extraWidth
            distributedWidth += extraWidth
        }

        return this.distributeRemainingWidth(widths, maxWidths, widths.reduce((total, width) => total + width, 0) + availableWidth - distributedWidth)
    }

    private scaleWidths(widths: number[], availableWidth: number): number[] {
        const totalWidth = widths.reduce((total, width) => total + width, 0)

        if(totalWidth === 0) {
            return widths.map(() => 1)
        }

        return widths.map((width) => Math.max(1, Math.floor((width / totalWidth) * availableWidth)))
    }

    private distributeRemainingWidth(widths: number[], maxWidths: number[], availableWidth: number): number[] {
        let remainingWidth = availableWidth - widths.reduce((total, width) => total + width, 0)

        while(remainingWidth > 0) {
            let distributed = false

            for(let index = 0; index < widths.length && remainingWidth > 0; index++) {
                if(widths[index] < maxWidths[index]) {
                    widths[index]++
                    remainingWidth--
                    distributed = true
                }
            }

            if(!distributed) {
                break
            }
        }

        return widths
    }

    private getMedian(values: number[]): number {
        const sortedValues = values.toSorted((a, b) => a - b)
        const middle = Math.floor(sortedValues.length / 2)

        if(sortedValues.length % 2 === 1) {
            return sortedValues[middle]
        }

        return Math.ceil((sortedValues[middle - 1] + sortedValues[middle]) / 2)
    }

    private getTerminalWidth(): number {
        const streamColumns = (this.stream as { columns?: number }).columns

        if(streamColumns != null && streamColumns > 0) {
            return streamColumns
        }

        if(process.stdout.columns != null && process.stdout.columns > 0) {
            return process.stdout.columns
        }

        if(process.stderr.columns != null && process.stderr.columns > 0) {
            return process.stderr.columns
        }

        return 80
    }

    private wrapCell(lines: string[], width: number): string[] {
        return lines.flatMap((line) => this.wrapLine(line, width))
    }

    private wrapLine(line: string, width: number): string[] {
        if(line === '') {
            return ['']
        }

        const wrappedLines: string[] = []
        let currentLine = ''

        for(const word of line.split(/(\s+)/u)) {
            if(word === '') {
                continue
            }

            if(this.getCellWidth(word) > width) {
                if(currentLine.trimEnd() !== '') {
                    wrappedLines.push(currentLine.trimEnd())
                    currentLine = ''
                }

                wrappedLines.push(...this.breakWord(word, width))
                continue
            }

            const candidateLine = currentLine + word

            if(currentLine !== '' && this.getCellWidth(candidateLine.trimEnd()) > width) {
                wrappedLines.push(currentLine.trimEnd())
                currentLine = word.trimStart()
            } else {
                currentLine = candidateLine
            }
        }

        if(currentLine.trimEnd() !== '') {
            wrappedLines.push(currentLine.trimEnd())
        }

        return wrappedLines.length === 0 ? [''] : wrappedLines
    }

    private breakWord(word: string, width: number): string[] {
        const lines: string[] = []
        let currentLine = ''

        for(const char of word) {
            const candidateLine = currentLine + char

            if(currentLine !== '' && this.getCellWidth(candidateLine) > width) {
                lines.push(currentLine)
                currentLine = char
            } else {
                currentLine = candidateLine
            }
        }

        if(currentLine !== '') {
            lines.push(currentLine)
        }

        return lines
    }

    private createRowLines(row: string[][], widths: number[]): string[] {
        const height = Math.max(...row.map((cell) => cell.length))
        const lines: string[] = []

        for(let lineIndex = 0; lineIndex < height; lineIndex++) {
            lines.push(this.createLine(row.map((cell) => [cell[lineIndex] ?? '']), widths))
        }

        return lines
    }

    private createLine(cells: string[][], widths: number[]): string {
        return '│ ' + cells.map((cell, index) => this.padCell(cell[0] ?? '', widths[index])).join(' │ ') + ' │'
    }

    private createBorder(left: string, middle: string, right: string, widths: number[], horizontal = '─'): string {
        return left + widths.map((width) => horizontal.repeat(width + 2)).join(middle) + right
    }

    private stripeTableRow(line: string, index: number): string {
        if(index % 2 === 0) {
            return line
        }

        return this._pc.bgRgb(24, 24, 24)(line)
    }

    private padCell(value: string, width: number): string {
        return value + ' '.repeat(width - this.getCellWidth(value))
    }

    private getCellWidth(value: string): number {
        return stringWidth(value)
    }
}
