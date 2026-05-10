import chalk from 'chalk'
import stringWidth from 'string-width'

/**
 * Preset character sets for fractional progress bar segments.
 *
 * @example
 * ```ts
 * const progress = new ProgressBar({
 *     max: 100,
 *     partialBlocks: ProgressBarPartialBlocks.shades,
 * })
 * ```
 */
export const ProgressBarPartialBlocks = {
    /**
     * Left-to-right eighth-block segments.
     */
    smooth: '▏▎▍▌▋▊▉█',

    /**
     * Bottom-to-top block segments.
     */
    vertical: '▁▂▃▄▅▆▇█',

    /**
     * Light-to-heavy shade segments.
     */
    shades: '░▒▓█',
} as const

/**
 * Built-in fractional progress bar segment character sets.
 *
 * @example
 * ```ts
 * const smooth: ProgressBarPartialBlockPreset = ProgressBarPartialBlocks.smooth
 * ```
 */
export type ProgressBarPartialBlockPreset =
    (typeof ProgressBarPartialBlocks)[keyof typeof ProgressBarPartialBlocks]

type ProgressBarColor = 'blueBright' | 'greenBright' | 'redBright'

/**
 * Options that control a [`ProgressBar`]{@link ProgressBar} instance.
 *
 * @example
 * ```ts
 * const progress = new ProgressBar({
 *     max: 100,
 *     partialBlocks: ProgressBarPartialBlocks.shades,
 * })
 * ```
 */
export interface ProgressBarOptions {
    /**
     * The total number of items represented by a complete progress bar.
     */
    max?: number

    /**
     * The rendered bar width in terminal columns.
     */
    width?: number | null

    /**
     * Whether to start rendering immediately when the instance is created.
     */
    start?: boolean

    /**
     * Maximum render frames per second.
     */
    fps?: number

    /**
     * Characters used for fractional bar segments between whole terminal cells.
     */
    partialBlocks?: ProgressBarPartialBlockPreset | string
}

/**
 * Render an updating progress bar to stdout.
 *
 * @example
 * ```ts
 * const progress = new ProgressBar({ max: files.length })
 *
 * for (const file of files) {
 *     await processFile(file)
 *     progress.tick()
 * }
 *
 * progress.complete()
 * ```
 */
export default class ProgressBar {
    /**
     * Current completed item count.
     *
     * @example
     * ```ts
     * progress.update(5)
     * ```
     */
    current = 0

    /**
     * Total item count represented by a complete progress bar.
     *
     * @example
     * ```ts
     * progress.max = 100
     * ```
     */
    max: number

    /**
     * Rendered bar width in terminal columns.
     *
     * @example
     * ```ts
     * progress.width = 40
     * ```
     */
    width: number

    /** @internal */
    msPerFrame: number

    /**
     * Characters used for fractional bar segments between whole terminal cells.
     *
     * @example
     * ```ts
     * progress.partialBlocks = ProgressBarPartialBlocks.shades
     * ```
     */
    partialBlocks: string

    private intFmt: Intl.NumberFormat
    private oneDecimalFmt: Intl.NumberFormat
    private twoDecimalFmt: Intl.NumberFormat
    private lastLine?: string
    private lastRenderTime?: number
    private lastStrLength?: number
    private startTime: bigint = process.hrtime.bigint()

    /**
     * Create a progress bar.
     *
     * @example
     * ```ts
     * const progress = new ProgressBar({ max: 50, width: 30, start: false })
     * progress.start()
     * ```
     *
     * @param options - Progress bar behavior and rendering options.
     */
    constructor(options?: ProgressBarOptions)

    /**
     * Create a progress bar.
     *
     * @example
     * ```ts
     * const progress = new ProgressBar(50, 30, true)
     * ```
     *
     * @param max - The total number of items represented by a complete progress bar.
     * @param width - The rendered bar width in terminal columns.
     * @param start - Whether to start rendering immediately when the instance is created.
     */
    constructor(max?: number, width?: number | null, start?: boolean)

    constructor(
        maxOrOptions: number | ProgressBarOptions = 1,
        width: number | null = null,
        start = true,
    ) {
        const options =
            typeof maxOrOptions === 'object' ? maxOrOptions : { max: maxOrOptions, width, start }

        this.max = options.max ?? 1
        this.width = options.width || Math.max((process.stdout.columns ?? 80) - 40, 16)
        this.msPerFrame = 1000 / (options.fps ?? 30)
        this.partialBlocks = options.partialBlocks ?? ProgressBarPartialBlocks.smooth
        this.intFmt = Intl.NumberFormat(undefined, {})
        this.oneDecimalFmt = Intl.NumberFormat(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        })
        this.twoDecimalFmt = Intl.NumberFormat(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

        if (options.start ?? true) {
            this.start()
        }
    }

    /**
     * Start the progress timer and render the initial bar.
     *
     * @example
     * ```ts
     * const progress = new ProgressBar({ max: 10, start: false })
     * progress.start()
     * ```
     *
     * @returns Nothing.
     */
    start() {
        this.startTime = process.hrtime.bigint()
        this.render()
    }

    private render() {
        if (!this.lastRenderTime || Date.now() - this.lastRenderTime > this.msPerFrame) {
            this.renderNow()
        }
    }

