#!/usr/bin/env -S bun --hot  --no-clear-screen
import { router } from './router-instance'

// BUN_PORT=3001 bun packages/routekit/examples/example1/server/serve.ts
// export default router

const server = Bun.serve({ port: 0, fetch: router.fetch.bind(router) })
console.log(`routekit running at http://localhost:${server.port}`)
