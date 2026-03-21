import {Chalk, type ChalkInstance, type ColorSupportLevel, supportsColor} from 'chalk'
import type {AnyApp, Option} from './interfaces'

export type ColorMode = 'always' | 'auto' | 'never'

type InternalAppMetadata = AnyApp & {_chalk?: ChalkInstance}

const DEFAULT_COLOR_LEVEL = supportsColor ? supportsColor.level : 0

const COLOR_MODES = new Set<ColorMode>(['always', 'auto', 'never'])

let _chalk: ChalkInstance = new Chalk({level: DEFAULT_COLOR_LEVEL})

export const COLOR_OPTION: Option = {
    name: 'color',
    description: 'Control ANSI color output (always, never, auto). Alias: --no-color.',
    type: ['always', 'never', 'auto'] as const,
    valuePlaceholder: 'WHEN',
    valueNotRequired: true,
}

function getColorLevel(mode: ColorMode): ColorSupportLevel {
    if(mode === 'always') {
        return 3
    }
    if(mode === 'never') {
        return 0
    }
    return DEFAULT_COLOR_LEVEL
}

export function getChalk(): ChalkInstance {
    return _chalk
}

export function setColorMode(mode: ColorMode): ChalkInstance {
    _chalk = new Chalk({level: getColorLevel(mode)})
    return _chalk
}

export function setAppColorMode(app: AnyApp, mode: ColorMode): ChalkInstance {
    const chalk = setColorMode(mode)
    ;(app as InternalAppMetadata)._chalk = chalk
    return chalk
}

export function syncAppChalk(app: AnyApp): ChalkInstance {
    const chalk = (app as InternalAppMetadata)._chalk ?? new Chalk({level: DEFAULT_COLOR_LEVEL})
    _chalk = chalk
    return chalk
}

export function isColorMode(value: string): value is ColorMode {
    return COLOR_MODES.has(value as ColorMode)
}
