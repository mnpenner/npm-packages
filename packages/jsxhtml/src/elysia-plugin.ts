import { Elysia } from 'elysia'
import {JsxElement,isJsx} from './jsx-nodes'


export function html() {
    return new Elysia()
        .onAfterHandle(({ response }) => {
            if(isJsx(response)) {
                // console.log('RESPONSE',response)
                return new Response(String(response), {
                    headers: {
                        'content-type': 'text/html; charset=utf8'
                    }
                })
            }
        })
}
