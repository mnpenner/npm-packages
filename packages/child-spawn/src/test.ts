import {awk, escBash, json, nl, txt, split0, escDash} from './index'

async function main(args: string[]): Promise<number | void> {
    const text = await txt`echo ${"foo\nbar"}`
    console.log(text)

    const lines = await nl`echo ${"foo\nbar"}`
    console.log(lines)

    const pkg = await json`jq -c .name package.json`
    console.log(pkg)

    const files = await split0`find . -maxdepth 1 -type f -print0`
    console.log(files)

    const inception = await txt`sh -c ${escDash`echo ${`foo bar`}`}`
    console.log(inception)

    const table = await awk`cat table.txt`
    console.log(table)

    const ascii = await txt`printf '%q' ${Array.from({length:128}, (_,i) => String.fromCodePoint(i)).join('')}`
    console.log(ascii)
    // TODO: passthru``

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
