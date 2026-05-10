import { randomInt } from 'node:crypto'
import ProgressBar, { ProgressBarPartialBlocks } from './index.ts'

const minMax = 50
const maxMax = 2500
const minDelayMs = 1
const maxDelayMs = 30

function randomMax() {
    return randomInt(minMax, maxMax + 1)
}

function randomDelayMs() {
    return randomInt(minDelayMs, maxDelayMs + 1)
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

const enterWaiters = new Set<() => void>()
const isRawModeSupported = process.stdin.isTTY && typeof process.stdin.setRawMode === 'function'
let pendingEnters = 0

function waitForEnter() {
    let resolveEnter = () => {}

    const promise = new Promise<'enter'>((resolve) => {
        resolveEnter = () => {
            enterWaiters.delete(resolveEnter)
            resolve('enter')
        }

        if (pendingEnters > 0) {
            pendingEnters--
            resolveEnter()
            return
        }

        enterWaiters.add(resolveEnter)
    })

    return {
        promise,
        cancel() {
            enterWaiters.delete(resolveEnter)
        },
    }
}

function resolvePendingEnters() {
    while (pendingEnters > 0 && enterWaiters.size > 0) {
        const resolveEnter = enterWaiters.values().next().value

        if (resolveEnter) {
            pendingEnters--
            resolveEnter()
        }
    }
}

function handleInput(data: Buffer) {
    const input = data.toString('utf8')

    if (input.includes('\u0003')) {
        process.exit(130)
    }

    const enterCount = input.replaceAll('\r\n', '\n').match(/[\r\n]/g)?.length ?? 0

    if (enterCount > 0) {
        pendingEnters += enterCount
        resolvePendingEnters()
    }
}

process.stdin.on('data', handleInput)
process.stdin.resume()

if (isRawModeSupported) {
    process.stdin.setRawMode(true)
}

try {
    for (const [name, partialBlocks] of Object.entries(ProgressBarPartialBlocks)) {
        const max = randomMax()
        const logPoints = [
            { progress: Math.ceil(max / 4), message: 'Quarter way there!' },
            { progress: Math.ceil(max / 2), message: 'Half way there!' },
            { progress: Math.ceil((max * 3) / 4), message: 'Three quarters there!' },
        ]
        let interrupted = false

        process.stdout.write(`${name}\n`)

        const progress = new ProgressBar({
            max,
            // width: process.stdout.columns - 40,
            // fps: 144,
            partialBlocks,
        })

        for (let current = 1; current <= max; current++) {
            progress.tick()

            while (logPoints.length > 0 && progress.current >= logPoints[0]!.progress) {
                progress.logLine(logPoints.shift()!.message)
            }

            const enter = waitForEnter()
            const result = await Promise.race([
                sleep(randomDelayMs()).then(() => 'sleep' as const),
                enter.promise,
            ])
            enter.cancel()

            if (result === 'enter') {
                interrupted = true
                break
            }
        }

        if (interrupted) {
            progress.interrupt()
        } else {
            progress.complete()
        }
    }
} finally {
    enterWaiters.clear()
    pendingEnters = 0
    process.stdin.off('data', handleInput)

    if (isRawModeSupported) {
        process.stdin.setRawMode(false)
    }

    process.stdin.pause()
}
