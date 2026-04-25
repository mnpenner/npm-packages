#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {$} from 'bun'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

import { tmpdir } from "node:os"
import { mkdtemp, readdir, readFile, writeFile, unlink, rm } from "node:fs/promises"
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
        packSize: string;
        funcs: number | null; 
        lines: number | null 
    }> = []

    const tempPackDir = await mkdtemp(join(tmpdir(), "bun-pack-"))

    try {
        for (const pkg of packages) {
            process.stdout.write(`Checking ${pkg}... `)
            
            let displayName = pkg
            let version = "—"
            let hasDocs = false
            let packSize = "—"
            const pkgPath = join(packagesDir, pkg)
            try {
                const pkgJson = JSON.parse(await readFile(join(pkgPath, "package.json"), "utf-8"))
                displayName = pkgJson.name || pkg
                version = pkgJson.version || "—"
                const s = pkgJson.scripts || {}
                hasDocs = !!(s.docs || s['build:docs'])

                // bun pm pack
                const { stdout: packStdout, stderr: packStderr } = await $`bun pm pack --destination ${tempPackDir}`.cwd(pkgPath).nothrow().quiet()
                const packOutput = packStdout.toString() + packStderr.toString()
                const packedMatch = packOutput.match(/Packed size:\s*([\d.]+)([KM]B)/)
                const unpackedMatch = packOutput.match(/Unpacked size:\s*([\d.]+)([KM]B)/)
                
                if (packedMatch && unpackedMatch) {
                    packSize = `${packedMatch[1]}${packedMatch[2]} / ${unpackedMatch[1]}${unpackedMatch[2]}`
                }
                
                // Cleanup temp files for this package immediately
                const files = await readdir(tempPackDir)
                for (const file of files) {
                    await unlink(join(tempPackDir, file))
                }
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
                    results.push({ dirName: pkg, displayName, version, hasDocs, packSize, funcs, lines })
                    console.log(`Cov: ${funcs.toFixed(0)}%/${lines.toFixed(0)}% Size: ${packSize}`)
                } else {
                    results.push({ dirName: pkg, displayName, version, hasDocs, packSize, funcs: null, lines: null })
                    console.log(`Size: ${packSize}`)
                }
            } catch (e) {
                results.push({ dirName: pkg, displayName, version, hasDocs, packSize, funcs: null, lines: null })
                console.log("Error")
            }
        }
    } finally {
        await rm(tempPackDir, { recursive: true, force: true })
    }

    results.sort((a, b) => a.displayName.localeCompare(b.displayName))

    let table = "| Package | Version | Directory | Size (Packed/Unp.) | Coverage | Documentation |\n"
    table += "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
    for (const { dirName, displayName, version, hasDocs, packSize, funcs, lines } of results) {
        const funcsStr = funcs === null ? "—" : `${funcs.toFixed(0)}% 𝑓`
        const linesStr = lines === null ? "—" : `${lines.toFixed(0)}% L`
        const coverageStr = (funcs === null && lines === null) ? "—" : `${funcsStr} / ${linesStr}`
        const dirLink = `[${dirName}](https://github.com/mnpenner/npm-packages/tree/main/packages/${dirName})`
        const docsLink = hasDocs ? `[Docs](https://mnpenner.github.io/npm-packages/${dirName}/) ` : "—"
        table += `| \`${displayName}\` | ${version} | ${dirLink} | ${packSize} | ${coverageStr} | ${docsLink} |\n`
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