    /**
     * Advance the progress bar by a number of items.
     *
     * @example
     * ```ts
     * progress.tick()
     * progress.tick(5)
     * ```
     *
     * @param items - Number of completed items to add to the current progress.
     * @returns Nothing.
     */
    tick(items = 1) {
        this.update(this.current + items)
    }

    private renderNow() {
        this.renderNowWithColor('greenBright')
    }

    private renderNowWithColor(fgColor: ProgressBarColor) {
        const percent = this.current < this.max ? this.current / this.max : 1
        const innerWidth = this.width - 6
        const percentStr = `${String(Math.floor(percent * 100 + 0.25)).padStart(4, ' ')}%`
        const barLength = percent * innerWidth
        const fullBars = Math.floor(barLength)
        const frac = barLength - fullBars
        const elapsed = process.hrtime.bigint() - this.startTime
        const elapsedSeconds = Number(elapsed / 10_000n) / 1e5

        const quantStr =
            this.current === this.max
                ? chalk.whiteBright(this.intFmt.format(this.max))
                : `${chalk.whiteBright(this.intFmt.format(this.current))}/${chalk.whiteBright(this.intFmt.format(this.max))}`

        let filler = '█'.repeat(fullBars)

        if (frac > 0) {
            const subLen = stringWidth(this.partialBlocks) + 1
            const si = Math.floor(frac * subLen)
            if (si > 0) {
                filler += this.partialBlocks.charAt(si - 1)
            }
        }

        const barStr = chalk.bgBlackBright[fgColor](filler.padEnd(innerWidth, ' '))

        let fullLine = `${percentStr} ${barStr} ${quantStr}`

        if (this.current > 0) {
            let estimatedRemaining = 0
            if (this.current === this.max) {
                estimatedRemaining = elapsedSeconds
            } else if (elapsedSeconds > 0) {
                const progressRate = this.current / elapsedSeconds
                estimatedRemaining = (this.max - this.current) / progressRate
            }

            if (estimatedRemaining >= 60 || elapsedSeconds >= 60) {
                const minutes = Math.floor(estimatedRemaining / 60)
                const seconds = Math.floor(estimatedRemaining % 60)
                fullLine += ` │ ${minutes}m${String(seconds).padStart(2, '0')}s`
            } else {
                const secondsFmt = estimatedRemaining < 10 ? this.twoDecimalFmt : this.oneDecimalFmt
                fullLine += ` │ ${secondsFmt.format(estimatedRemaining)}s`
            }

            const itemsPerSecond = this.current > 0 ? this.current / elapsedSeconds : 0
            const rateFmt = itemsPerSecond < 10 ? this.twoDecimalFmt : this.oneDecimalFmt
            fullLine += ` │ ${rateFmt.format(itemsPerSecond)} it/s`
        }

        if (fullLine === this.lastLine) {
            return
        }

        this.lastLine = fullLine
        this.writeLine(fullLine)
        this.lastRenderTime = Date.now()
    }

    private writeLine(str: string) {
        const len = stringWidth(str)

        if (this.lastStrLength) {
            str = `\r${str}`

            if (this.lastStrLength > len) {
                str += ' '.repeat(this.lastStrLength - len)
            }
        }

        process.stdout.write(str)
        this.lastStrLength = len
    }

    /**
     * Write a log line without permanently disrupting the active progress bar.
     *
     * @example
     * ```ts
     * progress.logLine('Downloaded manifest')
     * progress.tick()
     * ```
     *
     * @param line - Log line to write above the redrawn progress bar.
     * @returns Nothing.
     */
    logLine(line: string) {
        this.clear()
        process.stdout.write(`${line}\n`)
        this.lastLine = undefined
        this.lastStrLength = undefined
        this.renderNow()
    }

    /**
     * Set the absolute current progress and render the bar.
     *
     * @example
     * ```ts
     * progress.update(25)
     * ```
     *
     * @param progress - Absolute current progress value.
     * @returns Nothing.
     */
    update(progress: number) {
        this.current = progress
        this.render()
    }

    /**
     * Mark the current output as interrupted and write a newline.
     *
     * @example
     * ```ts
     * progress.interrupt()
     * ```
     *
     * @returns Nothing.
     */
    interrupt() {
        this.renderNowWithColor('redBright')
        process.stdout.write('\n')
    }

    /**
     * Clear the last rendered progress line.
     *
     * @example
     * ```ts
     * progress.clear()
     * ```
     *
     * @returns Nothing.
     */
    clear() {
        if (this.lastStrLength) {
            process.stdout.write(`\r${' '.repeat(this.lastStrLength)}\r`)
        }
    }

    /**
     * Complete the progress bar, render it in the completion color, and write a newline.
     *
     * @example
     * ```ts
     * progress.complete()
     * ```
     *
     * @returns Nothing.
     */
    complete() {
        this.current = this.max
        this.renderNowWithColor('blueBright')

        process.stdout.write('\n')
    }

    /**
     * Whether the progress value has reached the configured maximum.
     *
     * @example
     * ```ts
     * if (progress.isComplete) {
     *     progress.clear()
     * }
     * ```
     *
     * @returns True when `current` is greater than or equal to `max`.
     */
    get isComplete() {
        return this.current >= this.max
    }
}
