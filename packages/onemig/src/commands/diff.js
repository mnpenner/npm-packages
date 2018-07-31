import dump from '../dump';
import {readDir, readJson} from '../util/fs';
import _objHash from 'object-hash';
import napi, {dbNameMap} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
// import db from '../db';
import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../schema/struct';
import Ajv from 'ajv';
import tableSchema from '../table.schema.js';
import {deepClone, omit} from '../util/object';
import {isNumber, isObject, isPlainObject} from '../util/types';
import {highlight} from 'cli-highlight';
import {ciCompare, toIter} from '../util/array';
import Konsole from '../util/Konsole';
import Validator from '../schema/validator';
import DatabaseWrapper, {escapeIdString} from '../mysql/DatabaseWrapper';
import readSchema from '../schema/readSchema';
import SpinnerKonsole from '../util/SpinnerKonsole';
import combineCaches from '../schema/combineCaches';
import Chalk from 'chalk';
import {addMany} from '../util/set';
// import conn from '../db';
// import {Command} from '../console';

function highlightSql(sql) {
    if(Array.isArray(sql)) sql = sql.join("\n");
    return highlight(sql, {
        language: 'sql',
        ignoreIllegals: true
    })
}

const MAX_TRIES = 1;

export default {
    name: "diff",
    description: "Print the differences",
    options: [
        {
            name: 'source',
            alias: 's',
            description: "Source directory of struct JSON relative to current working directory",
            value: InputOption.Required,
            default: 'onemig',
        },
        {
            name: 'cache',
            alias: 'c',
            description: "Cache directory of struct JSON. If this this does not match the current MySQL schema, bad things will happen. Schema can be exported ahead-of-time via `export` command for improved performance.",
            value: InputOption.Required,
            // default: null,
        },
        {
            name: 'drop-columns', // TODO: implement
            // alias: 'd',
            description: "Drop columns that are missing from the JSON schemas",
            value: InputOption.None,
        },
        {
            name: 'run',
            description: "Actually RUN the SQL. Might want to make a backup first.",
            value: InputOption.None,
        },
        {
            name: 'database',
            description: "Only run on these databases.",
            value: InputOption.Required | InputOption.Array,
        },
        {
            name: 'agency',
            description: "Only run on these agencies.",
            value: InputOption.Required | InputOption.Array,
        },
        {
            name: 'table',
            description: "Only update these tables.",
            value: InputOption.Required | InputOption.Array,
        },
        {
            name: 'host',
            alias: 'h',
            description: "Connect to the MySQL server on the given host.",
            value: InputOption.Required,
        },
        {
            name: 'port',
            alias: 'P',
            description: "The TCP/IP port number to use for the connection.",
            value: InputOption.Required,
        },
        {
            name: 'user',
            alias: 'u',
            description: "The MySQL user name to use when connecting to the server.",
            value: InputOption.Required,
        },
        {
            name: 'password',
            alias: 'p',
            description: "The password to use when connecting to the server.",
            value: InputOption.Required,
        },
    ],
    async execute(args, opts) {
        const dbVars = napi.sharedDbVars('migrations');
        const kon = new SpinnerKonsole;
        
        const errors = [];

        const db = new DatabaseWrapper({
            host: opts.host || dbVars.host,
            port: opts.port || dbVars.port,
            user: opts.user || dbVars.login,
            password: opts.password || dbVars.password,
        });
        try {
            const tables = await readSchema(opts.source);
            const cache = opts.cache ? await readSchema(opts.cache) : new Map;


            // shuffle(tableFiles);
            // const tableFiles = ['out/tables/fw_client_doc_ver.json'];
            // const allTables = Object.create(null);

            // const pb = new ProgressBar({
            //     total: tableFiles.length,
            //     schema: " :filled.green:blank :current/:total :percent :elapseds :etas :tbl/:db",
            //     filled: '█',
            //     blank: '░',
            // });
            
            const {serverCollation, defaultStorageEngine} = await db.query('SELECT @@collation_server serverCollation, @@default_storage_engine defaultStorageEngine').fetchRow();
            const databaseCollations = await db.query('SELECT SCHEMA_NAME,DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA').fetchPairs()
            // dump(defaultCollations)
            // process.exit(0);


            // console.log(JSON.stringify(tableSchema,null,4));process.exit(0);

            // const validate = ajv.getSchema('#/definitions/Table');
            // const validate = ajv.compile(require(`../table.schema.json`));
            // see also: http://shapecatcher.com/unicode/block/Tai_Xuan_Jing_Symbols
            // http://shapecatcher.com/unicode/block/Yijing_Hexagram_Symbols
            // omg yes: https://github.com/sindresorhus/cli-spinners/blob/HEAD/spinners.json
            // dots12 looks cool too....

            let di = -1;
            let dbSet;
            let tblSet;

            if(opts.database.length || opts.agency.length) {
                dbSet = new Set;
                if(opts.database.length) {
                    dbSet::addMany(opts.database);
                }
                if(opts.agency.length) {
                    for(let gsid of opts.agency) {
                        dbSet::addMany(Object.values(napi.dbNames(gsid)));
                    }
                }
            } else {
                dbSet = new Set(Object.keys(databaseCollations));
            }
            // dump(dbSet);process.exit();

            if(opts.table.length) {
                tblSet = new Set(opts.table);
            }

            for(let tbl of tables.values()) {
                ++di;

                if(tblSet && !tblSet.has(tbl.name)) {
                    continue;
                }
                // dump(tbl);
                // process.exit(0);

                // console.log(`${filename} is valid!!!!`);
                for(let {databases, ...plainDesiredStruct} of tbl.versions) {
                    for(let dbName of databases) {
                        if(!dbSet.has(dbName)) {
                            // kon.writeDebug('reject',dbName);
                            continue;
                        }
                        // kon.writeDebug('keep',dbName,tbl.name);
                        // pb.tick(0, {tbl: tbl.name, db: dbName});
                        kon.rewrite(`${(di / tables.size * 100).toFixed(1).padStart(5, ' ')}% ${dbName}.${tbl.name}`);
                        // fetch current struct

                        let currentStruct;

                        if(cache.has(tbl.name)) {
                            currentStruct = cache.get(tbl.name).versions.find(ver => ver.databases.includes(dbName));
                        }

                        const defaultCollation = databaseCollations[dbName] || serverCollation;

                        if(!currentStruct) {
                            // kon.writeLn(`Cache miss on ${dbName}.${tbl.name}`);
                            currentStruct = await getStruct(db, dbName, tbl.name, false);
                        }

                        const desiredStruct = deepClone(plainDesiredStruct);

                        if(!tbl.name.startsWith('sta_')) {
                            addStealthAuditTriggers(db, tbl.name, desiredStruct);
                        }
                        
                        // need to deep clone so that when we replace references, they don't get cached for the next db
                        // kon.writeDebug("BEFORE NROAMLZI",plainDesiredStruct);
                        normalizeStruct(desiredStruct, defaultStorageEngine, defaultCollation, dbName)
                        // kon.writeDebug("AFTER NROAMLZI",desiredStruct);process.exit();
                        
                       

                        for(let tries = MAX_TRIES; tries; --tries) {
                            if(!currentStruct) {
                                const createTableSql = getCreateTableSql(db, dbName, tbl.name, desiredStruct);
                                // TODO: seeds
                                if(createTableSql.length) {
                                    if(opts.run) {
                                        try {
                                            for(const stmt of createTableSql) {
                                                kon.writeLn(highlightSql(stmt));
                                                await db.exec(stmt);
                                            }
                                            if(opts.cache) {
                                                await updateCache(db, dbName, tbl, cache)
                                            }
                                        } catch(err) {
                                            errors.push({
                                                database: dbName,
                                                table: tbl.name,
                                                error: err,
                                            })
                                            kon.writeDebug(err)
                                            currentStruct = await getStruct(db, dbName, tbl.name, false);
                                            continue; // try again!
                                        }
                                    } else {
                                        kon.writeLn(highlightSql(createTableSql));
                                    }
                                }
                            } else {
                                // if(!currentStruct.options) {
                                //     dump(currentStruct);
                                //     process.exit(1);
                                // }
                                normalizeStruct(currentStruct, defaultStorageEngine, defaultCollation, dbName)


                                if(!objEq(currentStruct, desiredStruct)) {
                                    // oldName

                                    // https://dev.mysql.com/doc/refman/8.0/en/alter-table.html

                                    // console.log(`=== CURRENT ${dbName}.${tbl.name} ===`);
                                    // dump(currentStruct);
                                    // console.log(`=== DESIRED ${dbName}.${tbl.name} ===`);
                                    // dump(desiredStruct);
                                    // process.exit(1);
                                    
                                    // const diff = diffColumns(currentStruct.columns, desiredStruct.columns);
                                    // dump('DIFF',diff);
                                    //
                                    // const lines = columnDiffToSql(diff);
                                    // dump(lines);


                                    const alterTableSql = getAlterTableSql(db, dbName, tbl.name, currentStruct, desiredStruct, opts.dropColumns);
                                    // kon.writeDebug('keep3',dbName,tbl.name);
                                    if(alterTableSql.length) {
                                        // kon.writeDebug('keep4',dbName,tbl.name,alterTableSql,currentStruct,desiredStruct);
                                        if(opts.run) {
                                            try {
                                                for(const stmt of alterTableSql) {
                                                    kon.writeLn(highlightSql(stmt));
                                                    await db.exec(stmt);
                                                }
                                                if(opts.cache) {
                                                    await updateCache(db, dbName, tbl, cache)
                                                }
                                            } catch(err) { // TODO: move this catch down to bottom of the retry loop?? (share with create)
                                                errors.push({
                                                    database: dbName,
                                                    table: tbl.name,
                                                    error: err,
                                                })
                                                
                                                if(err.code === 'ER_TRG_ALREADY_EXISTS') {
                                                    kon.writeLn(`${Chalk.red(`Error:`)} Trigger already exists (see above SQL). This likely means that a trigger with this name already exists on a ${Chalk.italic('different')} table. Please find and remove or rename this trigger, then re-run onemig. The SQL for such is:\nSELECT EVENT_OBJECT_TABLE FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=${db.escapeValue(dbName)} AND TRIGGER_NAME='${Chalk.magenta.bold(`insert_conflicting_trigger_name_here`)}';`)
                                                    break; // no need to re-try; it won't work.
                                                } 

                                                // kon.writeDebug(err)
                                                kon.writeLn(`${Chalk.red.bold(err.code)}: ${err.message}`);
                                                currentStruct = await getStruct(db, dbName, tbl.name, false);

                                                continue; // something went wrong. grab a fresh struct and try again
                                            }
                                        } else {
                                            kon.writeLn(highlightSql(alterTableSql));
                                        }
                                    }

                                    // dump(added,removed,modified);

                                    // process.exit(1);
                                    // dump('struct changed!!!',dbName,tbl.name,currentStruct,desiredStruct);
                                } /*else {
                                    kon.writeDebug('same!!!',currentStruct,desiredStruct);
                                }*/
                                /*else {
                                                           dump('before and after are equal',currentStruct,desiredStruct);process.exit(254);
                                                       }*/
                            }
                            break; // yes, break at the end of a for-loop. we don't actually want to iterate unless there was error, in which case we'll use `continue`
                        }


                        // dump(newStruct);
                        // break; // FIXME: ****SKIP REST OF DATABASES, JUST FOR TESTING
                    }
                    // dump(table.name,databases,struct);
                    // return;
                }
                // pb.tick(1,{tbl:tbl.name,db:''});
            }
            kon.clear();

            if(opts.cache && opts.run) {
                await combineCaches([cache], opts.cache);
            }
        } finally {
            db.close();
        }
        
        if(errors.length) {
            console.log(`${Chalk.red(`${Chalk.bold(errors.length)} errors occurred:`)}`)
            for(const err of errors) {
                console.log(`- ${err.database}.${err.table}: ${err.error.code}: ${err.error.message}`);
            }
            return 1;
        }
    }
}

