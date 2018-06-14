import dump from '../dump';
import {readDir, readJson} from '../util/fs';
import objHash from 'object-hash';
import napi, {dbNameMap} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
import db from '../db';
import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../struct';
import Ajv from 'ajv';
import tableSchema from '../table.schema.js';
import {omit} from '../util/object';
import {isNumber, isObject, isPlainObject} from '../util/types';
import {highlight} from 'cli-highlight';
import {ciCompare, toIter} from '../util/array';
import Konsole from '../util/Konsole';
import Chalk from 'chalk';
import * as async from '../util/async';
import * as fs from '../util/fs';
import {addMany} from '../util/set';


export default {
    name: "combine",
    description: "Combine and reformat schemas",
    options: [
        {
            name: 'input',
            alias: 'i',
            description: "Input directory",
            value: InputOption.Required|InputOption.Array,
        },
        {
            name: 'output',
            alias: 'o',
            description: "Output directory",
            value: InputOption.Required,
        },
    ],
    async execute(args, opts) {
        if(!opts.input.length) throw new Error("One or more input directories required");
        if(!opts.output) throw new Error("Output directory required");

        const kon = new Konsole;
        const allTables = Object.create(null);
        
        // TODO: check if the same table for the same database was defined multiple times but with a different definition...
        
        for(const inputDir of opts.input) {
            const tableFiles = (await readDir(Path.join(inputDir,'tables'))).filter(f => f.endsWith('.json'));
            for(let filename of tableFiles) {
                kon.rewrite(`reading ${filename}`);
                const tbl = await readJson(filename);
                for(let {databases, ...tblDef} of tbl.versions) {
                    // TODO: maybe we should normalize the definition before hashing it..?
                    const tblHash = objHash(tblDef);
                    if(!allTables[tbl.name]) {
                        allTables[tbl.name] = {};
                    }
                    if(!allTables[tbl.name][tblHash]) {
                        allTables[tbl.name][tblHash] = {
                            databases: new Set(databases),
                            ...tblDef,
                        }
                    } else {
                        allTables[tbl.name][tblHash].databases::addMany(databases);
                    }
                }
            }
        }
        
        kon.clear();

        await async.forEach(Object.keys(allTables), async tblName => {
            let json = {
                name: tblName,
                versions: Object.values(allTables[tblName]).map(ver => ({
                    ...ver,
                    databases: Array.from(ver.databases),
                })),
            };
            const filename = Path.join(opts.output,`tables/${tblName}.json`);
            await fs.writeText(filename, JSON.stringify(json, null, 4));
            console.log(`wrote ${Chalk.underline(filename)}`);
        });
    }
}