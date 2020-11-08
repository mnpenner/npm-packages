import run from "clap";
import * as pkg from '../package.json'
import exportCommand from './commands/export'
import exportDataCommand from './commands/export-data'
import sqlCommand from './commands/sql'

// TODO:  generate json schema
//  .\node_modules\.bin/typescript-json-schema .\src\struct.ts OneMig
//  ./node_modules/.bin/ts-json-schema-generator -p .\src\struct.ts

run({
    name: "OneMig",
    version: pkg.version,
    argv0: pkg.name,
    commands: [
        exportCommand,
        exportDataCommand,
        sqlCommand,
    ]
})