async function updateCache(conn, dbName, tbl, cache) {
    const struct = await getStruct(conn, dbName, tbl.name);
    // dump('struct',struct);
    const version = {
        ...struct,
        databases: [dbName],
    };
    if(cache.has(tbl.name)) {
        const versions = cache.get(tbl.name).versions;
        const idx = versions.findIndex(ver => ver.databases.includes(dbName));
        if(idx >= 0) {
            versions.splice(idx, 1);
        }
        versions.push(version)
    } else {
        cache.set(tbl.name, {
            name: tbl.name,
            versions: [version],
        })
    }
}

function normalizeNumber(x) {
    const str = String(x).replace(/^0+(?=\d)/, '');
    if(str.includes('.')) {
        return str.replace(/\.?0*$/, '') || '0';
    }
    return str;
}

function normalizeStruct(struct, defaultStorageEngine, defaultCollation, dbName) {
    normalizeOptions(struct.options, defaultStorageEngine, defaultCollation);
    struct.columns.forEach(c => normalizeColumn(c, struct.options.collation || defaultCollation))
    if(struct.indexes && struct.indexes.length) {
        struct.indexes.forEach(idx => normalizeIndex(idx))
    } else {
        delete struct.indexes;
    }
    if(struct.foreignKeys && struct.foreignKeys.length) {
        struct.foreignKeys.forEach(fk => normalizeForeignKey(fk, dbName))
    } else {
        delete struct.foreignKeys;
    }
    if(struct.triggers && struct.triggers.length) {
        struct.triggers.forEach(trig => normalizeTrigger(trig, dbName))
    } else {
        delete struct.triggers;
    }
    return struct;
}

