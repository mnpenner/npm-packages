# child-spawn

Easily execute shell commands and parse stdout.

```ts
import {nl, json, split0} from 'child-spawn'

async function main(args: string[]): Promise<number | void> {
    const lines = await nl`echo ${"foo\nbar"}`
    console.log(lines)

    const pkg = await json`jq -c . package.json`
    console.log(pkg)

    const files = await split0`find . -maxdepth 2 -type f -print0`
    console.log(files)
}

main(process.argv.slice(process.argv.findIndex(f => f === __filename) + 1))
    .then(exitCode => {
        if(typeof exitCode === 'number') {
            process.exitCode = exitCode
        }
    }, err => {
        if(err != null) {
            console.error(err)
        }
        process.exitCode = 255
    })
```

- Docs: https://mnpenner.github.io/child-spawn/
- Examples: https://github.com/mnpenner/child-spawn/blob/default/src/test.ts
