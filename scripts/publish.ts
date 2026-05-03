#!/usr/bin/env -S bun -i
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve, sep } from 'node:path'
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { gunzipSync } from 'node:zlib'
import { $ } from 'bun'
import chalk from 'chalk'
import { getNextPublishVersion } from './publish-version'

const PARSE_CONFIG = {
    options: {
        'dry-run': {
            type: 'boolean',
        },
        force: {
            type: 'boolean',
        },
        registry: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

type PackageJson = {
    name?: string
    version?: string
    private?: boolean
    publishConfig?: {
        access?: string
        registry?: string
    }
    scripts?: Record<string, string>
}

type PackageDir = {
    dirName: string
    packageJson: PackageJson
    packageJsonPath: string
    path: string
}

type RegistryRelease = {
    tarball: string
    version: string
}

type RunOptions = {
    capture?: boolean
    cwd?: string
    env?: Record<string, string | undefined>
    suppressFailureOutput?: boolean
}

type QuietStep = {
    args: string[]
    command: string
    cwd?: string
    label: string
}

type TarEntry = {
    contents: Buffer
    path: string
}

type PublishResult =
    | {
          name: string
          status: 'published'
          version: string
      }
    | {
          name: string
          status: 'would-publish'
          version: string
      }
    | {
          name: string
          reason: string
          status: 'failed'
      }
    | {
          name: string
          reason: string
          status: 'skipped'
      }

/**
 * Checks, builds, hashes, version-bumps, and publishes packages whose packed
 * output has changed since the latest npm release.
 */
async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const packages = await findPackageDirs(positionals)

    if (packages.length === 0) {
        console.error(chalk.red('No matching packages found.'))
        return 1
    }

    let failed = false
    const results: PublishResult[] = []

    for (const packageDir of packages) {
        const packageName = packageDir.packageJson.name
        const label = packageName ?? packageDir.dirName

        console.log(`\n${chalk.blue(label)}`)

        try {
            if (!packageName) {
                const reason = 'package.json does not have a name'
                console.log(chalk.gray(`Skipping: ${reason}.`))
                results.push({ name: label, reason, status: 'skipped' })
                continue
            }

            if (packageDir.packageJson.private === true) {
                const reason = `package is ${chalk.red('private')}`
                console.log(chalk.gray(`Skipping: ${reason}.`))
                results.push({ name: packageName, reason, status: 'skipped' })
                continue
            }

            const registry = getRegistry(options.registry, packageDir.packageJson)
            const release = await getLatestRelease(packageName, registry)

            if (!release) {
                const reason = `package is ${chalk.blue('not published')} on ${registry}`
                console.log(chalk.gray(`Skipping: ${reason}.`))
                results.push({ name: packageName, reason, status: 'skipped' })
                continue
            }

            if (options.force) {
                console.log(chalk.yellow('Skipping checks because --force was provided.'))
            } else {
                await checkPackage(packageDir)
            }

            if (!packageDir.packageJson.scripts?.build) {
                throw new Error(`${packageName} is published but does not have a build script.`)
            }

            console.log('build')
            await runQuietStep({
                args: ['run', 'build'],
                command: 'bun',
                cwd: packageDir.path,
                label: 'build',
            })

            const [localHash, releaseHash] = await Promise.all([
                createLocalPackageHash(packageDir.path),
                createReleasePackageHash(release.tarball),
            ])

            if (localHash === releaseHash) {
                console.log(
                    chalk.green(`Packed output matches ${release.version}; skipping publish.`),
                )
                results.push({
                    name: packageName,
                    reason: `packed ${chalk.green('output matches')} ${release.version}`,
                    status: 'skipped',
                })
                continue
            }

            const nextVersion = getNextPublishVersion(
                packageDir.packageJson.version,
                release.version,
            )
            console.log(
                chalk.yellow(`Packed output changed: ${release.version} -> ${nextVersion}.`),
            )

            if (options['dry-run']) {
                console.log(chalk.yellow(`Dry run: would publish ${packageName}@${nextVersion}.`))
                results.push({ name: packageName, status: 'would-publish', version: nextVersion })
                continue
            }

            await setPackageVersion(packageDir.packageJsonPath, nextVersion)
            packageDir.packageJson.version = nextVersion

            await publishPackage(packageDir, registry)
            results.push({ name: packageName, status: 'published', version: nextVersion })
        } catch (err) {
            failed = true
            const reason = err instanceof Error ? err.message : String(err)
            results.push({ name: label, reason, status: 'failed' })
            console.log(reason)
            console.log(chalk.red(`${label} failed; skipping remaining steps for this package.`))
        }
    }

    printSummary(results)

    if (failed) {
        return 1
    }
}

async function checkPackage(packageDir: PackageDir): Promise<void> {
    console.log('static analysis')
    await runQuietStep({
        args: ['run', 'lint', join('packages', packageDir.dirName)],
        command: 'bun',
        label: 'lint',
    })
    await runQuietStep({
        args: ['run', 'typecheck', packageDir.dirName],
        command: 'bun',
        label: 'types',
    })
    await runQuietStep({
        args: ['run', '--bun', 'prettier', join('packages', packageDir.dirName), '--check'],
        command: 'bun',
        label: 'format',
    })

    console.log('tests')
    await runQuietStep({
        args: ['run', 'test:unit', packageDir.dirName],
        command: 'bun',
        label: 'unit',
    })
}

async function runQuietStep(step: QuietStep): Promise<void> {
    const passed = await run(step.command, step.args, {
        capture: true,
        cwd: step.cwd,
        suppressFailureOutput: true,
    }).then(
        () => true,
        () => false,
    )

    if (passed) {
        console.log(`  ${chalk.green('✓')} ${step.label}`)
        return
    }

    console.log(`  ${chalk.red('✗')} ${step.label}`)
    throw new Error(`${step.label} failed`)
}

function printSummary(results: readonly PublishResult[]): void {
    const published = results.filter(isPublishedResult)
    const wouldPublish = results.filter(isWouldPublishResult)
    const skipped = results.filter(isSkippedResult)
    const failedResults = results.filter(isFailedResult)

    console.log(chalk.bold('\nSummary'))

    if (published.length > 0) {
        console.log(chalk.green('\nPublished:'))
        for (const result of published) {
            console.log(`  ${result.name}@${result.version}`)
        }
    }

    if (wouldPublish.length > 0) {
        console.log(chalk.cyan('\nWould publish:'))
        for (const result of wouldPublish) {
            console.log(`  ${result.name}@${result.version}`)
        }
    }

    if (skipped.length > 0) {
        console.log(chalk.yellow('\nSkipped:'))
        for (const result of skipped) {
            console.log(`  ${result.name}: ${result.reason}`)
        }
    }

    if (failedResults.length > 0) {
        console.log(chalk.red('\nFailed:'))
        for (const result of failedResults) {
            console.log(`  ${result.name}: ${result.reason}`)
        }
    }

    if (results.length === 0) {
        console.log(chalk.gray('No packages processed.'))
    }
}

function isPublishedResult(
    result: PublishResult,
): result is Extract<PublishResult, { status: 'published' }> {
    return result.status === 'published'
}

function isWouldPublishResult(
    result: PublishResult,
): result is Extract<PublishResult, { status: 'would-publish' }> {
    return result.status === 'would-publish'
}

function isSkippedResult(
    result: PublishResult,
): result is Extract<PublishResult, { status: 'skipped' }> {
    return result.status === 'skipped'
}

function isFailedResult(
    result: PublishResult,
): result is Extract<PublishResult, { status: 'failed' }> {
    return result.status === 'failed'
}

async function findPackageDirs(positionals: readonly string[]): Promise<PackageDir[]> {
    const packagesPath = join(process.cwd(), 'packages')
    const allPackages = (
        await Promise.all(
            (await readdir(packagesPath, { withFileTypes: true }))
                .filter((dirent) => dirent.isDirectory())
                .map(async (dirent) => {
                    const packagePath = join(packagesPath, dirent.name)
                    const packageJsonPath = join(packagePath, 'package.json')

                    if (!existsSync(packageJsonPath)) {
                        return null
                    }

                    return {
                        dirName: dirent.name,
                        packageJson: JSON.parse(
                            await readFile(packageJsonPath, 'utf8'),
                        ) as PackageJson,
                        packageJsonPath,
                        path: packagePath,
                    }
                }),
        )
    )
        .filter((packageDir): packageDir is PackageDir => packageDir !== null)
        .sort((a, b) => a.dirName.localeCompare(b.dirName))

    if (positionals.length === 0) {
        return allPackages
    }

    const selected = new Set<string>()

    for (const positional of positionals) {
        const resolved = resolve(positional)
        const relativePath = relative(process.cwd(), resolved)
        const pathParts = relativePath.split(sep)

        for (const packageDir of allPackages) {
            if (
                positional === packageDir.dirName ||
                positional === packageDir.packageJson.name ||
                resolved === packageDir.path ||
                (pathParts[0] === 'packages' && pathParts[1] === packageDir.dirName)
            ) {
                selected.add(packageDir.dirName)
            }
        }
    }

    return allPackages.filter((packageDir) => selected.has(packageDir.dirName))
}

function getRegistry(optionRegistry: string | undefined, packageJson: PackageJson): string {
    const registry =
        optionRegistry ??
        packageJson.publishConfig?.registry ??
        process.env.NPM_CONFIG_REGISTRY ??
        process.env.npm_config_registry ??
        'https://registry.npmjs.org/'

    return registry.endsWith('/') ? registry : `${registry}/`
}

async function getLatestRelease(
    packageName: string,
    registry: string,
): Promise<RegistryRelease | null> {
    const response = await fetch(`${registry}${encodeURIComponent(packageName)}`, {
        headers: {
            accept: 'application/vnd.npm.install-v1+json, application/json',
        },
    })

    if (response.status === 404) {
        return null
    }

    if (!response.ok) {
        throw new Error(
            `Failed to load ${packageName} metadata from ${registry}: ${response.status} ${response.statusText}`,
        )
    }

    const metadata = (await response.json()) as {
        'dist-tags'?: Record<string, string>
        versions?: Record<string, { dist?: { tarball?: string } }>
    }
    const version = metadata['dist-tags']?.latest
    const tarball = version ? metadata.versions?.[version]?.dist?.tarball : undefined

    if (!version || !tarball) {
        throw new Error(`${packageName} is missing a latest release tarball.`)
    }

    return { tarball, version }
}

async function createLocalPackageHash(packagePath: string): Promise<string> {
    const tempPath = await mkdtemp(join(tmpdir(), 'npm-packages-publish-local-'))

    try {
        await run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', tempPath], {
            capture: true,
            cwd: packagePath,
        })

        const tarball = (await readdir(tempPath)).find((entry) => entry.endsWith('.tgz'))

        if (!tarball) {
            throw new Error(`bun pm pack did not create a tarball for ${basename(packagePath)}.`)
        }

        return await createTarballHash(join(tempPath, tarball))
    } finally {
        await rm(tempPath, { force: true, recursive: true })
    }
}