function normalizeOptions(opt, defaultStorageEngine, defaultCollation) {
    if(!opt.collation) opt.collation = defaultCollation;
    if(!opt.comment) delete opt.comment;
    if(!opt.engine) opt.engine = defaultStorageEngine;
}

function normalizeIndex(idx) {
    if(idx.type === 'PRIMARY') idx.name = 'PRIMARY';
}

function normalizeForeignKey(fk, dbName) {
    // https://dev.mysql.com/doc/refman/5.6/en/create-table-foreign-keys.html -- "For an ON DELETE or ON UPDATE that is not specified, the default action is always RESTRICT"
    // NO ACTION: A keyword from standard SQL. In MySQL, equivalent to RESTRICT. The MySQL Server rejects the delete or update operation for the parent table if there is a related foreign key value in the referenced table. Some database systems have deferred checks, and NO ACTION is a deferred check. In MySQL, foreign key constraints are checked immediately, so NO ACTION is the same as RESTRICT."
    if(!fk.onDelete || fk.onDelete === 'NO ACTION') fk.onDelete = 'RESTRICT';
    if(!fk.onUpdate || fk.onUpdate === 'NO ACTION') fk.onUpdate = 'RESTRICT';
    if(fk.refDatabase) {
        fk.refDatabase = resolveDatabase(fk.refDatabase, dbName);
    }
}

function normalizeTrigger(trig, dbName) {
    // let's just ignore these for now...
    delete trig.definer;
    delete trig.sqlMode;

    const [gsid] = dbNameMap.get(dbName);
    trig.statement = trig.statement.replace(/{{\s*(\w+)\s*}}/g, (_, appId) => {
        // dump('hittt');process.exit(1);
        return escapeIdString(napi.dbName(gsid, appId));
    });
}

