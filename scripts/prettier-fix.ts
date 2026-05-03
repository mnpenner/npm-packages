const targets = Bun.argv.slice(2)
const files = targets.length > 0 ? targets : ['.']

const prettier = Bun.spawn([process.execPath, 'run', '--bun', 'prettier', '--write', ...files], {
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
})

const exitCode = await prettier.exited

if (exitCode !== 0) {
    process.exit(exitCode)
}
