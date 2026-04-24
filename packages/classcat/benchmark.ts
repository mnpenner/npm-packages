#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {$} from 'bun'
import {bench, group, run, summary} from 'mitata'
import {cc} from './classcat'


const PARSE_CONFIG = {
    options: {
        format: {
            type: "string",
            default: 'mitata'
        }
    },
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(options: Options, positionals: Positionals): Promise<number | void> {

    const simpleStrings = ['btn', 'btn-primary', 'is-active']
    const arrayInput = ['btn', false, null, undefined, 0, 'btn-primary', true, 'is-active']
    const objectInput = {
        btn: true,
        'btn-primary': true,
        'is-disabled': false,
        'is-loading': 0,
        'is-active': 1,
    }
    const nestedInput = [
        'btn',
        ['btn-primary', [false, 'is-active', {'has-icon': true, 'is-disabled': false}]],
        {'size-lg': true},
    ]

    summary(() => {
        group('classcat', () => {
            bench('strings', () => {
                cc(...simpleStrings)
            })

            bench('array', () => {
                cc(arrayInput)
            })

            bench('object', () => {
                cc(objectInput)
            })

            bench('nested', () => {
                cc(nestedInput)
            })

            bench('mixed arguments', () => {
                cc('btn', ['btn-primary', {'has-icon': true}], objectInput, 0, false, null)
            })
        })
    })

    await run({format: options.format as MitataFormat})

}

type MitataOptions = NonNullable<Parameters<typeof run>[0]>
type MitataFormat = MitataOptions["format"]

//#region Invoke main
type _ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = _ParsedConfig["values"]
type Positionals = _ParsedConfig["positionals"]

if(import.meta.main) {
    const {values, positionals} = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
        (exitCode) => {
            if(typeof exitCode === "number") {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if(err instanceof $.ShellError) {
                console.error(`Command failed with exit code ${err.exitCode}`)
                process.exitCode = err.exitCode
            } else {
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