function normalizeColumn(col, tableCollation) {
    col.null = !!col.null;
    if(col.comment === '') delete col.comment;
    if(col.autoIncrement === false) delete col.autoIncrement;
    // TODO: normalize COLLATION with default collation...
    switch(col.type) {
        case 'tinyint':
        case 'smallint':
        case 'mediumint':
        case 'int':
        case 'bigint': {
            if(col.zerofill != null) {
                col.zerofill = parseInt(col.zerofill);
                col.unsigned = true;
            } else {
                delete col.zerofill;
                col.unsigned = !!col.unsigned;
            }
            if(col.default != null) col.default = normalizeNumber(col.default);
        }
            break;
        case 'float':
        case 'decimal':
        case 'double': {
            if(col.zerofill) {
                col.unsigned = col.zerofill = true;
            } else {
                delete col.zerofill;
                col.unsigned = !!col.unsigned;
            }
            if(col.default != null) col.default = normalizeNumber(col.default);
        }
            break;
        case 'bit': {
            if(col.length === undefined) col.length = 1;
            if(isNumber(col.default)) {
                col.default = `b'${dec2bin(col.default)}'`;
            }
            // if(isString(col.default)) {
            //     let [match, bits] = /^b'([01]+)'$/.exec(col.default);
            //     if(!match) {
            //         throw new Error(`Unexpected bit default: ${col.default}`);
            //     }
            //     col.default = parseInt(bits,2);
            // }
        }
            break;
        case 'char':
        case 'varchar':
        case 'tinytext':
        case 'text':
        case 'mediumtext':
        case 'longtext': {
            if(!col.collation) col.collation = tableCollation;
        }
            break;
        case 'time':
        case 'datetime':
        case 'timestamp': {
            if(col.fsp === 0) delete col.fsp;
        }
            break;
    }
}

function dec2bin(dec) {
    // https://stackoverflow.com/a/16155417/65387
    return (dec >>> 0).toString(2);
}

function getCreateTableSql(db, dbName, tblName, struct) {
    // https://dev.mysql.com/doc/refman/8.0/en/create-table.html
    let createSql = `CREATE TABLE ${db.escapeId(dbName)}.${db.escapeId(tblName)} (\n`;
    const lines = [
        ...getCreateColumns(db, struct.columns),
        ...getCreateIndexes(db, struct.indexes),
        ...getCreateForeignKeys(db, struct.foreignKeys),
    ];
    createSql += lines.map(l => `  ${l}`).join(',\n');
    createSql += `\n)`;
    createSql += getCreateOptions(db, struct.options).map(o => ' ' + o).join('');
    createSql += `;`;

    const statements = [createSql];

    if(struct.triggers) {
        for(const trig of struct.triggers) {
            statements.push(createTriggerSql(db, dbName, tblName, trig));
        }
    }

    return statements;
}


function getCreateColumns(db, columns) {
    return columns.map(col => db.escapeId(col.name) + ' ' + columnDefinition(db, col));
}


function indexDefinition(db, idx) {
    let sql = indexDefinition2(db, idx);
    if(idx.comment) {
        sql += ` COMMENT ${db.escapeValue(idx.comment)}`;
    }
    return sql;
}

function indexDefinition2(db, idx) {
    switch(idx.type) {
        case 'PRIMARY':
            return `PRIMARY KEY ${getIndexColumnsStr(db, idx.columns)}`;
        case 'INDEX':
        case 'KEY':
        case 'BTREE':
            return `KEY ${db.escapeId(idx.name)} ${getIndexColumnsStr(db, idx.columns)}`;
        case 'UNIQUE':
            return `UNIQUE KEY ${db.escapeId(idx.name)} ${getIndexColumnsStr(db, idx.columns)}`;
        case 'FULLTEXT':
            return `FULLTEXT KEY ${db.escapeId(idx.name)} ${getIndexColumnsStr(db, idx.columns)}`;
    }
    throw new Error(`Unsupported index type: ${idx.type}`);
}

function getCreateIndexes(db, indexes) {
    return indexes ? indexes.map(idx => indexDefinition(db, idx)) : [];
}

function fkDef(db, fk) {
    let sql = fkDef2(db, fk);
    if(fk.comment) {
        sql += ` COMMENT ${db.escapeValue(fk.comment)}`;
    }
    return sql;
}

function fkDef2(db, fk) {
    let sql = `CONSTRAINT ${db.escapeId(fk.name)} FOREIGN KEY ${getForeignKeyColumnsStr(db, fk.columns)} REFERENCES `;
    if(fk.refDatabase) {
        sql += db.escapeId(fk.refDatabase) + '.';
    }
    sql += `${db.escapeId(fk.refTable)}${getForeignKeyColumnsStr(db, fk.refColumns)}`;
    if(fk.onUpdate) {
        sql += ` ON UPDATE ${fk.onUpdate}`;
    }
    if(fk.onDelete) {
        sql += ` ON DELETE ${fk.onDelete}`;
    }
    return sql;
}

function getCreateForeignKeys(db, foreignKeys) {
    return foreignKeys ? foreignKeys.map(fk => fkDef(db, fk)) : []
}

function resolveDatabase(obj, dbName) {
    if(isObject(obj)) {
        const keys = Object.keys(obj);
        if(keys.length !== 1) throw new Error("Object notation must have exactly one key, got " + keys.join(', '));
        switch(keys[0]) {
            case '$app':
                const appId = obj[keys[0]];
                const [gsid] = dbNameMap.get(dbName);
                return napi.dbName(gsid, appId);
            default:
                throw new Error(`Unsupported key: ${keys[0]}`);
        }
    }
    return String(obj);
}

function getForeignKeyColumnsStr(db, columns) {
    return `(${columns.map(c => db.escapeId(c)).join(', ')})`;
}

