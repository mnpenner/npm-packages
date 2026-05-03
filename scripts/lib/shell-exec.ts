import { $ } from 'bun'
import chalk from 'chalk'

type ShellPromise = ReturnType<typeof $>

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
