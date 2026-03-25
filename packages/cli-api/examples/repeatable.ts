#!/usr/bin/env bun
import {App} from '../src'

const app = new App('repeatable')
    .arg('alpha', {
        repeatable: true,
    })
    .arg('beta', {
        required: true
    })
    .run(opts => {
        console.log({opts})
    })

if(import.meta.main) {
    await app.execute()
}
