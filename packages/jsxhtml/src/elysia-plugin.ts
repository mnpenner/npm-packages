import {isJsxNode} from './jsx-node'

export function elysiaJsx() {
    const {Elysia} = require('elysia') as typeof import('elysia')
    return new Elysia()
        .onAfterHandle(({response}) => {
            if(isJsxNode(response)) {
                return new Response(String(response), {
                    headers: {
                        'content-type': 'text/html; charset=utf8'
                    }
                })
            }
        })
}
