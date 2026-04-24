#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {$} from "bun"
import {basename, resolve, join} from "node:path"
import {mkdtempSync, writeFileSync, rmSync} from "node:fs"
import {tmpdir} from "node:os"

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(_options: Options, positionals: Positionals): Promise<number | void> {
    if(positionals.length !== 1) {
        console.error("Usage: import-repo <path-to-repo>")
        return 1
    }

    const repoPath = resolve(positionals[0].replace(/[\\/]+$/, ""))
    const name = basename(repoPath)
    const packagePath = `packages/${name}`

    const tmp = mkdtempSync(join(tmpdir(), "hg-import-"))
    const filemapPath = join(tmp, `${name}.filemap`)
    const convertedPath = join(tmp, `${name}-converted`)

    console.log(`Source repo:      ${repoPath}`)
    console.log(`Package path:     ${packagePath}`)
    console.log(`Temp dir:         ${tmp}`)

    try {
        console.log(`\nWriting filemap...`)
        writeFileSync(filemapPath, `rename . ${packagePath}\n`)

        console.log(`\nConverting repo into package subdir...`)
        await $`hg --config extensions.convert= convert \
            --filemap ${filemapPath} \
            ${repoPath} \
            ${convertedPath}`

        console.log(`\nPulling converted history into current repo...`)
        await $`hg pull -f ${convertedPath}`

        console.log(`\nMerging imported head...`)
        await $`hg merge -r tip`

        console.log(`\nCommitting merge...`)
        await $`hg commit -m ${`Import ${name} into ${packagePath}`}`

        console.log(`\nImported ${name} into ${packagePath}`)
    } finally {
        console.log(`\nCleaning up temp dir...`)
        rmSync(tmp, {recursive: true, force: true})
    }
}

//#region Invoke main
type _ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = _ParsedConfig["values"]
type Positionals = _ParsedConfig["positionals"]

if(import.meta.main) {
    const {values, positionals} = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
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
                console.error(err ?? "An unknown error occurred")
                process.exitCode = 1
            }
        },
    )
}
//#endregion
