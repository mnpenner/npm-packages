#!/usr/bin/env bun test
import { expect, test, describe, afterAll, beforeAll } from 'bun:test'
import { $ } from 'bun'
import fs from 'node:fs/promises'
import path from 'node:path'

const TEMP_DIR = path.resolve(import.meta.dirname, 'temp_bin_test')
const BIN_PATH = path.resolve(import.meta.dirname, 'bin.ts')

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

        const result = await $`bun ${BIN_PATH} ${routesFile}`.text()
        expect(result).toContain('export function home()')
    })

    test('writes to file with -o', async () => {
        const routesFile = path.join(TEMP_DIR, 'o-test.tsx')
        const outputFile = path.join(TEMP_DIR, 'explicit-output.ts')
        await fs.writeFile(routesFile, `export default [{ name: 'home', pattern: '/' }]`)

        await $`bun ${BIN_PATH} ${routesFile} -o ${outputFile}`.quiet()

        const outputContent = await fs.readFile(outputFile, 'utf8')
        expect(outputContent).toContain('export function home()')
    })

    test('writes to adjacent file with -w', async () => {
        const routesFile = path.join(TEMP_DIR, 'w-test.tsx')
        const expectedOutputFile = path.join(TEMP_DIR, 'w-test.gen.ts')
        await fs.writeFile(routesFile, `export default [{ name: 'home', pattern: '/' }]`)

        await $`bun ${BIN_PATH} ${routesFile} -w`.quiet()

        const outputContent = await fs.readFile(expectedOutputFile, 'utf8')
        expect(outputContent).toContain('export function home()')
    })

    test('handles optional groups', async () => {
        const routesFile = path.join(TEMP_DIR, 'optional.tsx')
        await fs.writeFile(
            routesFile,
            `export default [{ name: 'optional', pattern: '/foo{/:bar}' }]`,
        )

        const outputContent = await $`bun ${BIN_PATH} ${routesFile}`.text()

        expect(outputContent).toContain('export function optional(')
        expect(outputContent).toContain('AllOrNone<')
        expect(outputContent).toContain('"bar": ParamType')
    })

    afterAll(async () => {
        await fs.rm(TEMP_DIR, { recursive: true, force: true })
    })
})
