#!/usr/bin/env -S bun
import path from 'node:path'
import {main} from '../../gen-api-client'

const scriptPath = path.resolve(import.meta.dir, '..', '..', '..', 'gen-api-client.ts')
await main([Bun.argv[0] ?? 'bun', scriptPath, ...Bun.argv.slice(2)])
