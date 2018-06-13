import dump from '../dump';
import {readDir, readJson} from '../util/fs';
import _objHash from 'object-hash';
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
// import conn from '../db';
// import {Command} from '../console';

const objHash = v => _objHash(v, {
    encoding: 'base64',
    respectType: false,
    unorderedArrays: false,
    unorderedSets: true,
    unorderedObjects: true,
})

const FIND_DATE_FORMAT = 'ddd DD MMM YYYY HH:mm:ss'; // https://stackoverflow.com/questions/848293/shell-script-get-all-files-modified-after-date#comment84300127_848327



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
        
    }
}