#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { applyEdits, modify } from 'jsonc-parser'
import { readFileSync } from 'fs'
import fg from 'fast-glob'
import { dirname, join, resolve,relative } from 'node:path/posix'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const root = resolve(__dirname, '..')


    const path = "tsconfig.json";
    const text = readFileSync(path, "utf8");

// parse
//     const data = parse(text);

    // const edits = modify(text, ['compilerOptions','paths','@mpen/base50'],['ooga booga'],{})


    const formattingOptions = {
        insertSpaces: true,
        tabSize: 2,
    }


    const tsdowns = await fg('packages/*/tsdown.config.ts')

    let edits: ReturnType<typeof modify> = []


    for(const tsdown of tsdowns) {
        let entry = await import(tsdown).then(m => m.default.entry)
        const dir = dirname(tsdown)
        const pkgPath = join(dir, 'package.json')

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

        // console.log(pkg.name)

        function resolveEntry(entry: string|string[]) {
            if (!Array.isArray(entry)) entry = [entry]

            return entry.map(e => relative(root, join(dir, e)))
        }

        if(Array.isArray(entry) || typeof entry === 'string') {

            edits = edits.concat(
                modify(text, ['compilerOptions', 'paths', pkg.name], resolveEntry(entry), {
                    formattingOptions,
                }),
            )
        } else if(typeof entry === 'object') {

            for(const [key, value] of Object.entries(entry)) {

                const pkgPath = join(pkg.name, key)

                edits = edits.concat(
                    modify(text, ['compilerOptions', 'paths', pkgPath], resolveEntry(value), {
                        formattingOptions,
                    }),
                )
            }
        } else {
            console.error(`Invalid entry for ${pkg.name}`,entry)
        }

        // console.log(config)
    }

    const updated = applyEdits(text, edits)

    console.log(updated)

    return 0
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig["values"]
type Positionals = ParsedConfig["positionals"]

if(import.meta.main) {
    const {values, positionals} = parseArgs(PARSE_CONFIG)

    Promise.try(main, values, positionals).then(
        (exitCode) => {
            if(typeof exitCode === "number") {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if(err instanceof $.ShellError) {
                console.error(`Command failed with exit code ${err.exitCode}`)
                process.exitCode = err.exitCode
            } else {
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
