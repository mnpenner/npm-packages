import { Router, jsonResponse } from '@mpen/routekit'
import { valibotRoute } from '../valibot.ts'
import * as v from 'valibot'


export default valibotRoute({
    schema: {
        request: {
            path: {
                id: v.number(),
            },
        },
    },
    handler({ pathParams }) {
        return jsonResponse({ userId: pathParams.id })
    },
})
