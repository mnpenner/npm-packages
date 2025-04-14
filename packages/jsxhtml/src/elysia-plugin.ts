import {isJsxNode} from './jsx-node'

/**
 * @deprecated Doesn't seem to work in newer versions of Elysia.
 * Just add `.onAfterHandle` directly to your app.
 * @see https://elysiajs.com/essential/life-cycle#interceptor-hook
 */
export function elysiaJsx() {
    const {Elysia} = require('elysia') as typeof import('elysia')
    return new Elysia()
        .onAfterHandle(({response}) => {
            if(isJsxNode(response)) {
                return new Response(String(response), {
                    headers: {
                        'content-type': 'text/html; charset=utf-8'
                    }
                })
            }
        })
}
