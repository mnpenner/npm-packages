#!/usr/bin/env -S bun --hot --no-clear-screen
import {Router} from '../src'
import {plainTextResponse} from '../src/response/simple'
const router = new Router()

router.get('/ping', () => plainTextResponse('pong'))

export default router



