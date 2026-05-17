import { Router } from '@mpen/routekit'
import healthRoute from './routes/health.ts'
import userRoute from './routes/users.ts'

const router = new Router().add(healthRoute).get('/users/:id', userRoute)

export default router
