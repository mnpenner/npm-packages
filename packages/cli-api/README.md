# cli-api

Easily create a CLI app.

## Usage

```ts
import {App, Command} from 'cli-api'
import * as pkg from '../package.json'

const world = new Command('world')
    .describe('Prints a greeting.')
    .flag('verbose', {
        alias: 'v',
        description: 'Print more info',
    })
    .arg('name', {
        description: 'Person you want to greet',
        required: true,
    })
    .run(opts => {
        if (opts.verbose) {
            console.log('Preparing greeting...')
        }
        console.log(`Hello ${opts.name}`)
    })

const app = new App('hello')
    .meta({version: pkg.version, bin: pkg.name})
    .command(world)

if(import.meta.main) {
    await app.execute()
}
```

```shell
$ hello world Mark
Hello Mark
```
