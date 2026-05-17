/* global document */
import { BrowserLogger } from '../../src/loggers/browser.ts'
import { LogLevel } from '../../src/logger.ts'
import { MIXED_VALUE_ROWS, SERVICE_ROWS, TASK_ROWS } from '../data.ts'

const logger = new BrowserLogger()
const warnLogger = new BrowserLogger({ minLogLevel: LogLevel.WARN })

const circular = { name: 'circular root' }
circular.self = circular

const sampleUser = {
    id: 7,
    name: 'Ada Lovelace',
    active: true,
    createdAt: new Date('2026-05-16T12:34:56.000Z'),
    roles: new Set(['admin', 'editor']),
    scores: new Map([
        ['accuracy', 0.998],
        ['latency', 12],
    ]),
    pattern: /logger:\s+(?<level>\w+)/iu,
    run(input) {
        return input * 2
    },
    [Symbol.for('source')]: 'browser-example',
}

function runLog() {
    logger.log(
        'debug payload',
        2n,
        Symbol('local'),
        Symbol.for('shared'),
        undefined,
        null,
        MIXED_VALUE_ROWS[0],
    )
}

function runInfo() {
    logger.info('user snapshot', sampleUser, TASK_ROWS)
}

function runWarn() {
    logger.warn('edge cases', [1, undefined, 3], new Array(4), circular, Math.PI, -0, NaN, Infinity)
}

function runError() {
    logger.error('error payload', new Error('Example failure'), Promise.resolve('done'))
}

function runTable() {
    logger.table(SERVICE_ROWS, ['key', 'state', 'ms'])
    logger.table(TASK_ROWS, ['owner', 'task', 'status'])
}

function runFiltering() {
    warnLogger.log('filtered debug')
    warnLogger.info('filtered info')
    warnLogger.warn('visible warning from minLogLevel logger')
    warnLogger.error('visible error from minLogLevel logger')
}

function runAll() {
    runLog()
    runInfo()
    runWarn()
    runError()
    runTable()
    runFiltering()
}

document.querySelector('.actions')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]')

    if (button == null) {
        return
    }

    switch (button.dataset.action) {
        case 'all':
            runAll()
            break
        case 'log':
            runLog()
            break
        case 'info':
            runInfo()
            break
        case 'warn':
            runWarn()
            break
        case 'error':
            runError()
            break
        case 'table':
            runTable()
            break
        case 'filtering':
            runFiltering()
            break
        case 'clear':
            console.clear()
            break
    }
})

runAll()
