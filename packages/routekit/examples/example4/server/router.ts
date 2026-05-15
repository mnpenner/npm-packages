import { Router } from '@mpen/routekit'
import userRoute from './routes/users.ts'

const router = new Router().get('/users/:id', userRoute)

export default router
