import {awk, escBash, json, nl, txt, split0} from './index'

async function main(args: string[]): Promise<number | void> {
    const text = await txt`echo ${"foo\nbar"}`
    console.log(text)

    const lines = await nl`echo ${"foo\nbar"}`
    console.log(lines)

    const pkg = await json`jq -c .name package.json`
    console.log(pkg)

    const files = await split0`find . -maxdepth 1 -type f -print0`
    console.log(files)

    const inception = await txt`bash -c ${escBash`echo ${`foo bar`}`}`  // FIXME: doesn't escape properly for `sh`
    console.log(inception)

    const table = await awk`cat table.txt`
    console.log(table)
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
