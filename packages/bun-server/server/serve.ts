import {serve} from './bun-server'
import {Router} from './router'


serve({
    timeout: 1000,
    log: true,
    router: new Router()
        .get('/',(req,res) => res.text("Welcome 2 my server"))
        .get('/socks',(req,res) => res.text("on your feet"))
})
