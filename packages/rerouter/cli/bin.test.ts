#!/usr/bin/env bun test
import { expect, test, describe, it, afterAll, beforeAll } from 'bun:test'
import { $ } from 'bun'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { runRerouterBin } from './bin'

const TEMP_DIR = path.resolve(import.meta.dirname, 'temp_bin_test')
const FIXTURES_DIR = path.resolve(import.meta.dirname, 'fixtures/bin')
const BIN_PATH = path.resolve(import.meta.dirname, 'bin.ts')
const BUN_PATH = process.execPath

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true })
}

describe('rerouter bin', () => {
    beforeAll(async () => {
        await ensureDir(TEMP_DIR)
    })

    test('writes to stdout by default', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'simple.tsx')

        const result = await runRerouterBin([routesFile])
        expect(result.stdout).toContain('export function home()')
        expect(result.stderr).toBe('')
    })

    test('writes to file with -o', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'simple.tsx')
        const outputFile = path.join(TEMP_DIR, 'explicit-output.ts')

        const result = await runRerouterBin([routesFile, '-o', outputFile])

        const outputContent = await fs.readFile(outputFile, 'utf8')
        expect(outputContent).toContain('export function home()')
        expect(result.stderr).toBe(`Wrote ${path.relative(process.cwd(), outputFile)}\n`)
    })

    test('formats output files with --pretty', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'simple.tsx')
        const outputFile = path.join(TEMP_DIR, 'pretty-output.ts')

        await runRerouterBin([routesFile, '-o', outputFile, '--pretty'])

        const outputContent = await fs.readFile(outputFile, 'utf8')
        expect(outputContent).toContain("export function home(): string {\n  let sb = ''")
        expect(outputContent).toContain("  sb += '/'")
    })

    test('ignores --pretty when writing to stdout', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'simple.tsx')

        const { stdout } = await runRerouterBin([routesFile, '-p'])

        expect(stdout).toContain('export function home(): string {\n    let sb = ""')
        expect(stdout).toContain('    sb += "/"')
    })

    test('writes to adjacent file with -w', async () => {
        const routesFile = path.join(TEMP_DIR, 'write-adjacent.tsx')
        const expectedOutputFile = path.join(TEMP_DIR, 'write-adjacent.gen.ts')
        await fs.copyFile(path.join(FIXTURES_DIR, 'simple.tsx'), routesFile)

        await runRerouterBin([routesFile, '-w'])

        const outputContent = await fs.readFile(expectedOutputFile, 'utf8')
        expect(outputContent).toContain('export function home()')
    })

    test('handles optional groups', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'optional.tsx')

        const { stdout: outputContent } = await runRerouterBin([routesFile])

        expect(outputContent).toContain(
            'export function optional(params: {} & AllOrNone<{ "bar": ParamType }>): string {',
        )
        expect(outputContent).toContain('AllOrNone<')
        expect(outputContent).toContain('"bar": ParamType')
    })

    test('skips unnamed routes', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'unnamed.tsx')

        const { stdout: outputContent } = await runRerouterBin([routesFile])

        expect(outputContent).toContain('export function home()')
        expect(outputContent).not.toContain('layout')
    })

    test('handles regexp params with optional groups', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'regexp-groups.tsx')
        const outputFile = path.join(TEMP_DIR, 'regexp-groups.gen.ts')

        await runRerouterBin([routesFile, '-o', outputFile])

        const outputContent = await fs.readFile(outputFile, 'utf8')
        expect(outputContent).toContain('export function blogPost(')
        expect(outputContent).toContain('"id": ParamType')
        expect(outputContent).toContain('"title": ParamType')

        const { blogPost } = await import(pathToFileURL(outputFile).href)
        expect(blogPost({ id: 123 })).toBe('/blog/123')
        expect(blogPost({ id: 123, title: 'hello world' })).toBe('/blog/123-hello%20world')
    })

    test('generates importable path helpers', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'kitchen-sink.tsx')
        const outputFile = path.join(TEMP_DIR, 'importable.gen.ts')

        await runRerouterBin([
            routesFile,
            '-o',
            outputFile,
            '--wildcard-delimiter',
            ',',
            '--encode-function',
            'encodeURI',
        ])

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
            const routesFile = path.join(FIXTURES_DIR, 'kitchen-sink.tsx')
            const outputFile = path.join(TEMP_DIR, 'importable-defaults.gen.ts')

            const result = await runRerouterBin([routesFile])
            await fs.writeFile(outputFile, result.stdout, 'utf8')

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

    test('can be invoked as a CLI script', async () => {
        const routesFile = path.join(FIXTURES_DIR, 'simple.tsx')

        const result = await $`${BUN_PATH} ${BIN_PATH} ${routesFile}`.text()
        expect(result).toContain('export function home()')
    })

    afterAll(async () => {
        await fs.rm(TEMP_DIR, { recursive: true, force: true })
    })
})
