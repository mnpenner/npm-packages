Modify `packages/server-router/src/middleware/request-id-ctx.ts` to check req.headers.get('x-request-id') first and use that if available.
