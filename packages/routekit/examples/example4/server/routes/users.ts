import { jsonResponse } from '@mpen/routekit'
import { valibotRoute } from '../valibot.ts'
import * as v from 'valibot'

export default valibotRoute({
    schema: {
        request: {
            path: v.object({
                id: v.pipe(v.string(), v.transform(Number), v.integer()),
            }),
        },
    },
    handler({ path }) {
        return jsonResponse({ userId: path.id })
    },
})
