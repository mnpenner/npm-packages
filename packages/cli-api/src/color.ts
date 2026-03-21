import {Chalk, type ChalkInstance, type ColorSupportLevel, supportsColor} from 'chalk'
import type {AnyApp} from './interfaces'

export type ColorMode = 'always' | 'auto' | 'never'

type InternalAppMetadata = AnyApp & {_chalk?: ChalkInstance}

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

export function ensureAppChalk(app: AnyApp): ChalkInstance {
    const metadata = app as InternalAppMetadata
    if(metadata._chalk === undefined) {
        metadata._chalk = createChalk()
    }
    return metadata._chalk
}

export function setAppColorMode(app: AnyApp, mode: ColorMode): ChalkInstance {
    const chalk = createChalk(mode)
    ;(app as InternalAppMetadata)._chalk = chalk
    return chalk
}
