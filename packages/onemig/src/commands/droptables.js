import dump from '../dump';
import {readDir, readJson, writeJson} from '../util/fs';
import SshClient from '../ssh-client';
import Moment from 'moment';
import Chalk from 'chalk';
import * as async from '../util/async';
import _objHash from 'object-hash';
import * as fs from '../util/fs';
import napi,{dbNameMap,dbNames} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
import db from '../db';
import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../struct';
import ProgressBar from 'ascii-progress';
import Ajv from 'ajv';
import tableSchema from '../table.schema.js';
import {omit} from '../util/object';
import {isNumber, isObject, isPlainObject, isString} from '../util/types';
import {highlight} from 'cli-highlight';
import {toIter} from '../util/array';
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
    name: "droptables",
    description: "Drop any tables that are not present in the source code",
    options: [
        {
            name: 'dir',
            alias: 'd',
            description: "Source directory of struct JSON relative to current working directory",
            value: InputOption.Required,
            default: 'out',
        }
    ],
    async execute(args, opts) {
        const tableFiles = (await readDir(Path.join(opts.dir,'tables'))).filter(f => f.endsWith('.json'));

        const dbMap = new Map;
        
        for(let filename of tableFiles) {
            const tbl = await readJson(filename);

            for(let {databases, ...struct} of tbl.versions) {
                for(let dbName of databases) {
                    let tables = dbMap.get(dbName);
                    if(!tables) {
                        dbMap.set(dbName, tables = new Set);
                    }
                    tables.add(tbl.name);
                }
            }
        }
        
        dump(dbMap.keys());
    }
}