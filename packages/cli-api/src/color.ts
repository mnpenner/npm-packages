import {Chalk, type ChalkInstance, type ColorSupportLevel} from 'chalk'
import supportsColor from './supports-color'

export type ColorMode = 'always' | 'auto' | 'never'

const DEFAULT_COLOR_LEVEL: ColorSupportLevel = supportsColor.stdout ? supportsColor.stdout.level : 0

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
