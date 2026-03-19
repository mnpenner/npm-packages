import {describe, expect, it} from 'bun:test'
import Path from 'path'
import {App, Command} from './interfaces'
import {executeAppResult} from './run'

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
})
