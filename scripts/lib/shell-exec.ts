import { $ } from 'bun'
import chalk from 'chalk'

type ShellPromise = ReturnType<typeof $>

/**
 * Executes a shell command with proper escaping and logging.
 *
 * @example
 * ```ts
 * await sh`echo ${'hello world'}`
 * ```
 *
 * @param cmd - The template strings array.
 * @param vals - The interpolated values.
 * @returns A promise that resolves when the command completes.
 */
export function sh(cmd: TemplateStringsArray, ...vals: any[]): ShellPromise {
    // build a printable command with proper escaping
    const rendered = cmd
        .map((s, i) => {
            if (i >= vals.length) return s
            const v = vals[i]

            // mirror Bun behavior: pass through raw objects
            if (v && typeof v === 'object' && 'raw' in v) return s + String(v.raw)

            // arrays become space-separated escaped args
            if (Array.isArray(v)) return s + v.map((x) => $.escape(String(x))).join(' ')

            return s + $.escape(String(v))
        })
        .join('')

    console.error(chalk.dim.bold.magenta('$ ') + chalk.dim(rendered))
    return $(cmd, ...vals) // execute with Bun’s native escaping
}

/**
 * Executes a shell command using `bun run --bun`.
 *
 * @example
 * ```ts
 * await br`eslint --fix .`
 * ```
 *
 * @param cmd - The template strings array.
 * @param vals - The interpolated values.
 * @returns A promise that resolves when the command completes.
 */
export function br(cmd: TemplateStringsArray, ...vals: any[]): ShellPromise {
    const newCmd = ['bun run --bun ' + cmd[0], ...cmd.slice(1)] as unknown as TemplateStringsArray
    ;(newCmd as any).raw = ['bun run --bun ' + cmd.raw[0], ...cmd.raw.slice(1)]

    return sh(newCmd, ...vals)
}
