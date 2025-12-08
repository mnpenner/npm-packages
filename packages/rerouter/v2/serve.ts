import router from './router-instance'
import { type Serve } from "bun";

// BUN_PORT=3001 bun v2/serve.ts
export default {
    fetch(req: Request) {
        return router.fetch(req)
    },
}satisfies Serve.Options<never>;
