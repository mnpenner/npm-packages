#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {$} from 'bun'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

import { readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const packagesDir = "packages"
    const packages = (await readdir(packagesDir, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

    const results: Array<{ name: string; funcs: number | null; lines: number | null }> = []

    for (const pkg of packages) {
        process.stdout.write(`Checking coverage for ${pkg}... `)
        try {
            const { stdout, stderr } = await $`bun test --coverage`.cwd(join(packagesDir, pkg)).nothrow().quiet()
            const output = stdout.toString() + stderr.toString()
            // Look for "All files                         |   XX.XX |   YY.YY |"
            const match = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/)
            if (match) {
                const funcs = parseFloat(match[1])
                const lines = parseFloat(match[2])
                results.push({ name: pkg, funcs, lines })
                console.log(`F:${funcs}% L:${lines}%`)
            } else {
                results.push({ name: pkg, funcs: null, lines: null })
                console.log("N/A")
            }
        } catch (e) {
            results.push({ name: pkg, funcs: null, lines: null })
            console.log("Error")
        }
    }

    results.sort((a, b) => a.name.localeCompare(b.name))

    let table = "| Package | % Funcs | % Lines |\n| :--- | :--- | :--- |\n"
    for (const { name, funcs, lines } of results) {
        const funcsStr = funcs === null ? "N/A" : `${funcs.toFixed(2)}%`
        const linesStr = lines === null ? "N/A" : `${lines.toFixed(2)}%`
        table += `| \`${name}\` | ${funcsStr} | ${linesStr} |\n`
    }

    const readmePath = "README.md"
    let readme = await readFile(readmePath, "utf-8")
    const startMarker = "<!-- test coverage start -->"
    const endMarker = "<!-- test coverage end -->"

    const startIndex = readme.indexOf(startMarker)
    const endIndex = readme.indexOf(endMarker)

    if (startIndex === -1 || endIndex === -1) {
        throw new Error("Markers not found in README.md")
    }

    readme = 
        readme.substring(0, startIndex + startMarker.length) +
        "\n\n" + table + "\n" +
        readme.substring(endIndex)

    await writeFile(readmePath, readme)
    console.log("README.md updated!")
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
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
