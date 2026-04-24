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
    if(positionals.length < 1) {
        console.error("Usage: import-repo <path-to-hg-repo>")
        return 1
    }

    const repoPath = resolve(positionals[0])
    const name = basename(repoPath)

    // temp dir
    const tmp = mkdtempSync(join(tmpdir(), "hg-import-"))
    const filemapPath = join(tmp, `${name}.filemap`)
    const convertedPath = join(tmp, `${name}-converted`)

    try {
        // filemap
        writeFileSync(filemapPath, `rename . packages/${name}\n`)

        // convert
        await $`hg --config extensions.convert= convert --filemap ${filemapPath} ${repoPath} ${convertedPath}`

        // pull into current repo
        await $`hg pull -f ${convertedPath}`
        await $`hg update`

    } finally {
        // cleanup
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
