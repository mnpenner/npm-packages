#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {main} from '../src/bin/gen-api-client'

describe('main', function () {
    it('generates clients for routes defined via zodRoute', async function () {
        const routerPath = path.resolve(import.meta.dir, 'router-instance.ts')
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-client-'))
        const outputPath = path.join(tempDir, 'api-client.gen.ts')

        try {
            await main(['bun', 'gen-api-client.ts', routerPath, outputPath])
            const contents = fs.readFileSync(outputPath, 'utf8')

            expect(contents).toContain('fetch("/", {')
            expect(contents).toContain('fetch("/name/bar", {')
            expect(contents).toContain('fetch("/foo/bar", {')
            expect(contents).toContain('fetch(`/books/${_path.id}`, {')
            expect(contents).toContain('fetch("/gen", {')

            const postMethods = contents.match(/method: "POST"/g) ?? []
            const getMethods = contents.match(/method: "GET"/g) ?? []
            expect(postMethods.length).toBeGreaterThanOrEqual(3)
            expect(getMethods.length).toBeGreaterThanOrEqual(2)
        } finally {
            fs.rmSync(tempDir, {recursive: true, force: true})
        }
    })
})
