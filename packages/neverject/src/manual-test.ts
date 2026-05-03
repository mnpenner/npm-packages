import { err, ok } from './result.ts'

if(import.meta.main) {
    console.log(ok(true))
    console.log(err(false))
}