async function createReleasePackageHash(tarballUrl: string): Promise<string> {
    const tempPath = await mkdtemp(join(tmpdir(), 'npm-packages-publish-release-'))

    try {
        const tarballPath = join(tempPath, 'release.tgz')
        const response = await fetch(tarballUrl)

        if (!response.ok) {
            throw new Error(
                `Failed to download latest release tarball: ${response.status} ${response.statusText}`,
            )
        }

        await writeFile(tarballPath, Buffer.from(await response.arrayBuffer()))

        return await createTarballHash(tarballPath)
    } finally {
        await rm(tempPath, { force: true, recursive: true })
    }
}

async function createTarballHash(tarballPath: string): Promise<string> {
    const entries = readTarEntries(gunzipSync(await readFile(tarballPath)))

    return hashPackageEntries(entries)
}

function hashPackageEntries(entries: TarEntry[]): string {
    const hash = createHash('sha256')

    for (const entry of entries.sort((a, b) => a.path.localeCompare(b.path))) {
        const contents =
            entry.path === 'package.json'
                ? normalizePackageJson(entry.contents.toString('utf8'))
                : entry.contents

        hash.update(entry.path)
        hash.update('\0')
        hash.update(String(contents.length))
        hash.update('\0')
        hash.update(contents)
        hash.update('\0')
    }

    return hash.digest('hex')
}

