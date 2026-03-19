import {describe, expect, it} from 'bun:test'
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
        })
    })
})
