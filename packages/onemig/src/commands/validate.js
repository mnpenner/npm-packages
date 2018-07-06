import dump from '../dump';
import {readDir, readJson} from '../util/fs';
// import objHash from 'object-hash';
// import napi, {dbNameMap} from '../napi';
// import {InputOption} from '../console';
import Path from 'path';
// import db from '../db';
// import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../schema/struct';
// import Ajv from 'ajv';
// import tableSchema from '../table.schema.js';
// import {omit} from '../util/object';
// import {isNumber, isObject, isPlainObject} from '../util/types';
// import {highlight} from 'cli-highlight';
import {ciCompare, toIter} from '../util/array';
// import Konsole from '../util/Konsole';
// import Chalk from 'chalk';
// import * as async from '../util/async';
// import * as fs from '../util/fs';
// import {addMany} from '../util/set';
// import conn from '../db';
// import Crypto from 'crypto';
import Validator from '../schema/validator';

export default {
    name: "validate",
    description: "Validate schemas",
    options: [
        // {
        //     name: 'dir',
        //     alias: 'd',
        //     description: "Source directory of struct JSON relative to current working directory",
        //     value: InputOption.Required,
        //     default: 'out',
        // },
    ],
    async execute(args, opts) {
        if(!args[0]) throw new Error("Please specify a directory to check");

        const validator = Validator();
        const tableMap = new Map;
        let errorCount = 0;

        for(let dir of args) {
            const tableFiles = (await readDir(Path.join(dir, 'tables'))).filter(f => f.endsWith('.json'));
            tableFiles.sort(ciCompare);

            for(let filename of tableFiles) {
                const tbl = await readJson(filename);
                const ajvErrors = validator.validate(tbl);
                if(ajvErrors) {
                    console.log(filename);
                    dump(ajvErrors);
                    ++errorCount;
                }
                for(let {databases} of tbl.versions) {
                    for(let dbName of databases) {
                        const key = JSON.stringify([dbName,tbl.name]);
                        if(tableMap.has(key)) {
                            console.log(`${dbName}.${tbl.name} already has a definition in ${tableMap.get(key)}; found another definition in ${filename}`)
                            ++errorCount;
                        } else {
                            tableMap.set(key,filename);
                        }
                    }
                }
            }
        }

        // TODO: warnings
        // process.stderr.write(`Foreign key ${dbName}.${tblName}.${fk.constraintName} on ${fk.columnName} points to another database ${fk.refDatabase}`);
        // process.stderr.write(`${dbName}.${tblName} does not have a PRIMARY key\n`);
        if(errorCount > 0) {
            console.log(`Found ${errorCount} errors`);
            return 1;
        }
        
        return 0;
    }
}
