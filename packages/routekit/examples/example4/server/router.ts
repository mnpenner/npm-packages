import { Router } from '@mpen/routekit'
import healthRoute from './routes/health.ts'
import userRoute from './routes/users.ts'
import { TerminalLogger,ConsoleLogger } from '@mpen/logger'

const router = new Router({ logger: new TerminalLogger() })
    .add(healthRoute)
    .get('/users/:id', userRoute)

export default router
