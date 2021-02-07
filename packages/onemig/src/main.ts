import run from "clap";
import * as pkg from '../package.json'
import exportCommand from './commands/export-schema'
import exportDataCommand from './commands/export-data'
import importDataCommand from './commands/import-data'
import sqlCommand from './commands/schema-sql'
import exportUsersCommand from './commands/export-users'
import usersSqlCommand from './commands/users-sql'

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
        importDataCommand,
        sqlCommand,
        exportUsersCommand,
        usersSqlCommand,
    ]
})
