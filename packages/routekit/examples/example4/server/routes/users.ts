import { ok } from '@mpen/routekit'
import { valibotRoute } from '../valibot.ts'
import * as v from 'valibot'
import { HttpStatus } from '@mpen/http'
import * as s from '../schemas.ts'
import { StringInt } from '../schemas.ts'

export default valibotRoute({
    schema: {
        request: {
            path: v.object({
                id: StringInt,
            }),
        },
        response: {
            body: {
                [HttpStatus.OK]: v.object({
                    userId: v.number(),
                }),
            },
        },
    },
    handler({ path }) {
        return ok({ userId: path.id })
    },
})
