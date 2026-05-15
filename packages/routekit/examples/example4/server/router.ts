import { Router, jsonResponse, plainTextResponse } from '@mpen/routekit'

const router = new Router()

router.get('/', () => plainTextResponse("Hello from RouteKit!"))

router.get('/users/:id', ({ pathParams }) => {
    const { id } = pathParams as { id: string }
    return jsonResponse({ id })
})

export default router
