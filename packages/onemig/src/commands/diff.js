import dump from '../dump';
import {readDir, readJson, writeJson} from '../util/fs';
import SshClient from '../ssh-client';
import Moment from 'moment';
import Chalk from 'chalk';
import * as async from '../util/async';
import objHash from 'object-hash';
import * as fs from '../util/fs';
import {dbNameMap,dbNames} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
// import conn from '../db';
// import {Command} from '../console';

const FIND_DATE_FORMAT = 'ddd DD MMM YYYY HH:mm:ss'; // https://stackoverflow.com/questions/848293/shell-script-get-all-files-modified-after-date#comment84300127_848327

export default {
    name: "diff",
    description: "Print the differences",
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
        // const allTables = Object.create(null);
        
        for(let filename of tableFiles) {
            const tbl = await readJson(filename);
            for(let {databases, ...struct} of tbl.versions) {
                for(let dbName of databases) {
                    console.log(`${dbName}.${tbl.name}`)
                    // fetch current struct
                }
                // dump(table.name,databases,struct);
                // return;
            }
        }
    }
}
