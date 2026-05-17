import { jsonResponse } from '@mpen/routekit'
import { HttpMethod, HttpStatus } from '@mpen/http'
import * as v from 'valibot'
import { valibotRoute } from '../valibot.ts'

export default valibotRoute({
    method: HttpMethod.GET,
    path: '/health',
    schema: {
        response: {
            body: {
                [HttpStatus.OK]: v.object({
                    ok: v.literal(true),
                }),
            },
        },
    },
    handler() {
        return jsonResponse({ ok: true })
    },
})
