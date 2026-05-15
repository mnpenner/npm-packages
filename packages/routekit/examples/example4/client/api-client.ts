import {FetchTransport} from '@mpen/routekit/client'
import { ApiClient } from './router.gen.ts'

export const apiClient = new ApiClient(new FetchTransport({baseUrl:'http://localhost:3000'}))