function readTarEntries(tarBuffer: Buffer): TarEntry[] {
    const entries: TarEntry[] = []
    let offset = 0
    let nextLongPath: string | undefined
    let nextPaxHeaders: Record<string, string> = {}

    while (offset + 512 <= tarBuffer.length) {
        const header = tarBuffer.subarray(offset, offset + 512)

        if (isZeroBlock(header)) {
            break
        }

        const size = readTarNumber(header, 124, 12)
        const typeFlag = String.fromCharCode(header[156] ?? 0)
        const contentsStart = offset + 512
        const contentsEnd = contentsStart + size
        const contents = tarBuffer.subarray(contentsStart, contentsEnd)

        if (typeFlag === 'x') {
            nextPaxHeaders = readPaxHeaders(contents)
        } else if (typeFlag === 'L') {
            nextLongPath = trimNulls(contents.toString('utf8'))
        } else if (typeFlag === '0' || typeFlag === '\0') {
            const rawPath =
                nextPaxHeaders.path ??
                nextLongPath ??
                joinTarPath(readTarString(header, 345, 155), readTarString(header, 0, 100))
            const path = normalizeTarEntryPath(rawPath)

            entries.push({
                contents: Buffer.from(contents),
                path,
            })

            nextLongPath = undefined
            nextPaxHeaders = {}
        } else {
            nextLongPath = undefined
            nextPaxHeaders = {}
        }

        offset = contentsStart + Math.ceil(size / 512) * 512
    }

    return entries
}

