#!/usr/bin/env -S bun --hot  --no-clear-screen
import {router} from './router-instance'

// BUN_PORT=3001 bun packages/server-router/examples/serve.ts
// export default router


const server = Bun.serve({ port: 5180, fetch: router.fetch.bind(router) });
console.log(`server-router running at http://localhost:${server.port}`);
