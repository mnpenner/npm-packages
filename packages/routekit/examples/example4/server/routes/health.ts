import { ok, response } from '@mpen/routekit'
import { HttpMethod, HttpStatus } from '@mpen/http'
import * as v from 'valibot'
import { route } from '../valibot.ts'

export default route({
    method: HttpMethod.GET,
    path: '/health',
    schema: {
        response: {
            body: {
                [HttpStatus.IM_A_TEAPOT]: v.object({
                    tea: v.string(),
                }),
                [HttpStatus.OK]: v.object({
                    ok: v.literal(true),
                }),
            },
        },
    },
    handler() {
        if (Math.random() < 0.5) {
            return response({ tea: 'pot' }, { status: HttpStatus.IM_A_TEAPOT })
        }
        return ok({ ok: true })
    },
})
