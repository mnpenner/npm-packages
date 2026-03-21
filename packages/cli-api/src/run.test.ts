import {describe, expect, it} from 'bun:test'
import Path from 'path'
import {App, Command} from './interfaces'
import {executeAppResult} from './run'

function stripAnsi(value: string): string {
    return value.replace(/\x1B\[[0-9;]*m/g, '')
}

describe(executeAppResult.name, () => {
    it('returns exit code 2 for unknown root commands', async () => {
        const app = new App('hello')
            .meta({argv0: 'cli-api'})
            .command(new Command('world'))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['bacon'])

        expect(result).toEqual({
            code: 2,
            error: "cli-api: unknown command 'bacon'",
            setProcessExitCode: true,
        })
    })

    it('returns exit code 2 for unknown nested commands', async () => {
        const app = new App('hello')
            .meta({argv0: 'cli-api'})
            .command(new Command('world')
                .command(new Command('greet')
                    .run(() => {})))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['world', 'bacon'])

        expect(result).toEqual({
            code: 2,
            error: "cli-api: unknown command 'bacon'",
            setProcessExitCode: true,
        })
    })

    it('returns exit code 2 for unknown options', async () => {
        const app = new App('hello')
            .meta({argv0: 'cli-api'})
            .opt('name', {alias: 'n', required: true})
            .run(() => {})

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['-a'])

        expect(result).toEqual({
            code: 2,
            error: 'cli-api: option -a not recognized',
            setProcessExitCode: true,
        })
    })
})

describe(App.name, () => {
    describe(App.prototype.execute.name, () => {
    it('sets the process exit code when parsing fails', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '-e',
                "import {App} from './src'; const app = new App('hello').meta({argv0:'cli-api'}).opt('name',{alias:'n', required:true}).run(() => {}); await app.execute(['-a'])",
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stderr: 'pipe',
            stdout: 'pipe',
        })

        expect(result.exitCode).toBe(2)
    })

    it('sets the process exit code from an explicit handler return code', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '-e',
                "import {App} from './src'; const app = new App('hello').run(() => 7); await app.execute([])",
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stderr: 'pipe',
            stdout: 'pipe',
        })

        expect(result.exitCode).toBe(7)
    })

    it('does not overwrite a manual process.exitCode when the handler returns undefined', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '-e',
                "import {App} from './src'; const app = new App('hello').run(() => { process.exitCode = 9 }); await app.execute([])",
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stderr: 'pipe',
            stdout: 'pipe',
        })

        expect(result.exitCode).toBe(9)
    })

    it('prints styled usage help for required options, optional options, and repeatable positionals', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '-e',
                "import {App} from './src'; const app = new App('hello').meta({argv0:'cli-api'}).opt('name',{alias:'n', required:true, valuePlaceholder:'person'}).opt('shout',{alias:'s', valueNotRequired:true}).arg('greeting').arg('disclaimer',{repeatable:true}).run(() => {}); await app.execute(['-h'])",
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stderr: 'pipe',
            stdout: 'pipe',
            env: {
                ...process.env,
                FORCE_COLOR: '1',
            },
        })

        const stdout = Buffer.from(result.stdout).toString()
        const usageLine = stdout.split('\n')[1]

        expect(stripAnsi(usageLine)).toBe('  cli-api --name=person [--options] [--] [greeting] [disclaimer...]')
        expect(usageLine).toContain('\x1B[32m--name\x1B[39m=\x1B[35mperson\x1B[39m')
        expect(usageLine).toContain(
            '\x1B[90m[\x1B[39m\x1B[35m--options\x1B[39m\x1B[90m]\x1B[39m \x1B[90m[\x1B[39m--\x1B[90m]\x1B[39m \x1B[90m[\x1B[39m\x1B[35mgreeting\x1B[39m\x1B[90m]\x1B[39m \x1B[90m[\x1B[39m\x1B[35mdisclaimer...\x1B[39m\x1B[90m]\x1B[39m',
        )
    })

        it('prints misconfiguration errors with a magenta background', () => {
            const result = Bun.spawnSync({
                cmd: [
                    process.execPath,
                    '-e',
                    "import {App} from './src'; const app = new App('hello').meta({argv0:'cli-api'}).arg('first',{repeatable:true, required:true}).arg('second',{repeatable:true, required:true}).run(() => {}); await app.execute([])",
                ],
                cwd: Path.resolve(import.meta.dir, '..'),
                stderr: 'pipe',
                stdout: 'pipe',
                env: {
                    ...process.env,
                    FORCE_COLOR: '1',
                },
            })

            const stdout = Buffer.from(result.stdout).toString()

            expect(result.exitCode).toBe(1)
            expect(stripAnsi(stdout)).toContain('Only the last positional can be repeatable')
            expect(stdout).toContain('\x1B[45m')
            expect(stdout).not.toContain('\x1B[41m')
        })

        it('validates misconfigured commands before handling help flags', () => {
            const result = Bun.spawnSync({
                cmd: [
                    process.execPath,
                    '-e',
                    "import {App} from './src'; const app = new App('hello').meta({argv0:'cli-api'}).arg('first',{repeatable:true, required:true}).arg('second',{repeatable:true, required:true}).run(() => {}); await app.execute(['--help'])",
                ],
                cwd: Path.resolve(import.meta.dir, '..'),
                stderr: 'pipe',
                stdout: 'pipe',
                env: {
                    ...process.env,
                    FORCE_COLOR: '1',
                },
            })

            const stdout = Buffer.from(result.stdout).toString()

            expect(result.exitCode).toBe(1)
            expect(stripAnsi(stdout)).toContain('Only the last positional can be repeatable')
            expect(stripAnsi(stdout)).not.toContain('Usage:')
        })
    })
})
