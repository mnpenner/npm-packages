export function getNextPublishVersion(
    packageVersion: string | undefined,
    releaseVersion: string,
): string {
    if (packageVersion && compareVersions(packageVersion, releaseVersion) > 0) {
        return packageVersion
    }

    return bumpPatch(releaseVersion)
}

function compareVersions(a: string, b: string): number {
    const parsedA = parseVersion(a)
    const parsedB = parseVersion(b)

    for (const part of ['major', 'minor', 'patch'] as const) {
        const diff = parsedA[part] - parsedB[part]

        if (diff !== 0) {
            return diff
        }
    }

    return 0
}

function bumpPatch(version: string): string {
    const parsed = parseVersion(version)

    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/)

    if (!match) {
        throw new Error(`Cannot patch-bump non-semver version "${version}".`)
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
    }
}
