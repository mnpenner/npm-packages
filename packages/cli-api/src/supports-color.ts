// From https://github.com/chalk/chalk/blob/aa06bb5ac3f14df9fda8cfb54274dfc165ddfdef/source/vendor/supports-color/index.js
import os from 'os'
import process from 'process'
import {type WriteStream} from 'tty'

export type Options = {
    /**
    Whether `process.argv` should be sniffed for `--color` and `--no-color` flags.

    @default true
    */
    readonly sniffFlags?: boolean
}

/**
Levels:
- `0` - All colors disabled.
- `1` - Basic 16 colors support.
- `2` - ANSI 256 colors support.
- `3` - Truecolor 16 million colors support.
*/
export type ColorSupportLevel = 0 | 1 | 2 | 3

/**
Detect whether the terminal supports color.
*/
export type ColorSupport = {
    /**
    The color level.
    */
    level: ColorSupportLevel

    /**
    Whether basic 16 colors are supported.
    */
    hasBasic: boolean

    /**
    Whether ANSI 256 colors are supported.
    */
    has256: boolean

    /**
    Whether Truecolor 16 million colors are supported.
    */
    has16m: boolean
}

export type ColorInfo = ColorSupport | false

interface SupportsColorInternalOptions extends Options {
    streamIsTTY?: boolean
}

type StreamLike = Pick<WriteStream, 'isTTY'>

// From: https://github.com/sindresorhus/has-flag/blob/main/index.js
function hasFlag(flag: string, argv: readonly string[] = (globalThis as {Deno?: {args: string[]}}).Deno ? (globalThis as {Deno?: {args: string[]}}).Deno!.args : process.argv): boolean {
    const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--')
    const position = argv.indexOf(prefix + flag)
    const terminatorPosition = argv.indexOf('--')
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition)
}

const {env} = process

let flagForceColor: 0 | 1 | undefined
if(
    hasFlag('no-color')
    || hasFlag('no-colors')
    || hasFlag('color=false')
    || hasFlag('color=never')
) {
    flagForceColor = 0
} else if(
    hasFlag('color')
    || hasFlag('colors')
    || hasFlag('color=true')
    || hasFlag('color=always')
) {
    flagForceColor = 1
}

function envForceColor(): ColorSupportLevel | undefined {
    if('FORCE_COLOR' in env) {
        const forceColor = env.FORCE_COLOR ?? ''
        if(forceColor === 'true') {
            return 1
        }

        if(forceColor === 'false') {
            return 0
        }

        return forceColor.length === 0 ? 1 : Math.min(Number.parseInt(forceColor, 10), 3) as ColorSupportLevel
    }
}

function translateLevel(level: ColorSupportLevel): ColorInfo {
    if(level === 0) {
        return false
    }

    return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3,
    }
}

function supportsColorInternal(haveStream: boolean, {streamIsTTY, sniffFlags = true}: SupportsColorInternalOptions = {}): ColorSupportLevel {
    const noFlagForceColor = envForceColor()
    if(noFlagForceColor !== undefined) {
        flagForceColor = noFlagForceColor === 0 ? 0 : 1
    }

    const forceColor = sniffFlags ? flagForceColor : noFlagForceColor

    if(forceColor === 0) {
        return 0
    }

    if(sniffFlags) {
        if(
            hasFlag('color=16m')
            || hasFlag('color=full')
            || hasFlag('color=truecolor')
        ) {
            return 3
        }

        if(hasFlag('color=256')) {
            return 2
        }
    }

    // Check for Azure DevOps pipelines.
    // Has to be above the `!streamIsTTY` check.
    if('TF_BUILD' in env && 'AGENT_NAME' in env) {
        return 1
    }

    if(haveStream && !streamIsTTY && forceColor === undefined) {
        return 0
    }

    const min = forceColor || 0

    if((env.TERM ?? '') === 'dumb') {
        return min
    }

    if(process.platform === 'win32') {
        // Windows 10 build 10586 is the first Windows release that supports 256 colors.
        // Windows 10 build 14931 is the first release that supports 16m/TrueColor.
        const osRelease = os.release().split('.')
        if(
            Number(osRelease[0]) >= 10
            && Number(osRelease[2]) >= 10_586
        ) {
            return Number(osRelease[2]) >= 14_931 ? 3 : 2
        }

        return 1
    }

    if('CI' in env) {
        if(['GITHUB_ACTIONS', 'GITEA_ACTIONS', 'CIRCLECI'].some(key => key in env)) {
            return 3
        }

        if(['TRAVIS', 'APPVEYOR', 'GITLAB_CI', 'BUILDKITE', 'DRONE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
            return 1
        }

        return min as ColorSupportLevel
    }

    if('TEAMCITY_VERSION' in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION ?? '') ? 1 : 0
    }

    if((env.COLORTERM ?? '') === 'truecolor') {
        return 3
    }

    if((env.TERM ?? '') === 'xterm-kitty' || (env.TERM ?? '') === 'xterm-ghostty' || (env.TERM ?? '') === 'wezterm') {
        return 3
    }

    if('TERM_PROGRAM' in env) {
        const version = Number.parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10)

        switch(env.TERM_PROGRAM) {
            case 'iTerm.app':
                return version >= 3 ? 3 : 2
            case 'Apple_Terminal':
                return 2
        }
    }

    if(/-256(color)?$/i.test(env.TERM ?? '')) {
        return 2
    }

    if(/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM ?? '')) {
        return 1
    }

    if('COLORTERM' in env) {
        return 1
    }

    return min as ColorSupportLevel
}

export function createSupportsColor(stream?: WriteStream, options?: Options): ColorInfo
export function createSupportsColor(stream?: StreamLike, options: Options = {}): ColorInfo {
    const internalOptions: SupportsColorInternalOptions = {...options}
    if(stream?.isTTY !== undefined) {
        internalOptions.streamIsTTY = stream.isTTY
    }

    const level = supportsColorInternal(Boolean(stream), internalOptions)

    return translateLevel(level)
}
