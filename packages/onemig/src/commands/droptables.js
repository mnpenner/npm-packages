import dump from '../dump';
import {readDir, readJson, writeJson} from '../util/fs';
// import SshClient from '../ssh-client';
// import Moment from 'moment';
// import Chalk from 'chalk';
// import * as async from '../util/async';
// import _objHash from 'object-hash';
// import * as fs from '../util/fs';
// import napi,{dbNameMap,dbNames} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
// import db from '../db';
// import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../schema/struct';
// import ProgressBar from 'ascii-progress';
// import Ajv from 'ajv';
// import tableSchema from '../table.schema.js';
// import {omit} from '../util/object';
// import {isNumber, isObject, isPlainObject, isString} from '../util/types';
import {highlight} from 'cli-highlight';
// import {ciCompare, toIter} from '../util/array';
// import conn from '../db';
import Konsole from '../util/Konsole';
import napi from '../napi';
import DatabaseWrapper from '../mysql/DatabaseWrapper';
// import {Command} from '../console';



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
        const dbVars = napi.sharedDbVars('migrations');

        const conn = new DatabaseWrapper({
            host: opts.host || dbVars.host,
            port: opts.port || dbVars.port,
            user: opts.user || dbVars.login,
            password: opts.password || dbVars.password,
        });

        try {
            const tableFiles = (await readDir(Path.join(opts.dir, 'tables'))).filter(f => f.endsWith('.json'));

            const dbMap = new Map;

            for(let filename of tableFiles) {
                const tbl = await readJson(filename);

                for(let {databases} of tbl.versions) {
                    for(let dbName of databases) {
                        let tables = dbMap.get(dbName);
                        if(!tables) {
                            dbMap.set(dbName, tables = new Set);
                        }
                        tables.add(tbl.name);
                    }
                }
            }

            const spinners = '⣾⣽⣻⢿⡿⣟⣯⣷';
            let si = 0;
            let di = 0;
            const kon = new Konsole;


            for(const [dbName, desiredTables] of dbMap) {
                // kon.rewrite(`${spinners[si]} ${dbName} ${++di}/${dbMap.size}`);
                kon.rewrite(`${(di++ / dbMap.size * 100).toFixed(1).padStart(5, ' ')}% ${dbName}`);
                si = (si + 1) % spinners.length;

                const currentTables = await conn.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLES.TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'`, [dbName]).fetchColumn();
                const diff = setDifference(currentTables, desiredTables);

                for(let tblName of diff) {
                    const sql = `DROP TABLE ${db.escapeId(dbName)}.${db.escapeId(tblName)};`;
                    kon.writeLn(highlight(sql, {language: 'sql', ignoreIllegals: true}));
                }
            }
            kon.clear();
            // dump(dbMap.keys());

            
        } finally {
            conn.close();
        }
    }
}

function setDifference(a,b) {
    return [...a].filter(x => !b.has(x));
}