#!bun -i

async function main(programArgs: string[]): Promise<number | void> {
    console.log(process.execPath)
    return 0
}

if(process.isBun && process.argv[1] === __filename) {
    main(process.argv.slice(2))
        .then(exitCode => {
            if(exitCode != null) {
                process.exitCode = exitCode
            }
        }, err => {
            console.error(err || "an unknown error occurred")
            process.exitCode = 1
        })
}
