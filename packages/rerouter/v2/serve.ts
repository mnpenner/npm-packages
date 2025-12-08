#!/usr/bin/env -S bun
import router from './router-instance'
import {FetchHandler} from './fetch-handler'

// BUN_PORT=3001 bun v2/serve.ts
export default router satisfies FetchHandler
