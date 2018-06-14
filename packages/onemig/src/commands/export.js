import dump from '../dump';
import {readJson,writeJson} from '../util/fs';
import SshClient from '../ssh-client';
import Moment from 'moment';
import Chalk from 'chalk';
import * as async from '../util/async';
import objHash from 'object-hash';
import * as fs from '../util/fs';
import {dbNameMap,dbNames} from '../napi';
import {getStruct} from '../schema/struct';
import InputOption from '../console/InputOption';
import Konsole from '../util/Konsole';
import Path from 'path';
// import conn from '../db';
// import {Command} from '../console';

const FIND_DATE_FORMAT = 'ddd DD MMM YYYY HH:mm:ss'; // https://stackoverflow.com/questions/848293/shell-script-get-all-files-modified-after-date#comment84300127_848327

export default {
    name: "export",
    description: "Export the current database schema",
    options: [
        {
            name: 'out',
            alias: 'd',
            description: "Output directory. Will overwrite any files.",
            value: InputOption.Required,
            default: 'out',
        }
    ],
    async execute(args, opts) {
        const conn = require('../db').default;
        
        
        try {
            const allTables = Object.create(null);
            
            const dbStream = conn.stream(`
                SELECT SCHEMA_NAME 'name' 
                FROM information_schema.SCHEMATA 
                WHERE SCHEMA_NAME IN (?)
                    #LIMIT 10
                `,[dbNames]);

            const kon = new Konsole;
            const spinners = '⣾⣽⣻⢿⡿⣟⣯⣷';
            let si = 0;
            
            for await(const db of dbStream) {
                const tblStream = conn.stream(`SELECT 
                        TABLE_NAME 'name'
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLES.TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'
                            #AND TABLE_NAME='outreach_report_consumption_drugs_methods'
                        `, [db.name]);

                for await(const tbl of tblStream) {
                    kon.rewrite(`${spinners[si]} ${db.name}.${tbl.name}`);
                    si = (si+1)%spinners.length;
                    
                    const tblDef = await getStruct(db.name,tbl.name);
                    

                    const tblHash = objHash(tblDef);
                    if(!allTables[tbl.name]) {
                        allTables[tbl.name] = {};
                    }
                    if(!allTables[tbl.name][tblHash]) {
                        allTables[tbl.name][tblHash] = {
                            databases: [db.name],
                            ...tblDef,
                        }
                    } else {
                        allTables[tbl.name][tblHash].databases.push(db.name);
                    }
                }
            }
            
            kon.clear();

            await async.forEach(Object.keys(allTables), async tblName => {
                let json = {
                    name: tblName,
                    versions: Object.values(allTables[tblName]),
                };
                const filename = Path.join(opts.out,`tables/${tblName}.json`);
                await fs.writeText(filename, JSON.stringify(json, null, 4));
                console.log(`wrote ${Chalk.underline(filename)}`);
            });
        } finally {
            conn.close();
        }
    }
}


/**
 * Takes a string in the format "'foo','bar''baz'" and splits it into an array ["foo", "bar'baz"]
 *
 * @param {string} subject
 * @returns {Array}
 */
function splitValues(subject) {
    if(!subject) {
        return [];
    }
    let terms = [];
    let term = '';
    let quoted = false;
    const q = "'";
    for(let i = 0; i < subject.length;) {
        let ch = subject[i];
        if(ch === q) {
            if(!quoted) {
                quoted = true;
            } else if(subject[i + 1] === q) {
                term += q;
                i += 2;
                continue;
            } else {
                quoted = false;
            }
        } else if(!quoted && ch === ',') {
            terms.push(term);
            term = '';
        } else {
            term += ch;
        }
        ++i;
    }
    terms.push(term);
    return terms;
}

const defaultWidths = {
    tinyint: 4,
    utinyint: 3,
    smallint: 6,
    usmallint: 5,
    mediumint: 9,
    umediumint: 8,
    int: 11,
    uint: 10,
    bigint: 20,
    ubigint: 20,
    decimal: [10,0],
    udecimal: [10,0],
    bit: 1,
};

function sortBy(array, prop) {
    return array.sort((a, b) => {
        if(a[prop] === 'PRIMARY') return -1;
        if(b[prop] === 'PRIMARY') return 1;
        return a[prop].localeCompare(b[prop]);
    });
}