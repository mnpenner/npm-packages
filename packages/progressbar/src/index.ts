import chalk from 'chalk'
import stringWidth from 'string-width'

const defaultPartialBlocks = '▏▎▍▌▋▊▉█'

type ProgressBarColor = 'blueBright' | 'greenBright' | 'redBright'

/**
 * Options that control a [`ProgressBar`]{@link ProgressBar} instance.
 *
 * @example
 * ```ts
 * const progress = new ProgressBar({
 *     max: 100,
 *     partialBlocks: '░▒▓█',
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
     * Characters used for fractional bar segments between whole terminal cells.
     */
    partialBlocks?: string
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
     * progress.current = 5
     * progress.render()
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
     * progress.partialBlocks = '░▒▓█'
     * ```
     */
    partialBlocks: string

    private intFmt: Intl.NumberFormat
    private fracFmt: Intl.NumberFormat
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
        this.width = options.width || Math.max((process.stdout.columns ?? 80) - 50, 16)
        this.msPerFrame = 1000 / 5
        this.partialBlocks = options.partialBlocks ?? defaultPartialBlocks
        this.intFmt = Intl.NumberFormat(undefined, {})
        this.fracFmt = Intl.NumberFormat(undefined, {
            minimumFractionDigits: 1,
            // maximumFractionDigits: 1.
            maximumSignificantDigits: 5,
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

    /**
     * Render the progress bar if enough time has elapsed since the last frame.
     *
     * @example
     * ```ts
     * progress.current = 5
     * progress.render()
     * ```
     *
     * @returns Nothing.
     */
    render() {
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

    /**
     * Render the progress bar immediately using the normal completion color.
     *
     * @example
     * ```ts
     * progress.renderNow()
     * ```
     *
     * @returns Nothing.
     */
    renderNow() {
        this._renderNow('greenBright')
    }

    /** @internal */
    _renderNow(fgColor: ProgressBarColor) {
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
                fullLine += ` │ ${estimatedRemaining.toFixed(1)}s`
            }

            const itemsPerSecond = this.current > 0 ? this.current / elapsedSeconds : 0
            fullLine += ` │ ${this.fracFmt.format(itemsPerSecond)} it/s`
        }

        if (fullLine === this.lastLine) {
            return
        }

        this.lastLine = fullLine
        this.writeLine(fullLine)
        this.lastRenderTime = Date.now()
    }

    /**
     * Write a full progress line to stdout.
     *
     * @example
     * ```ts
     * progress.writeLine('done')
     * ```
     *
     * @param str - Line content to write.
     * @returns Nothing.
     */
    writeLine(str: string) {
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
        this._renderNow('redBright')
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
        this._renderNow('blueBright')

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
