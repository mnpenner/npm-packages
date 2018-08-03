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
import {addMany, intersection} from '../util/set';
import readSchema from '../schema/readSchema';
import combineCaches from '../schema/combineCaches';
import Lo from 'lodash';
import {resolveValue} from '../util/func';

const dbTsTypeMap = {
    enum: 'string',
    set: 'string', // maybe?
    tinyint: 'number',
    smallint: 'number',
    mediumint: 'number',
    int: 'number',
    bigint: 'number',
    float: 'number',
    decimal: 'string', // ??
    double: 'number', 
    bit: col => {
        if(!col.length || col.length === 1) {
            return 'boolean';
        }
        return 'Buffer';
    },
    char: 'string', 
    varchar: 'string', 
    binary: 'Buffer', 
    varbinary: 'Buffer', 
    year: 'number', 
    tinytext: 'string',
    text: 'string',
    mediumtext: 'string',
    longtext: 'string',
    tinyblob: 'Buffer',
    blob: 'Buffer',
    mediumblob: 'Buffer',
    longblob: 'Buffer', 
    time: 'string', 
    
}

export default {
    name: "typescript",
    description: "Export TypesSript interfaces",
    options: [
        {
            name: 'input',
            alias: 'i',
            description: "Input directory",
            value: InputOption.Required,
        },
        {
            name: 'output',
            alias: 'o',
            description: "Output directory",
            value: InputOption.Required,
        },
        {
            name: 'module',
            alias: 'm',
            description: "Module name",
            value: InputOption.Required,
            default: 'wxt',
        },
    ],
    async execute(args, opts) {
        if(!opts.input.length) throw new Error("One or more input directories required");
        if(!opts.output) throw new Error("Output directory required");

        const tables = await readSchema(opts.input);
        let lines = [];
        if(opts.module) {
            lines.push(`declare module ${escapeCol(opts.module)} {`);
        }

        for(let tbl of tables.values()) {
            const intf = {};
            const colSets = [];
            
            for(let ver of tbl.versions) {
                const colSet = new Set;
                for(let col of ver.columns) {
                    if(!intf[col.name]) {
                        intf[col.name] = col;
                    }
                    colSet.add(col.name);
                }
                colSets.push(colSet);
            }
            
            const required = intersection(...colSets);
            lines.push(`interface ${columnToKey(tbl.name)} {`);
            for(const [colName,col] of Object.entries(intf)) {
                let colType = resolveValue(dbTsTypeMap[col.type],col)
                if(col.null) {
                    colType += "|null";
                }
                if(col.comment) {
                    lines.push(`  /** ${col.comment} */`);
                }
                lines.push(`  ${escapeCol(colName)}${required.has(colName)?'':'?'}: ${colType},`)
            }
            lines.push("}\n");
        }
        if(opts.module) {
            lines.push(`}`);
        }
        
        await fs.writeText(Path.join(opts.output,'tables.d.ts'),lines.join("\n"));
    }
}

function escapeCol(col) {
    if(/\W/i.test(col)) {
        return JSON.stringify(col);
    }
    return col;
}

function columnToKey(name) {
    name = name.replace(/#/g,'Nbr');
    name = name.replace(/\$/g,'Dlr');
    name = Lo.camelCase(name);
    if(/^\d/.test(name)) name = '_' + name;
    return name[0].toUpperCase() + name.slice(1);
}
