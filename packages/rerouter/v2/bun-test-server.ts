export default {
    async fetch(request: Request, env: unknown, ctx: unknown) {
        console.log('request instanceof Request:', request instanceof Request);
        console.log('request.url:', request.url);
        console.log('request.method:', request.method);

        console.log('env type:', typeof env);
        console.log('env keys:', env && typeof env === 'object' ? Object.keys(env as any) : env);

        console.log('ctx:', ctx);
        if (ctx && typeof (ctx as any).waitUntil === 'function') {
            console.log('ctx.waitUntil exists');
        }

        return new Response('ok\n', { status: 200 });
    },
};


/*
$ PORT=3002 bun v2/bun-test-server.ts
Started development server: http://localhost:3002

$ curl -v http://localhost:3002/
request instanceof Request: true
request.url: http://localhost:3002/
request.method: GET
env type: object
env keys: []
ctx: undefined


 */