function getIndexColumnsStr(db, columns) {
    return `(${columns.map(c => escapeIndex(db, c)).join(', ')})`;
}

function escapeIndex(db, fullName) {
    const m = /^(\S+)\((\d+)\)$/.exec(fullName);
    if(m) {
        return `${db.escapeId(m[1])}(${m[2]})`;
    }
    return db.escapeId(fullName);
}

function getCreateOptions(db, options) {
    const out = [];
    if(options.engine) {
        out.push(`ENGINE=${options.engine}`);
    }
    if(options.collation) {
        out.push(`COLLATE=${options.collation}`);
    }
    if(options.comment) {
        out.push(`COMMENT=${db.escapeValue(options.comment)}`);
    }
    return out;
}

function joinLines(lines) {
    return lines.map(l => `  ${l}`).join(',\n')
}

function getAlterTableSql(db, dbName, tableName, currentStruct, desiredStruct, dropColumns) {
    const statements = [];
    
    const fkSql = fkDiff(db, currentStruct.foreignKeys, desiredStruct.foreignKeys);
    
    if(fkSql.before.length) {
        // split into two separate statements because https://bugs.mysql.com/bug.php?id=15045
        statements.push(`ALTER TABLE ${db.escapeId(dbName)}.${db.escapeId(tableName)}\n${joinLines(fkSql.before)};`);
    }
    
    const lines = [
        ...optionsDiff(db, currentStruct.options, desiredStruct.options),
        ...columnDiff(db, currentStruct.columns, desiredStruct.columns, dropColumns),
        ...indexDiff(db, currentStruct.indexes, desiredStruct.indexes),
        ...fkSql.after,
    ];
  
    if(lines.length) {
        statements.push(`ALTER TABLE ${db.escapeId(dbName)}.${db.escapeId(tableName)}\n${joinLines(lines)};`);
    }
    const triggerStmts = triggerDiff(db, dbName, tableName, currentStruct.triggers, desiredStruct.triggers);
    statements.push(...triggerStmts);
    return statements;
}

function optionsDiff(db, before, after) {
    return getCreateOptions(db, objDiff(before, after));
}

/**
 * Returns values from `after` that are not the same as `before`
 *
 * @param {object} before
 * @param {object} after
 * @returns {object}
 */
function objDiff(before, after) {
    const out = Object.create(null);
    for(const k of Object.keys(after)) {
        if(!eq(before[k], after[k])) {
            out[k] = after[k];
        }
    }
    return out;
}

function columnDiff(db, cols1, cols2, dropColumns) {
    return columnDiffToSql(db, getColumnDiff(cols1, cols2), dropColumns);
}

function indexDiff(db, before, after) {
    return indexDiffToSql(db, getIndexDiff(before, after));
}

function fkDiff(db, before, after) {
    return fkDiffToSql(db, getForeignKeyDiff(before, after));
}

function triggerDiff(db, dbName, tableName, before, after) {
    return triggerDiffToSql(db, dbName, tableName, getTriggerDiff(before, after));
}

function objEq(a, b) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);

    if(ka.length !== kb.length) {
        return false;
    }

    for(const k of ka) {
        if(!eq(a[k], b[k])) {
            return false;
        }
    }

    return true;
}

function arrEq(a, b) {
    if(a.length !== b.length) return false;
    for(let i = 0; i < a.length; ++i) {
        if(!eq(a[i], b[i])) return false;
    }
    return true;
}

function eq(a, b) {
    if(Array.isArray(a) && Array.isArray(b)) {
        return arrEq(a, b);
    }
    if(isPlainObject(a) && isPlainObject(b)) {
        return objEq(a, b);
    }
    return Object.is(a, b);
}

function createMap(arr, key = 'name') {
    if(!arr || !arr.length) return new Map;
    const f = typeof key === 'function'
        ? o => [key(o), o]
        : o => [o[key], o];
    return new Map(arr.map(f));
}


const makeTriggerKey = ({timing, event}) => `${timing} ${event}`; // <-- TODO: change back to "name" for MySQL 8, where multiple triggers are allowed


function stripIndexLength(colName) {
    return colName.replace(/\(\d+\)$/, '');
}

function getPrimaryKeySql(db, struct, prefix) {
    const pk = struct.indexes ? struct.indexes.find(idx => idx.type === 'PRIMARY') : undefined;

    if(pk) {
        if(pk.columns.length === 1) {
            return `${prefix}.${db.escapeId(pk.columns[0])}`
        }
        return `CONCAT(';',${pk.columns.map(c => `${prefix}.${db.escapeId(c)}`).join(',')})`
    }
    return `CONCAT(';',${struct.columns.map(c => `${prefix}.${db.escapeId(c.name)}`).join(',')})`
}

function makeTrigger(db, tblName, struct, event, body) {

    const action = {
        INSERT: 'NEW',
        UPDATE: 'NEW',
        DELETE: 'OLD',
    }[event];


    return {
        name: `sta_${event.toLowerCase()}_${tblName}`.slice(0, 64),
        timing: 'AFTER',
        event: event,
        statement: `
thisTrigger: BEGIN
IF(@disable_triggers) THEN
  LEAVE thisTrigger;
END IF;
INSERT INTO {{pcs}}.sta_delta_table SET
    stt_request_token=@sta_request_token,
    stt_user=USER(),
    stt_database=DATABASE(),
    stt_table=${db.escapeValue(tblName)},
    stt_key=${getPrimaryKeySql(db, struct, action)},
    stt_action=${db.escapeValue(event)};
SET @sta_delta_table_id = LAST_INSERT_ID();
${Array.isArray(body) ? body.join("\n") : body}
END`.trim()
    }
}

