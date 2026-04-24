#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {forceStartMachine} from './src'

const PARSE_CONFIG = {
    args: process.argv,
    options: {
        flag1: {
            type: "boolean",
        },
        flag2: {
            type: "string",
        },
    },
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(values: Values, positionals: Positionals): Promise<number | void> {
    console.log(await forceStartMachine('foo'))
}


type Parsed = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Values = Parsed["values"]
type Positionals = Parsed["positionals"]

if(import.meta.main) {
    const {values, positionals} = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
        (exitCode) => {
            if(typeof exitCode === "number") {
                process.exitCode = exitCode
            }
        },
        (err) => {
            console.error(err ?? "An unknown error occurred")
            process.exitCode = 1
        },
    )
}
