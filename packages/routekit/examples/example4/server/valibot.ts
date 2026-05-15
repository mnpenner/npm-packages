import { createValibotRoutes } from '@mpen/routekit/routes'
import { IS_DEV } from './env.ts'
import * as v from 'valibot'
import { HttpStatus } from '@mpen/http-helpers'

export const valibotRoute = createValibotRoutes({
    validateResponse: IS_DEV,
    schema: {
        response: {
            body: {
                [HttpStatus.BAD_REQUEST]: v.object({ message: v.string() }),
            },
        },
    },
})
