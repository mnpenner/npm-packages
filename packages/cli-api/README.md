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
    .opt('name', {
        alias: 'n',
        description: 'Person you want to greet',
        required: true,
    })
    .run((args, kwargs) => {
        if (kwargs.verbose) {
            console.log('Preparing greeting...')
        }
        console.log(`Hello ${kwargs.name}`)
    })

await new App('hello')
    .meta({version: pkg.version, argv0: pkg.name})
    .command(world)
    .execute()
```

```shell
$ hello world --name Mark
Hello Mark
```
