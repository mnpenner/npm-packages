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

        const caches = [];
        for(const inputDir of opts.input) {
            caches.push(await readSchema(inputDir));
        }
        
        await combineCaches(caches,opts.output);
    }
}