function addStealthAuditTriggers(db, tblName, struct) {
    const triggers = createMap(struct.triggers, makeTriggerKey);

    // console.log("BEFORE");
    // dump(triggers);

    triggers.set('AFTER INSERT', makeTrigger(db, tblName, struct, 'INSERT', struct.columns.map(c => `INSERT INTO {{pcs}}.sta_delta_field SET stf_delta_table_id=@sta_delta_table_id, stf_column=${db.escapeValue(c.name)}, stf_value=BINARY NEW.${db.escapeId(c.name)};`)));
    triggers.set('AFTER UPDATE', makeTrigger(db, tblName, struct, 'UPDATE', struct.columns.map(c => `IF NOT (NEW.${db.escapeId(c.name)} <=> OLD.${db.escapeId(c.name)}) THEN
  INSERT INTO {{pcs}}.sta_delta_field SET stf_delta_table_id=@sta_delta_table_id, stf_column=${db.escapeValue(c.name)}, stf_value=BINARY NEW.${db.escapeId(c.name)};
END IF;`)));
    triggers.set('AFTER DELETE', makeTrigger(db, tblName, struct, 'DELETE', struct.columns.map(c => `INSERT INTO {{pcs}}.sta_delta_field SET stf_delta_table_id=@sta_delta_table_id, stf_column=${db.escapeValue(c.name)}, stf_value=BINARY OLD.${db.escapeId(c.name)};`)));

    // console.log("AFTER");
    // dump(triggers);

    struct.triggers = Array.from(triggers.values());
}

function getTriggerDiff(before, after) {
    const currentTriggers = createMap(before, makeTriggerKey);
    const desiredTriggers = createMap(after, makeTriggerKey);

    // console.log('============ CURRENT');
    // dump(currentTriggers);
    // console.log('============ DESIRED');
    // dump(desiredTriggers);
    // process.exit(1);

    const out = {
        drop: [],
        create: [],
        change: [],
    }

    for(let newTrig of desiredTriggers.values()) {
        const key = makeTriggerKey(newTrig);
        const curTrig = currentTriggers.get(key);

        if(!curTrig) {
            out.create.push(newTrig);
        } else {
            if(!objEq(newTrig, curTrig)) {
                out.change.push({old: curTrig, new: newTrig});
            }
            currentTriggers.delete(key);
        }
    }

    for(let curTrig of currentTriggers.values()) {
        out.drop.push(curTrig.name);
    }

    // dump(out);process.exit(1);

    return out;
}

