type PackageJson = {
    scripts?: Record<string, string>
}

function shellQuote(value: string): string {
    if (/^[\w./:-]+$/.test(value)) {
        return value
    }

    return JSON.stringify(value)
}

const args = Bun.argv.slice(2)
const packageJson = (await Bun.file('package.json').json()) as PackageJson
const scriptNames = Object.keys(packageJson.scripts ?? {})
    .filter((scriptName) => scriptName.startsWith('fix:'))
    .sort()

if (scriptNames.length === 0) {
    console.error('No fix:* scripts found.')
    process.exit(1)
}

const commands = scriptNames.map((scriptName) => {
    console.log(['$', 'bun', 'run', scriptName, ...args.map(shellQuote)].join(' '))

    return {
        process: Bun.spawn([process.execPath, 'run', scriptName, ...args], {
            stderr: 'inherit',
            stdin: 'inherit',
            stdout: 'inherit',
        }),
        scriptName,
    }
})

const results = await Promise.all(
    commands.map(async (command) => ({
        exitCode: await command.process.exited,
        scriptName: command.scriptName,
    })),
)

const failure = results.find((result) => result.exitCode !== 0)

if (failure) {
    console.error(`${failure.scriptName} exited with code ${failure.exitCode}`)
    process.exit(failure.exitCode)
}
