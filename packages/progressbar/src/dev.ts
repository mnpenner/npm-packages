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

for (const [name, partialBlocks] of Object.entries(ProgressBarPartialBlocks)) {
    const max = randomMax()

    process.stdout.write(`${name}\n`)

    const progress = new ProgressBar({
        max,
        width: process.stdout.columns - 40,
        partialBlocks,
    })

    for (let current = 1; current <= max; current++) {
        progress.tick()
        await sleep(randomDelayMs())
    }

    progress.complete()
}
