import Chalk from 'chalk'
import {nil} from './util'
import {humanFileSize} from './file-size'

function logResponse(reqId: number, elapsed: number, res: Response) {
    console.log(Chalk.grey(`<${reqId}`) + ` ${formatStatus(res.status)} | ${formatSize(res.headers.get('content-length'))} | ${formatContentType(res.headers.get('content-type'))} | ${formatDuration(elapsed)}`)
}

export function formatDuration(duration: number) {
    if(duration < 5) {
        return Chalk.green(duration.toFixed(2) + 'ms')
    }
    if(duration < 100) {
        return Chalk.yellow(duration.toFixed(1) + 'ms')
    }
    if(duration < 1000) {
        return Chalk.yellow(Math.round(duration) + 'ms')
    }
    return Chalk.red(Intl.NumberFormat(undefined, {maximumFractionDigits: 2}).format(duration / 1000) + 's')
}

export function formatContentType(type: string | nil) {
    if(!type) return Chalk.grey('?')
    return Chalk.whiteBright(type)
}

export function formatSize(size: string | number | nil) {
    if(!size) return Chalk.grey('?')
    const bytes = Number(size)
    if(!Number.isSafeInteger(bytes)) {
        return Chalk.grey(size)
    }
    const fmtSize = humanFileSize(bytes)
    if(bytes < 10 * 1024) {
        return Chalk.whiteBright(fmtSize)
    }
    if(bytes < 1 * 1024 ** 2) {
        return Chalk.yellowBright(fmtSize)
    }
    return Chalk.redBright(fmtSize)
}

export function formatStatus(status: number | nil) {
    if(!status) return Chalk.red('?')
    if(status < 100) return Chalk.redBright(status)
    if(status < 200) return Chalk.blueBright(status)
    if(status < 300) return Chalk.greenBright(status)
    if(status < 400) return Chalk.cyanBright(status)
    if(status < 500) return Chalk.yellowBright(status)
    return Chalk.redBright(status)
}