function getForeignKeyDiff(before, after) {

    const currentForeignKeys = createMap(before);
    const desiredForeignKeys = createMap(after);

    let added = new Map;
    const dropped = [];
    const changed = []; // name *and* definition change
    const modified = []; // definition change only
    const renamed = []; // name change only; requires MySQL 5.7
    const oldNames = new Map;

    // dump(currentIndexes,desiredIndexes);

    for(let [fkName, fk] of desiredForeignKeys) {
        if(!currentForeignKeys.has(fkName)) {
            // dump('added',colName,currentIndexes.has(colName),desiredIndexes.has(colName));
            added.set(fkName, fk); // AFTER...?
            if(fk.oldName) {
                for(let oldName of toIter(fk.oldName)) {
                    oldNames.set(oldName, fk.name);
                }
            }
        } else {
            const currentFK = currentForeignKeys.get(fkName);
            fk = omit(fk, ['oldName']);
            if(!objEq(fk, currentFK)) {
                modified.push(fk);
            }
            currentForeignKeys.delete(fkName);
        }
    }

    // dump(currentIndexes);
    for(let [fkName, curfk] of currentForeignKeys) {
        // dump('del',colName);
        if(oldNames.has(fkName)) {
            const newName = oldNames.get(fkName);
            const newDef = added.get(newName);
            // delete newDef.name;
            // const {...curDef} = curCol;
            // delete curDef.name;
            added.delete(newName);
            // if(objEq(curDef,newDef)) {
            //     renamed.push({oldName,newName});
            // } else {
            changed.push({...newDef, oldName: curfk.name});
            // }
            // dump('changedchangedchangedchangedchanged',changed);
        } else {
            dropped.push(fkName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());

    return {added, dropped, modified, changed, renamed}
}

function getIndexDiff(before, after) {

    const currentIndexes = createMap(before);
    const desiredIndexes = createMap(after);

    let added = new Map;
    const dropped = [];
    const changed = []; // name *and* definition change
    const modified = []; // definition change only
    const renamed = []; // name change only; requires MySQL 5.7
    const oldNames = new Map;

    // dump(currentIndexes,desiredIndexes);

    for(let [idxName, idx] of desiredIndexes) {
        if(!currentIndexes.has(idxName)) {
            // dump('added',colName,currentIndexes.has(colName),desiredIndexes.has(colName));
            added.set(idxName, idx); // AFTER...?
            if(idx.oldName) {
                for(let oldName of toIter(idx.oldName)) {
                    oldNames.set(oldName, idx.name);
                }
            }
        } else {
            const currentCol = currentIndexes.get(idxName);
            idx = omit(idx, ['oldName']);
            if(!objEq(idx, currentCol)) {
                modified.push(idx);
            }
            currentIndexes.delete(idxName);
        }
    }

    // dump(currentIndexes);
    for(let [idxName, curIdx] of currentIndexes) {
        // dump('del',colName);
        if(oldNames.has(idxName)) {
            const newName = oldNames.get(idxName);
            const newDef = added.get(newName);
            // delete newDef.name;
            // const {...curDef} = curCol;
            // delete curDef.name;
            added.delete(newName);
            // if(objEq(curDef,newDef)) {
            //     renamed.push({oldName,newName});
            // } else {
            changed.push({...newDef, oldName: curIdx.name});
            // }
            // dump('changedchangedchangedchangedchanged',changed);
        } else {
            dropped.push(idxName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());

    return {added, dropped, modified, changed, renamed}
}

function getColumnDiff(before, after) {

    const currentColumns = createMap(before);
    const desiredColumns = createMap(after);

    let added = new Map;
    const dropped = [];
    const modified = [];
    const changed = [];
    const renamed = []; // needs MySQL 8
    const altered = [];
    const oldNames = new Map;

    // dump(currentColumns,desiredColumns);

    for(let [colName, col] of desiredColumns) {
        if(!currentColumns.has(colName)) {
            // dump('added',colName,currentColumns.has(colName),desiredColumns.has(colName));
            added.set(colName, col); // AFTER...?
            if(col.oldName) {
                for(let oldName of toIter(col.oldName)) {
                    oldNames.set(oldName, col.name);
                }
            }
        } else {
            const currentCol = currentColumns.get(colName);
            col = omit(col, ['oldName']);
            if(!objEq(col, currentCol)) {
                // dump('modified',colName);
                if(objEq(omit(col, ['default']), omit(currentCol, ['default']))) {
                    altered.push({
                        name: colName,
                        default: col.default,
                    })
                } else {
                    modified.push(col);
                }
            }
            currentColumns.delete(colName);
        }
    }

    // dump(currentColumns);
    for(let [colName, curCol] of currentColumns) {
        // dump('del',colName);
        if(oldNames.has(colName)) {
            const newName = oldNames.get(colName);
            const newDef = added.get(newName);
            // delete newDef.name;
            // const {...curDef} = curCol;
            // delete curDef.name;
            added.delete(newName);
            // if(objEq(curDef,newDef)) {
            //     renamed.push({oldName,newName});
            // } else {
            //     changed.push({...newDef,oldName: curCol.name});
            changed.push({new: newDef, old: curCol});
            // }
            // dump('changedchangedchangedchangedchanged',changed);
        } else {
            dropped.push(colName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());

    return {added, dropped, modified, changed, renamed, altered}
}

function triggerDiffToSql(db, dbName, tableName, diff) {

    const stmts = [];

    for(let trigName of diff.drop) {
        stmts.push(`DROP TRIGGER ${db.escapeId(dbName)}.${db.escapeId(trigName)};`)
    }
    for(let trig of diff.change) {
        stmts.push(`DROP TRIGGER ${db.escapeId(dbName)}.${db.escapeId(trig.old.name)};`)
        stmts.push(createTriggerSql(db, dbName, tableName, trig.new));
    }
    for(let trig of diff.create) {
        stmts.push(createTriggerSql(db, dbName, tableName, trig));
    }

    return stmts;
}

function createTriggerSql(db, dbName, tblName, trig) {
    //   if(preg_match('#\A\s*\{\{\s*(\w+)\s*\}\}\s*\z#',$id,$m)) {
    // const [gsid] = dbNameMap.get(dbName);
    // const stmt = trig.statement.replace(/{{\s*(\w+)\s*}}/g, (_, appId) => {
    //     return db.escapeId(napi.dbName(gsid, appId));
    // });
    // TODO: definer?
    return `CREATE TRIGGER ${db.escapeId(dbName)}.${db.escapeId(trig.name)} ${trig.timing} ${trig.event} ON ${db.escapeId(dbName)}.${db.escapeId(tblName)} FOR EACH ROW\n${trig.statement};` // DELIMITER ;
}

function fkDiffToSql(db, diff) {
    // dump(diff);process.exit(1);
    // FIXME/workaround: MySQL still hasn't fixed this friggin bug from 2005 https://bugs.mysql.com/bug.php?id=15045
    const before = [];
    const after = [];
    for(let fk of diff.dropped) {
        // has to be DROP FOREIGN KEY -- https://stackoverflow.com/a/14122155/65387
        after.push(`DROP FOREIGN KEY ${db.escapeId(fk)}`)
    }
    for(let fk of diff.changed) {
        before.push(`DROP FOREIGN KEY ${db.escapeId(fk.oldName)}`)
        after.push(`ADD ${fkDef(db, fk)}`)
    }
    for(let fk of diff.modified) {
        before.push(`DROP FOREIGN KEY ${db.escapeId(fk.name)}`)
        after.push(`ADD ${fkDef(db, fk)}`)
    }
    for(let fk of diff.renamed) {
        after.push(`RENAME FOREIGN KEY ${db.escapeId(fk.oldName)} TO ${db.escapeId(fk.newName)}`)
    }
    for(let fk of diff.added) {
        after.push(`ADD ${fkDef(db, fk)}`)
    }
    return {before,after};
}

function indexDiffToSql(db, diff) {
    // dump(diff);process.exit(1);
    const lines = [];
    for(let idx of diff.dropped) {
        lines.push(`DROP INDEX ${db.escapeId(idx)}`) // I *think* this works fine for PRIMARY keys too!
    }
    for(let idx of diff.changed) {
        lines.push(`DROP INDEX ${db.escapeId(idx.oldName)}`)
        lines.push(`ADD ${indexDefinition(db, idx)}`)
    }
    for(let idx of diff.modified) {
        lines.push(`DROP INDEX ${db.escapeId(idx.name)}`)
        lines.push(`ADD ${indexDefinition(db, idx)}`)
    }
    for(let idx of diff.renamed) {
        lines.push(`RENAME INDEX ${db.escapeId(idx.oldName)} TO ${db.escapeId(idx.newName)}`)
    }
    for(let idx of diff.added) {
        lines.push(`ADD ${indexDefinition(db, idx)}`)
    }
    return lines;
}

function columnDiffToSql(db, diff, dropColumns) {
    const lines = [];
    if(dropColumns) {
        for(let colName of diff.dropped) {
            let sql = `DROP COLUMN ${db.escapeId(colName)}`;
            if(!dropColumns) {
                sql = `/*(SKIP) ${sql} */`;
            }
            lines.push(sql)
        }
    }
    for(let col of diff.modified) {
        lines.push(`MODIFY COLUMN ${db.escapeId(col.name)} ${columnDefinition(db, col)}`)
    }
    for(let col of diff.changed) {
        lines.push(`CHANGE COLUMN ${db.escapeId(col.old.name)} ${db.escapeId(col.new.name)} ${columnDefinition(db, col.new)}`)
        if(!dropColumns) {
            // FIXME: should we copy the old data back into this column too?
            const old = {
                ...col.old,
                comment: `DEPRECATED: Renamed to "${col.new.name}"`,
                autoIncrement: false,
            };
            if(old.default === undefined) {
                old.null = true;
                old.default = null;
            }
            lines.push(`ADD COLUMN ${db.escapeId(col.old.name)} ${columnDefinition(db, old)}`)
        }
    }
    for(let col of diff.renamed) { // MySQL 8.0+
        throw new Error("Renaming is not fully supported");
        lines.push(`RENAME COLUMN ${db.escapeId(col.oldName)} TO ${db.escapeId(col.newName)}`)
    }
    for(let col of diff.altered) {
        lines.push(`ALTER COLUMN ${db.escapeId(col.name)} ${col.default === undefined ? "DROP DEFAULT" : `SET DEFAULT ${getDefault(db, col)}`}`)
    }
    for(let col of diff.added) {
        lines.push(`ADD COLUMN ${db.escapeId(col.name)} ${columnDefinition(db, col)}`)
    }
    return lines;
}

function getDefault(db, col) {
    if(col.default === undefined) return undefined;
    if(col.default === null) return 'NULL';
    switch(col.type) {
        case 'timestamp':
        case 'datetime':
            if(col.default === 'CURRENT_TIMESTAMP') {
                return col.default;
            }
            break;
        case 'bit':
            if(/^b'([01]+)'$/.test(col.default)) {
                return col.default;
            }
            break;
    }
    return db.escapeValue(col.default);
}

function columnDefinition(db, col) {
    let str = col.type + columnDefinition2(db, col);
    if(col.collation) {
        str += ` COLLATE ${col.collation}`;
    }
    if(!col.null) {
        str += ' NOT NULL';
    }
    if(col.default !== undefined) {
        str += ` DEFAULT ${getDefault(db, col)}`;
    }
    if(col.comment) {
        str += ` COMMENT ${db.escapeValue(col.comment)}`;
    }
    if(col.autoIncrement) {
        str += ` AUTO_INCREMENT`;
    }
    return str;
}

function columnDefinition2(db, col) {
    // https://dev.mysql.com/doc/refman/8.0/en/create-table.html
    switch(col.type) {
        case 'tinyint':
        case 'smallint':
        case 'mediumint':
        case 'int':
        case 'bigint': {
            if(col.zerofill != null) {
                return `(${col.zerofill}) unsigned zerofill`
            }
            if(col.unsigned) {
                return ' unsigned';
            }
            return '';
        }
        case 'float':
        case 'decimal':
        case 'double': {
            let str = '';
            if(col.precision) {
                str += `(${col.precision.join(',')})`
            }
            if(col.unsigned || col.zerofill) {
                str += ' unsigned';
            }
            if(col.zerofill) {
                str += ' zerofill';
            }
            return str;
        }
        case 'char':
        case 'varchar':
        case 'bit':
        case 'binary':
        case 'varbinary':
            return `(${col.length})`;
        case 'tinytext':
        case 'text':
        case 'mediumtext':
        case 'longtext':
        case 'tinyblob':
        case 'blob':
        case 'mediumblob':
        case 'longblob':
        case 'date':
            return '';
        case 'year':
            if(col.width) return `(${col.width})`;
            return '';
        case 'enum':
        case 'set':
            return `(${col.values.map(c => db.escapeValue(c)).join(',')})`;
        case 'time':
        case 'datetime':
        case 'timestamp':
            if(col.fsp) return `(${col.fsp})`;
            return '';
    }
    throw new Error(`Unsupported column type: ${col.type}`);
}

