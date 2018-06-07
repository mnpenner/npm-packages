import dump from '../dump';
import {readDir, readJson, writeJson} from '../util/fs';
import SshClient from '../ssh-client';
import Moment from 'moment';
import Chalk from 'chalk';
import * as async from '../util/async';
import _objHash from 'object-hash';
import * as fs from '../util/fs';
import {dbNameMap,dbNames} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
import db from '../db';
import {getStruct} from '../struct';
import ProgressBar from 'ascii-progress';
import Ajv from 'ajv';
import tableSchema from '../table.schema.js';
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
        
        // const pb = new ProgressBar({
        //     total: tableFiles.length,
        //     schema: " :filled.green:blank :current/:total :percent :elapseds :etas :tbl/:db",
        //     filled: '█',
        //     blank: '░',
        // });
        
        const ajv = new Ajv({
            allErrors: true,
            $data: true,
            extendRefs: 'fail',
        });
        ajv.addSchema(tableSchema,'root');
        
        // console.log(JSON.stringify(tableSchema,null,4));process.exit(0);
        
        // const validate = ajv.getSchema('#/definitions/Table');
        // const validate = ajv.compile(require(`../table.schema.json`));
        
        
        for(let filename of tableFiles) {
            const tbl = await readJson(filename);
            if(!ajv.validate('root#/defs/Table',tbl)) {
                console.log(filename);
                // console.log(ajv.errorsText());
                dump(ajv.errors);
                break;
            }
            // console.log(`${filename} is valid!!!!`);
            for(let {databases, ...desiredStruct} of tbl.versions) {
                for(let dbName of databases) {
                    // pb.tick(0, {tbl: tbl.name, db: dbName});
                    console.log(`${dbName}.${tbl.name}`)
                    // fetch current struct
                    const currentStruct = await getStruct(dbName,tbl.name);
                    
                    if(objHash(currentStruct) !== objHash(desiredStruct)) {
                        // oldName
                        
                        // https://dev.mysql.com/doc/refman/8.0/en/alter-table.html
                        
                        dump('CURRENT',currentStruct.columns);
                        dump('DESIRED',desiredStruct.columns);
                        const diff = diffColumns(currentStruct.columns, desiredStruct.columns);
                        dump('DIFF',diff);
                        
                        
                        // dump(added,removed,modified);
                        
                        process.exit(1);
                        // dump('struct changed!!!',dbName,tbl.name,currentStruct,desiredStruct);
                    }
                    
                    // dump(newStruct);
                }
                // dump(table.name,databases,struct);
                // return;
            }
            // pb.tick(1,{tbl:tbl.name,db:''});
        }
        
        db.close();
    }
}

function objEq(a,b) {
    return objHash(a) === objHash(b);
}

function createMap(arr,key='name') {
    return new Map(arr.map(o => [o[key],o]));
}

function diffColumns(before,after) {

    const currentColumns = createMap(before);
    const desiredColumns = createMap(after);

    let added = new Map;
    const dropped = [];
    const modified = [];
    const changed = [];
    const renamed = [];
    const altered = []; // TODO
    const oldNames = new Map;

    // dump(currentColumns,desiredColumns);

    for(let [colName,col] of desiredColumns) {
        if(!currentColumns.has(colName)) {
            // dump('added',colName,currentColumns.has(colName),desiredColumns.has(colName));
            added.set(colName,col); // AFTER...?
            if(col.oldName) {
                oldNames.set(col.oldName,col.name);
            }
        } else {
            if(!objEq(col,currentColumns.get(colName))) {
                // dump('modified',colName);
                modified.push(col);
            }
            currentColumns.delete(colName);
        }
    }

    // dump(currentColumns);
    for(let [colName,curCol] of currentColumns) {
        // dump('del',colName);
        if(oldNames.has(colName)) {
            const newName = oldNames.get(colName);
            const {oldName,...newDef} = added.get(newName);
            delete newDef.name;
            const {...curDef} = curCol;
            delete curDef.name;
            added.delete(newName);
            if(objEq(curDef,newDef)) {
                renamed.push({oldName,newName});
            } else {
                dump(curCol,newDef);
                changed.push({oldName,newName,...newDef});
            }
        } else {
            dropped.push(colName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());
    
    return {added,dropped,modified,changed,renamed,altered}
}