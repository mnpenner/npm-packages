import * as Util from 'node:util'
import { isString } from '@mpen/is-type'

// TODO: should we export this...? as what?
/** @internal */
function format(...args: any[]) {
    if (args.length === 1 && isString(args[0])) {
        return args[0]
    }
    return args
        .map((o) => Util.inspect(o, { colors: true, depth: 10, showHidden: false }))
        .join(' ')
}

/**
 * Logs values to the console with formatting.
 * @param args - The values to log.
 * @example
 * ```ts
 * log({ foo: 'bar' });
 * ```
 */
export function log(...args: any[]) {
    return console.log(format(...args))
}
