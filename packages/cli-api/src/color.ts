import {Chalk, type ChalkInstance, type ColorSupportLevel, supportsColor} from 'chalk'

export type ColorMode = 'always' | 'auto' | 'never'

const DEFAULT_COLOR_LEVEL: ColorSupportLevel = supportsColor ? supportsColor.level : 0

export function getColorLevel(mode: ColorMode): ColorSupportLevel {
    if(mode === 'always') {
        return 3
    }
    if(mode === 'never') {
        return 0
    }
    return DEFAULT_COLOR_LEVEL
}

export function createChalk(mode: ColorMode = 'auto'): ChalkInstance {
    return new Chalk({level: getColorLevel(mode)})
}
