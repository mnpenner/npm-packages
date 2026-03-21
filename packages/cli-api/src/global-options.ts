import type {AnyApp, Option} from './interfaces'
import {OptType} from './interfaces'

type InternalAppMetadata = AnyApp & {
    globalOptions?: Option[]
    _globalOptions?: Option[]
}

export const HELP_OPTION: Option = {
    name: 'help',
    alias: 'h',
    description: 'Show help text',
    type: OptType.BOOL,
    valueNotRequired: true,
    valueIfSet: true,
}

export const COLOR_OPTION: Option = {
    name: 'color',
    description: 'Control ANSI color output.',
    type: OptType.ENUM,
    enumValues: ['always', 'never', 'auto'] as const,
    valuePlaceholder: 'WHEN',
    valueNotRequired: true,
    valueIfSet: 'always',
    noPrefix: true,
    valueIfNoPrefix: 'never',
    defaultValue: 'auto',
}

export function getGlobalOptions(app: AnyApp): Option[] {
    const metadata = app as InternalAppMetadata
    return [HELP_OPTION, COLOR_OPTION, ...(metadata._globalOptions ?? metadata.globalOptions ?? [])]
}
