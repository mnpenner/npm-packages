import dump from '../dump';
import {readDir, readJson} from '../util/fs';
import objHash from 'object-hash';
// import napi, {dbNameMap} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
// import db from '../db';
// import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../schema/struct';
// import Ajv from 'ajv';
// import tableSchema from '../table.schema.js';
// import {omit} from '../util/object';
// import {isNumber, isObject, isPlainObject} from '../util/types';
// import {highlight} from 'cli-highlight';
// import {ciCompare, toIter} from '../util/array';
import Konsole from '../util/Konsole';
import Chalk from 'chalk';
import * as async from '../util/async';
import * as fs from '../util/fs';
import {addMany} from '../util/set';
import readSchema from '../schema/readSchema';
import combineCaches from '../schema/combineCaches';
import writeSchema from '../schema/writeSchema';


export default {
    name: "copydb",
    description: "Copy the schema for one database to another",
    options: [
        {
            name: 'source',
            alias: 's',
            description: "Source directory of struct JSON relative to current working directory",
            value: InputOption.Required,
            default: 'onemig',
        },
    ],
    async execute(args, opts) {
        if(args.length !== 2) throw new Error("copydb expects two args: <source> <dest>")
        const [srcDb,destDb] = args;
        
        let copied = 0;
        let skipped = 0;

        const tables = await readSchema(opts.source);
        for(const tbl of tables.values()) {
            for(let {databases} of tbl.versions) {
                const idx = databases.indexOf(srcDb);
                if(idx >= 0) {
                    if(!tbl.versions.some(ver => ver.databases.includes(destDb))) {
                        databases.push(destDb);
                        ++copied;
                    } else {
                        ++skipped;
                    }
                    break;
                }
            }
        }
        
        if(copied > 0) {
            await writeSchema(tables, opts.source);
        }
        console.log(`Copied ${Chalk.bold(copied)} tables from ${Chalk.bold(srcDb)} to ${Chalk.bold(destDb)}; ${Chalk.bold(skipped)} skipped`);
    }
}