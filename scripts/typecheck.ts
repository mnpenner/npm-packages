import { spawnSync } from 'node:child_process'
import { dirname, join, isAbsolute, relative, resolve } from 'node:path'
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs'

const args = process.argv.slice(2)

function readReferences(configPath: string): string[] {
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
        references?: Array<{ path?: string }>
    }
    const configDir = dirname(configPath)

    return (config.references ?? [])
        .map((ref) => {
            if (!ref.path) return undefined
            const refPath = resolve(configDir, ref.path)
            if (!existsSync(refPath)) return undefined
            if (statSync(refPath).isDirectory()) return join(refPath, 'tsconfig.json')
            return refPath
        })
        .filter((path): path is string => !!path && existsSync(path))
}

function runTsc(configPath?: string, seen = new Set<string>()) {
    const resolvedConfigPath = configPath ? resolve(configPath) : resolve('tsconfig.json')
    if (seen.has(resolvedConfigPath)) return
    seen.add(resolvedConfigPath)

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

    console.log(`\x1b[32mTypecheck passed for ${label}: no errors\x1b[0m`)

    for (const referencePath of readReferences(resolvedConfigPath)) {
        runTsc(referencePath, seen)
    }
}

function findTsConfigsInDir(dir: string): string[] {
    const configs: string[] = []
    const rootConfig = join(dir, 'tsconfig.json')
    if (existsSync(rootConfig)) configs.push(rootConfig)

    const ignoredDirs = new Set(['node_modules', 'dist', '.hg'])
    const search = (currentDir: string): void => {
        for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
            if (!entry.isDirectory() || ignoredDirs.has(entry.name)) continue

            const fullPath = join(currentDir, entry.name)
            const config = join(fullPath, 'tsconfig.json')
            if (existsSync(config)) configs.push(config)
            else search(fullPath)
        }
    }

    search(dir)
    return configs
}

function findTsConfigs(target: string): string[] {
    // 1. Direct path
    const directPath = isAbsolute(target) ? target : join(process.cwd(), target)
    if (existsSync(directPath)) {
        if (statSync(directPath).isDirectory()) {
            return findTsConfigsInDir(directPath)
        } else if (target.endsWith('tsconfig.json')) {
            return [directPath]
        }
    }

    // 2. Search in packages/
    const packagesDir = join(process.cwd(), 'packages')
    if (existsSync(packagesDir)) {
        const search = (dir: string): string[] | null => {
            const entries = readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = join(dir, entry.name)
                    // Match by directory name
                    if (entry.name === target) {
                        const configs = findTsConfigsInDir(fullPath)
                        if (configs.length) return configs
                    }
                    // Match by package name
                    const pkgJsonPath = join(fullPath, 'package.json')
                    if (existsSync(pkgJsonPath)) {
                        try {
                            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
                            if (pkgJson.name === target) {
                                const configs = findTsConfigsInDir(fullPath)
                                if (configs.length) return configs
                            }
                        } catch {
                            // ignore
                        }
                    }
                    const found = search(fullPath)
                    if (found) return found
                }
            }
            return null
        }
        return search(packagesDir) ?? []
    }

    return []
}

if (args.length === 0) {
    runTsc()
} else {
    for (const arg of args) {
        const configPaths = findTsConfigs(arg)
        if (configPaths.length) {
            for (const configPath of configPaths) {
                runTsc(configPath)
            }
        } else {
            console.error(`\x1b[31mError: Could not find tsconfig.json for "${arg}"\x1b[0m`)
            process.exit(1)
        }
    }
}
