import {describe, expect, it} from 'bun:test'
import {App} from './interfaces'
import {formatArgumentError} from './run'

describe(formatArgumentError.name, () => {
    it('formats unknown short options with argv0', () => {
        const app = new App('hello')
            .meta({argv0: 'examples/root-command.ts'})
            .opt('name', {alias: 'n', required: true})
            .run(() => {}) as Parameters<typeof formatArgumentError>[0]

        const message = formatArgumentError(app, '"hello" command does not have option "a".')

        expect(message).toEqualIgnoringWhitespace('examples/root-command.ts: option -a not recognized')
    })
})
