import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

type PackageJson = {
    name?: string
}

/**
 * Reads package names from package manifests and maps each package name
 * to the package directory name.
 *
 * @example
 * ```ts
 * const packageNameDirMap = await readPackageNameDirMap()
 * console.log(packageNameDirMap.get('@mpen/classcat'))
 * ```
 *
 * @returns A map from package name to directory name.
 */
export async function readPackageNameDirMap(): Promise<Map<string, string>> {
    const packagesDir = 'packages'
    const packageNameDirMap = new Map<string, string>()

    for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue

        try {
            const packageJson = JSON.parse(
                await readFile(join(packagesDir, entry.name, 'package.json'), 'utf8'),
            ) as PackageJson

            if (packageJson.name) {
                packageNameDirMap.set(packageJson.name, entry.name)
            }
        } catch {
            // Ignore non-package directories and malformed package files during discovery.
        }
    }

    return packageNameDirMap
}

/**
 * Reads the directory names under `packages/`.
 *
 * @example
 * ```ts
 * const packageDirs = await readPackageDirNames()
 * console.log(packageDirs.includes('classcat'))
 * ```
 *
 * @returns A sorted list of package directory names.
 */
export async function readPackageDirNames(): Promise<string[]> {
    return (await readdir('packages', { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
}

/**
 * Resolves a package selector to a package directory name.
 *
 * Package names take precedence over directory names when a selector matches both.
 *
 * @example
 * ```ts
 * const dirName = await resolvePackageDirName('@mpen/classcat')
 * console.log(dirName)
 * ```
 *
 * @param target - Package name or package directory name.
 * @returns The package directory name, or `undefined` if no package matches.
 */
export async function resolvePackageDirName(target: string): Promise<string | undefined> {
    const packageNameDirMap = await readPackageNameDirMap()
    const packageDirByName = packageNameDirMap.get(target)
    if (packageDirByName) return packageDirByName

    const packageDirNames = await readPackageDirNames()
    return packageDirNames.includes(target) ? target : undefined
}

/**
 * Resolves package selectors to package paths for file-oriented tools.
 *
 * @example
 * ```ts
 * const targets = await resolvePackagePathTargets(['@mpen/classcat', 'README.md'])
 * console.log(targets)
 * ```
 *
 * @param targets - Package names, package directory names, or ordinary paths.
 * @returns Targets with package selectors replaced by `packages/<dir>`.
 */
export async function resolvePackagePathTargets(targets: readonly string[]): Promise<string[]> {
    const packageNameDirMap = await readPackageNameDirMap()
    const packageDirNames = new Set(await readPackageDirNames())

    return targets.map((target) => {
        const packageDir =
            packageNameDirMap.get(target) ?? (packageDirNames.has(target) ? target : undefined)

        return packageDir ? join('packages', packageDir) : target
    })
}
