#!/usr/bin/env bun
import {App} from '../src'

const app = new App('repeatable')
    .arguments([
        {
            name: 'alpha',
            repeatable: true,
        },
        {
            name: 'beta',
            required: true,
        },
    ])
    .run(opts => {
        console.log({opts})
    })

if(import.meta.main) {
    await app.execute()
}


