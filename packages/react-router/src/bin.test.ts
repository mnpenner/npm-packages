#!/usr/bin/env bun test
import { expect, test, describe, it, afterAll, beforeAll } from 'bun:test'
import { $ } from 'bun'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const TEMP_DIR = path.resolve(import.meta.dirname, 'temp_bin_test')
const BIN_PATH = path.resolve(import.meta.dirname, 'bin.ts')
const BUN_PATH = process.execPath

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true })
}

describe('react-router bin', () => {
    beforeAll(async () => {
        await ensureDir(TEMP_DIR)
    })

    test('writes to stdout by default', async () => {
        const routesFile = path.join(TEMP_DIR, 'stdout-test.tsx')
        await fs.writeFile(routesFile, `export default [{ name: 'home', pattern: '/' }]`)

        const result = await $`${BUN_PATH} ${BIN_PATH} ${routesFile}`.text()
        expect(result).toContain('export function home()')
    })

    test('writes to file with -o', async () => {
        const routesFile = path.join(TEMP_DIR, 'o-test.tsx')
        const outputFile = path.join(TEMP_DIR, 'explicit-output.ts')
        await fs.writeFile(routesFile, `export default [{ name: 'home', pattern: '/' }]`)

        await $`${BUN_PATH} ${BIN_PATH} ${routesFile} -o ${outputFile}`.quiet()

        const outputContent = await fs.readFile(outputFile, 'utf8')
        expect(outputContent).toContain('export function home()')
    })

    test('writes to adjacent file with -w', async () => {
        const routesFile = path.join(TEMP_DIR, 'w-test.tsx')
        const expectedOutputFile = path.join(TEMP_DIR, 'w-test.gen.ts')
        await fs.writeFile(routesFile, `export default [{ name: 'home', pattern: '/' }]`)

        await $`${BUN_PATH} ${BIN_PATH} ${routesFile} -w`.quiet()

        const outputContent = await fs.readFile(expectedOutputFile, 'utf8')
        expect(outputContent).toContain('export function home()')
    })

    test('handles optional groups', async () => {
        const routesFile = path.join(TEMP_DIR, 'optional.tsx')
        await fs.writeFile(
            routesFile,
            `export default [{ name: 'optional', pattern: '/foo{/:bar}' }]`,
        )

        const outputContent = await $`${BUN_PATH} ${BIN_PATH} ${routesFile}`.text()

        expect(outputContent).toContain('export function optional(')
        expect(outputContent).toContain('AllOrNone<')
        expect(outputContent).toContain('"bar": ParamType')
    })

    test('generates importable path helpers', async () => {
        const routesFile = path.join(TEMP_DIR, 'importable.tsx')
        const outputFile = path.join(TEMP_DIR, 'importable.gen.ts')
        await fs.writeFile(
            routesFile,
            `
                import type { RouteObject } from '@mpen/rerouter'

                const ROUTES: readonly RouteObject[] = [
                    { name: 'home', pattern: '/' },
                    {
                        name: 'kitchenSink',
                        pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
                    },
                    { name: 'login', pattern: '/login' },
                    { name: 'match', pattern: '/matches/:id' },
                    { name: 'notFound', pattern: '*' },
                ]

                export default ROUTES
            `,
        )

        await $`${BUN_PATH} ${BIN_PATH} ${routesFile} -o ${outputFile} --wildcard-delimiter ${','} --encode-function ${'encodeURI'}`.quiet()

        const { home, kitchenSink, login, match } = await import(pathToFileURL(outputFile).href)

        expect(home()).toBe('/')
        expect(login()).toBe('/login')
        expect(match({ id: 'a/b' })).toBe('/matches/a/b')
        expect(kitchenSink({ foo: 'a/b', baz: 'c', splat: ['x', 'y'] })).toBe(
            '/hello/a/b/bar/c/x,y/xxx',
        )
        expect(
            kitchenSink({
                foo: 'a/b',
                baz: 'c',
                splat: ['x', 'y'],
                optional: 'opt',
                two: 'two',
            }),
        ).toBe('/hello/a/b/bar/c/x,y/xxx/opt/lol/two')
    })

    describe('generated path helpers with default options', () => {
        let home: () => string
        let login: () => string
        let match: (params: { id: string }) => string
        let kitchenSink: (params: {
            foo: string
            baz: string
            splat: string[]
            optional?: string
            two?: string
        }) => string

        beforeAll(async () => {
            const routesFile = path.join(TEMP_DIR, 'importable-defaults.tsx')
            const outputFile = path.join(TEMP_DIR, 'importable-defaults.gen.ts')
            await fs.writeFile(
                routesFile,
                `
                    import type { RouteObject } from '@mpen/rerouter'

                    const ROUTES: readonly RouteObject[] = [
                        { name: 'home', pattern: '/' },
                        {
                            name: 'kitchenSink',
                            pattern: '/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}',
                        },
                        { name: 'login', pattern: '/login' },
                        { name: 'match', pattern: '/matches/:id' },
                        { name: 'notFound', pattern: '*' },
                    ]

                    export default ROUTES
                `,
            )

            await $`${BUN_PATH} ${BIN_PATH} ${routesFile} > ${outputFile}`.quiet()

            const generated = await import(pathToFileURL(outputFile).href)
            home = generated.home
            login = generated.login
            match = generated.match
            kitchenSink = generated.kitchenSink
        })

        it('home()', () => {
            expect(home()).toBe('/')
        })

        it('login()', () => {
            expect(login()).toBe('/login')
        })

        it('match()', () => {
            expect(match({ id: '123' })).toBe('/matches/123')
        })

        it('match() uses encodeURIComponent', () => {
            expect(match({ id: 'a/b' })).toBe('/matches/a%2Fb')
        })

        it('kitchenSink() without optional group', () => {
            expect(kitchenSink({ foo: 'a', baz: 'b', splat: ['x', 'y'] })).toBe(
                '/hello/a/bar/b/x/y/xxx',
            )
        })

        it('kitchenSink() with optional group', () => {
            expect(
                kitchenSink({
                    foo: 'a',
                    baz: 'b',
                    splat: ['x', 'y'],
                    optional: 'opt',
                    two: 'two',
                }),
            ).toBe('/hello/a/bar/b/x/y/xxx/opt/lol/two')
        })

        it('kitchenSink() requires all-or-none optional group', () => {
            expect(() =>
                kitchenSink({ foo: 'a', baz: 'b', splat: ['x', 'y'], optional: 'opt' } as any),
            ).toThrow('Group requires all-or-none: "optional", "two"')
        })
    })

    afterAll(async () => {
        await fs.rm(TEMP_DIR, { recursive: true, force: true })
    })
})
