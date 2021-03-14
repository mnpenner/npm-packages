# cli-api

Easily create a CLI app.

## Usage

```ts
import run from "cli-api";
import * as pkg from '../package.json'
import commands from './commands'

run({
    name: "hello",
    version: pkg.version,
    argv0: pkg.name,
    commands: [
        {
            name: "world",
            alias: 'w',
            description: 'Prints "Hello World".',
            async execute(opts, args) {
                console.log(`Hello ${opts.name}`)
            },
            options: [
                {
                    name: 'name',
                    alias: 'n',
                    description: "Person you want to greet",
                    required: true,
                },
            ]
        }
    ]
})
```

```shell
$ hello world -n Mark
Hello Mark
```
