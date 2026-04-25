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

    const results: Array<{ 
        dirName: string; 
        displayName: string; 
        version: string;
        hasDocs: boolean;
        funcs: number | null; 
        lines: number | null 
    }> = []

    for (const pkg of packages) {
        process.stdout.write(`Checking coverage for ${pkg}... `)
        
        let displayName = pkg
        let version = "—"
        let hasDocs = false
        const pkgPath = join(packagesDir, pkg)
        try {
            const pkgJson = JSON.parse(await readFile(join(pkgPath, "package.json"), "utf-8"))
            displayName = pkgJson.name || pkg
            version = pkgJson.version || "—"
            const s = pkgJson.scripts || {}
            hasDocs = !!(s.docs || s['build:docs'])
        } catch (e) {
            // No package.json or invalid
        }

        try {
            const { stdout, stderr } = await $`bun test --coverage`.cwd(pkgPath).nothrow().quiet()
            const output = stdout.toString() + stderr.toString()
            // Look for "All files                         |   XX.XX |   YY.YY |"
            const match = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/)
            if (match) {
                const funcs = parseFloat(match[1])
                const lines = parseFloat(match[2])
                results.push({ dirName: pkg, displayName, version, hasDocs, funcs, lines })
                console.log(`F:${funcs}% L:${lines}%`)
            } else {
                results.push({ dirName: pkg, displayName, version, hasDocs, funcs: null, lines: null })
                console.log("—")
            }
        } catch (e) {
            results.push({ dirName: pkg, displayName, version, hasDocs, funcs: null, lines: null })
            console.log("Error")
        }
    }

    results.sort((a, b) => a.displayName.localeCompare(b.displayName))

    let table = "| Package | Version | Directory | Size | Coverage | Documentation |\n"
    table += "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
    for (const { dirName, displayName, version, hasDocs, funcs, lines } of results) {
        const funcsStr = funcs === null ? "—" : `${funcs.toFixed(0)}% 𝑓`
        const linesStr = lines === null ? "—" : `${lines.toFixed(0)}% L`
        const coverageStr = (funcs === null && lines === null) ? "—" : `${funcsStr} / ${linesStr}`
        const dirLink = `[${dirName}](https://github.com/mnpenner/npm-packages/tree/main/packages/${dirName})`
        const docsLink = hasDocs ? `[Docs](https://mnpenner.github.io/npm-packages/${dirName}/) ` : "—"
        const sizeLink = `[Size](https://pkg-size.dev/${displayName})`
        table += `| \`${displayName}\` | ${version} | ${dirLink} | ${sizeLink} | ${coverageStr} | ${docsLink} |\n`
    }

    const readmePath = "README.md"
    let readme = await readFile(readmePath, "utf-8")
    const startMarker = "<!-- packages-table start -->"
    const endMarker = "<!-- packages-table end -->"

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
