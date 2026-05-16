import { BrowserLogger } from '../../src/loggers/browser.ts'

const logger = new BrowserLogger()

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

const rows = [
    { id: 1, level: 'debug', message: 'Bundled from local source', ms: 8 },
    { id: 2, level: 'info', message: 'Styled DevTools output', ms: 13 },
    { id: 3, level: 'warning', message: 'Native console.table is available', ms: 21 },
]

function runLog() {
    logger.log('debug payload', 2n, Symbol('local'), Symbol.for('shared'), undefined, null)
}

function runInfo() {
    logger.info('user snapshot', sampleUser)
}

function runWarn() {
    logger.warn('edge cases', [1, , 3], new Array(4), circular, Math.PI, -0, NaN, Infinity)
}

function runError() {
    logger.error('error payload', new Error('Example failure'), Promise.resolve('done'))
}

function runTable() {
    logger.table(rows, ['id', 'level', 'message', 'ms'])
}

function runAll() {
    runLog()
    runInfo()
    runWarn()
    runError()
    runTable()
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
        case 'clear':
            console.clear()
            break
    }
})

runAll()
