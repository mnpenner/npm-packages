import { Elysia } from 'elysia'
import JsxhtmlElement, {isJsx} from './JsxhtmlElement'


export function html() {
    return new Elysia()
        .onAfterHandle(({ response }) => {
            if(isJsx(response)) {
                // console.log('RESPONSE',response)
                return new Response(`<!doctype html>${response}`, {
                    headers: {
                        'content-type': 'text/html; charset=utf8'
                    }
                })
            }
        })
}
