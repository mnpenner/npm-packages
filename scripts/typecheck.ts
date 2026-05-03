import { spawnSync } from 'node:child_process'
import { join, isAbsolute, relative } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'

const args = process.argv.slice(2)

function runTsc(configPath?: string) {
    const tscArgs = ['--noEmit']
    if (configPath) {
        tscArgs.push('-p', configPath)
    }

    const label = configPath ? relative(process.cwd(), configPath) : 'root'
    console.log(`\x1b[34mTypechecking ${label}...\x1b[0m`)

    const result = spawnSync('bun', ['run', 'tsc', ...tscArgs], {
        stdio: 'inherit',
        shell: true,
    })

    if (result.status !== 0) {
        console.error(`\x1b[31mTypecheck failed for ${label}\x1b[0m`)
        process.exit(result.status ?? 1)
    }
}

function findTsConfig(target: string): string | null {
    // 1. Direct path
    const directPath = isAbsolute(target) ? target : join(process.cwd(), target)
    if (existsSync(directPath)) {
        if (statSync(directPath).isDirectory()) {
            const config = join(directPath, 'tsconfig.json')
            if (existsSync(config)) return config
        } else if (target.endsWith('tsconfig.json')) {
            return directPath
        }
    }

    // 2. Search in packages/
    const packagesDir = join(process.cwd(), 'packages')
    if (existsSync(packagesDir)) {
        const search = (dir: string): string | null => {
            const entries = readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = join(dir, entry.name)
                    if (entry.name === target) {
                        const config = join(fullPath, 'tsconfig.json')
                        if (existsSync(config)) return config
                    }
                    const found = search(fullPath)
                    if (found) return found
                }
            }
            return null
        }
        return search(packagesDir)
    }

    return null
}

if (args.length === 0) {
    runTsc()
} else {
    for (const arg of args) {
        const configPath = findTsConfig(arg)
        if (configPath) {
            runTsc(configPath)
        } else {
            console.error(`\x1b[31mError: Could not find tsconfig.json for "${arg}"\x1b[0m`)
            process.exit(1)
        }
    }
}
