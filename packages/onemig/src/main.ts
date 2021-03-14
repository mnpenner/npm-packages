import run from "cli-api";
import * as pkg from '../package.json'
import commands from './commands'

// TODO:  generate json schema
//  .\node_modules\.bin/typescript-json-schema .\src\struct.ts OneMig
//  ./node_modules/.bin/ts-json-schema-generator -p .\src\struct.ts

run({
    name: "OneMig",
    version: pkg.version,
    argv0: pkg.name,
    commands
})

