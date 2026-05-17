import { ok, response } from '@mpen/routekit'
import { HttpMethod, HttpStatus } from '@mpen/http'
import * as v from 'valibot'
import { valibotRoute } from '../valibot.ts'

export default valibotRoute({
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