function isZeroBlock(block: Buffer): boolean {
    return block.every((byte) => byte === 0)
}

function readTarNumber(header: Buffer, offset: number, length: number): number {
    const rawValue = readTarString(header, offset, length).trim()

    return rawValue ? parseInt(rawValue, 8) : 0
}

function readTarString(header: Buffer, offset: number, length: number): string {
    return trimNulls(header.subarray(offset, offset + length).toString('utf8'))
}

function trimNulls(value: string): string {
    return value.replace(/\0.*$/s, '')
}

function joinTarPath(prefix: string, name: string): string {
    return prefix ? `${prefix}/${name}` : name
}

function normalizeTarEntryPath(path: string): string {
    return path.replace(/^package\//, '')
}

function readPaxHeaders(contents: Buffer): Record<string, string> {
    const text = contents.toString('utf8')
    const headers: Record<string, string> = {}
    let offset = 0

    while (offset < text.length) {
        const spaceIndex = text.indexOf(' ', offset)

        if (spaceIndex === -1) {
            break
        }

        const recordLength = Number(text.slice(offset, spaceIndex))

        if (!Number.isFinite(recordLength) || recordLength <= 0) {
            break
        }

        const record = text.slice(spaceIndex + 1, offset + recordLength - 1)
        const equalsIndex = record.indexOf('=')

        if (equalsIndex !== -1) {
            headers[record.slice(0, equalsIndex)] = record.slice(equalsIndex + 1)
        }

        offset += recordLength
    }

    return headers
}

function normalizePackageJson(rawPackageJson: string): Buffer {
    const packageJson = JSON.parse(rawPackageJson) as Record<string, unknown>
    delete packageJson.version

    return Buffer.from(`${stableStringify(packageJson)}\n`)
}

function stableStringify(value: unknown): string {
    return JSON.stringify(sortJson(value))
}

function sortJson(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortJson)
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, childValue]) => [key, sortJson(childValue)]),
        )
    }

    return value
}

async function setPackageVersion(packageJsonPath: string, version: string): Promise<void> {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as Record<
        string,
        unknown
    >
    packageJson.version = version

    await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

async function publishPackage(packageDir: PackageDir, registry: string): Promise<void> {
    const publishArgs = ['publish', '--ignore-scripts', '--registry', registry]
    const access =
        packageDir.packageJson.publishConfig?.access ??
        (packageDir.packageJson.name?.startsWith('@') ? 'public' : undefined)

    if (access) {
        publishArgs.push('--access', access)
    }

    await run('bun', publishArgs, { cwd: packageDir.path })
}

async function run(command: string, args: string[], options: RunOptions = {}): Promise<string> {
    const subprocess = Bun.spawn([command, ...args], {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stderr: options.capture ? 'pipe' : 'inherit',
        stdin: 'inherit',
        stdout: options.capture ? 'pipe' : 'inherit',
    })

    const [exitCode, stdout, stderr] = await Promise.all([
        subprocess.exited,
        options.capture ? new Response(subprocess.stdout).text() : Promise.resolve(''),
        options.capture ? new Response(subprocess.stderr).text() : Promise.resolve(''),
    ])

    if (exitCode !== 0) {
        if (options.capture && !options.suppressFailureOutput && stderr.trim()) {
            console.error(stderr.trim())
        }

        throw new Error(`${command} ${args.join(' ')} exited with code ${exitCode}.`)
    }

    return stdout
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']
type Positionals = ParsedConfig['positionals']

if (import.meta.main) {
    const { values, positionals } = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
        (exitCode) => {
            if (typeof exitCode === 'number') {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if (err instanceof $.ShellError) {
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
