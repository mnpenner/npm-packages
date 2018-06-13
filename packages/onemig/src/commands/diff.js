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
        tableFiles.sort(ciCompare);
        // shuffle(tableFiles);
        // const tableFiles = ['out/tables/outreach_report_consumption_drugs_methods.json'];
        // const allTables = Object.create(null);
        
        // const pb = new ProgressBar({
        //     total: tableFiles.length,
        //     schema: " :filled.green:blank :current/:total :percent :elapseds :etas :tbl/:db",
        //     filled: '█',
        //     blank: '░',
        // });
        
        const defaultStorageEngine = await getDefaultStorageEngine();
        
        const ajv = new Ajv({
            allErrors: true,
            $data: true,
            extendRefs: 'fail',
        });
        ajv.addSchema(tableSchema,'root');
        
        // console.log(JSON.stringify(tableSchema,null,4));process.exit(0);
        
        // const validate = ajv.getSchema('#/definitions/Table');
        // const validate = ajv.compile(require(`../table.schema.json`));
        const spinners = '⣾⣽⣻⢿⡿⣟⣯⣷';
        let si = 0;
        const kon = new Konsole;
        let di = -1;
        
        for(let filename of tableFiles) {
            ++di;
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
                    kon.rewrite(`${spinners[si]} ${(di/tableFiles.length*100).toFixed(1).padStart(5, ' ')}% ${dbName}.${tbl.name}`);
                    si = (si+1)%spinners.length;
                    // fetch current struct
                    const currentStruct = await getStruct(dbName,tbl.name);

                    const defaultCollation = await getDatabaseCollation(dbName);

                    normalizeStruct(desiredStruct, defaultStorageEngine, defaultCollation, dbName)
                        
                  
                    
                    if(!currentStruct) {
                        const createTableSql = getCreateTableSql(dbName,tbl.name, desiredStruct);
                        if(createTableSql) {
                            kon.writeLn(highlight(createTableSql, {language: 'sql', ignoreIllegals: true}));
                        }
                    } else {
                        normalizeStruct(currentStruct, defaultStorageEngine, defaultCollation, dbName)

                      
                        if(!objEq(currentStruct, desiredStruct)) {
                            // oldName

                            // https://dev.mysql.com/doc/refman/8.0/en/alter-table.html

                            // console.log('=== CURRENT ===');
                            // dump(currentStruct);
                            // console.log('=== DESIRED ===');
                            // dump(desiredStruct);
                            // const diff = diffColumns(currentStruct.columns, desiredStruct.columns);
                            // dump('DIFF',diff);
                            //
                            // const lines = columnDiffToSql(diff);
                            // dump(lines);

                            const alterTableSql = getAlterTableSql(dbName,tbl.name, currentStruct, desiredStruct);
                            if(alterTableSql) {
                                kon.writeLn(highlight(alterTableSql, {language: 'sql', ignoreIllegals: true}));
                            }


                            // dump(added,removed,modified);

                            // process.exit(1);
                            // dump('struct changed!!!',dbName,tbl.name,currentStruct,desiredStruct);
                        } /*else {
                            dump('before and after are equal',currentStruct,desiredStruct);process.exit(254);
                        }*/
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
        db.close();
    }
}

function trimZeros(x) {
    const str = String(x).replace(/^0+(?=\d)/,'');
    if(str.includes('.')) {
        return str.replace(/\.?0*$/,'');
    }
    return str;
}

function normalizeStruct(struct, defaultStorageEngine, defaultCollation, dbName) {
    normalizeOptions(struct.options, defaultStorageEngine, defaultCollation);
    struct.columns.forEach(c => normalizeColumn(c,struct.options.collation||defaultCollation))
    struct.indexes.forEach(idx => normalizeIndex(idx))
    struct.foreignKeys.forEach(fk => normalizeForeignKey(fk, dbName))
}

function normalizeOptions(opt, defaultStorageEngine, defaultCollation) {
    if(!opt.collation) opt.collation = defaultCollation;
    if(!opt.comment) delete opt.comment;
    if(!opt.engine) opt.engine = defaultStorageEngine;
}

function normalizeIndex(idx) {
    if(idx.type === 'PRIMARY') idx.name = 'PRIMARY';
}

function normalizeForeignKey(fk,dbName) {
    // https://dev.mysql.com/doc/refman/5.6/en/create-table-foreign-keys.html -- "For an ON DELETE or ON UPDATE that is not specified, the default action is always RESTRICT"
    if(!fk.onDelete) fk.onDelete = 'RESTRICT';
    if(!fk.onUpdate) fk.onDelete = 'RESTRICT';
    if(fk.refDatabase) {
        fk.refDatabase = resolveDatabase(fk.refDatabase,dbName);
    }
}

function normalizeColumn(col,tableCollation) {
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
            if(col.default != null) col.default = trimZeros(col.default);
        } break;
        case 'float':
        case 'decimal':
        case 'double': {
            if(col.zerofill) {
                col.unsigned = col.zerofill = true;
            } else {
                col.zerofill = false;
                col.unsigned = !!col.unsigned;
            }
            if(col.default != null) col.default = trimZeros(col.default);
        } break;
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
        } break;
        case 'char':
        case 'varchar':
        case 'tinytext':
        case 'text':
        case 'mediumtext':
        case 'longtext': {
            if(!col.collation) col.collation = tableCollation;
        } break;
        case 'time':
        case 'datetime':
        case 'timestamp': {
            if(col.fsp === 0) delete col.fsp;
        } break;
    }
}

function dec2bin(dec){
    // https://stackoverflow.com/a/16155417/65387
    return (dec >>> 0).toString(2);
}

function getCreateTableSql(dbName,tblName,struct) {
    // https://dev.mysql.com/doc/refman/8.0/en/create-table.html
    let sql = `CREATE TABLE ${db.escapeId(dbName)}.${db.escapeId(tblName)} (\n`;
    const lines = [
        ...getCreateColumns(struct.columns),
        ...getCreateIndexes(struct.indexes),
        ...getCreateForeignKeys(struct.foreignKeys),
    ];
    sql += lines.map(l => `  ${l}`).join(',\n');
    sql += `\n)`;
    sql += getCreateOptions(struct.options).map(o => ' '+o).join('');
    sql += `;`;
    return sql;
}


function getCreateColumns(columns) {
    return columns.map(col => db.escapeId(col.name)+' '+columnDefinition(col));
}

function indexDefinition(idx) {
    switch(idx.type) {
        case 'PRIMARY':
            return `PRIMARY KEY ${getIndexColumnsStr(idx.columns)}`;
        case 'INDEX':
        case 'KEY':
        case 'BTREE':
            return `INDEX ${db.escapeId(idx.name)} ${getIndexColumnsStr(idx.columns)}`;
        case 'UNIQUE':
            return `UNIQUE KEY ${db.escapeId(idx.name)} ${getIndexColumnsStr(idx.columns)}`;
        case 'FULLTEXT':
            return `FULLTEXT KEY ${db.escapeId(idx.name)} ${getIndexColumnsStr(idx.columns)}`;
    }
    throw new Error(`Unsupported index type: ${idx.type}`);
}

function getCreateIndexes(indexes) {
    return indexes.map(indexDefinition)
}

function fkDef(fk) {
    let sql = `FOREIGN KEY ${db.escapeId(fk.name)} ${getForeignKeyColumnsStr(fk.columns)} REFERENCES `;
    if(fk.refDatabase) {
        sql += db.escapeId(fk.refDatabase)+'.';
    }
    sql += `${db.escapeId(fk.refTable)}${getForeignKeyColumnsStr(fk.refColumns)}`;
    if(fk.onUpdate) {
        sql += ` ON UPDATE ${fk.onUpdate}`;
    }
    if(fk.onDelete) {
        sql += ` ON DELETE ${fk.onDelete}`;
    }
    return sql;
}

function getCreateForeignKeys(foreignKeys) {
    return foreignKeys.map(fkDef)
}

function resolveDatabase(obj,dbName) {
    if(isObject(obj)) {
        const keys = Object.keys(obj);
        if(keys.length !== 1) throw new Error("Object notation must have exactly one key, got "+keys.join(', '));
        switch(keys[0]) {
            case '$app':
                const appId = obj[keys[0]];
                const [gsid] = dbNameMap.get(dbName);
                return napi.dbName(gsid,appId);
            default:
                throw new Error(`Unsupported key: ${keys[0]}`);
        }
    }
    return String(obj);
}

function getForeignKeyColumnsStr(columns) {
    return `(${columns.map(c => db.escapeId(c)).join(', ')})`;
}

function getIndexColumnsStr(columns) {
    return `(${columns.map(escapeIndex).join(', ')})`;
}

function escapeIndex(fullName) {
    const m = /^(\S+)\((\d+)\)$/.exec(fullName);
    if(m) {
        return `${db.escapeId(m[1])}(${m[2]})`;
    }
    return db.escapeId(fullName);
}

function getCreateOptions(options) {
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

function getAlterTableSql(dbName,tableName,currentStruct,desiredStruct) {
    const lines = [
        ...optionsDiff(currentStruct.options,desiredStruct.options),
        ...columnDiff(currentStruct.columns,desiredStruct.columns),
        ...indexDiff(currentStruct.indexes,desiredStruct.indexes),
        ...fkDiff(currentStruct.foreignKeys,desiredStruct.foreignKeys),
    ];
    if(lines.length) {
        return `ALTER TABLE ${db.escapeId(dbName)}.${db.escapeId(tableName)}\n${lines.map(l => `  ${l}`).join(',\n')};`;
    }
    return null;
}

function optionsDiff(before,after) {
    return getCreateOptions(objDiff(before,after));
}

/**
 * Returns values from `after` that are not the same as `before`
 * 
 * @param {object} before
 * @param {object} after
 * @returns {object}
 */
function objDiff(before,after) {
    const out = Object.create(null);
    for(const k of Object.keys(after)) {
        if(!eq(before[k],after[k])) {
            out[k] = after[k];
        }
    }
    return out;
}

function columnDiff(cols1,cols2) {
    return columnDiffToSql(getColumnDiff(cols1,cols2));
}

function indexDiff(before,after) {
    return indexDiffToSql(getIndexDiff(before,after));
}
function fkDiff(before,after) {
    return fkDiffToSql(getForeignKeyDiff(before,after));
}

function objEq(a,b) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    
    if(ka.length !== kb.length) {
        return false;
    }
    
    for(const k of ka) {
        if(!eq(a[k],b[k])) {
            return false;
        }
    }
    
    return true;
}

function arrEq(a,b) {
    if(a.length !== b.length) return false;
    for(let i=0; i<a.length; ++i) {
        if(!eq(a[i],b[i])) return false;
    }
    return true;
}

function eq(a,b) {
    if(Array.isArray(a) && Array.isArray(b)) {
        return arrEq(a,b);
    }
    if(isPlainObject(a) && isPlainObject(b)) {
        return objEq(a,b);
    }
    return Object.is(a,b);
}

function createMap(arr,key='name') {
    return new Map(arr.map(o => [o[key],o]));
}


function getForeignKeyDiff(before,after) {

    const currentForeignKeys = createMap(before);
    const desiredForeignKeys = createMap(after);

    let added = new Map;
    const dropped = [];
    const changed = []; // name *and* definition change
    const modified = []; // definition change only
    const renamed = []; // name change only; requires MySQL 5.7
    const oldNames = new Map;

    // dump(currentIndexes,desiredIndexes);

    for(let [fkName,fk] of desiredForeignKeys) {
        if(!currentForeignKeys.has(fkName)) {
            // dump('added',colName,currentIndexes.has(colName),desiredIndexes.has(colName));
            added.set(fkName,fk); // AFTER...?
            if(fk.oldName) {
                for(let oldName of toIter(fk.oldName)) {
                    oldNames.set(oldName, fk.name);
                }
            }
        } else {
            const currentFK = currentForeignKeys.get(fkName);
            fk = omit(fk,['oldName']);
            if(!objEq(fk,currentFK)) {
                modified.push(fk);
            }
            currentForeignKeys.delete(fkName);
        }
    }

    // dump(currentIndexes);
    for(let [fkName,curfk] of currentForeignKeys) {
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
            changed.push({...newDef,oldName: curfk.name});
            // }
            // dump('changedchangedchangedchangedchanged',changed);
        } else {
            dropped.push(fkName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());

    return {added,dropped,modified,changed,renamed}
}

function getIndexDiff(before,after) {

    const currentIndexes = createMap(before);
    const desiredIndexes = createMap(after);

    let added = new Map;
    const dropped = [];
    const changed = []; // name *and* definition change
    const modified = []; // definition change only
    const renamed = []; // name change only; requires MySQL 5.7
    const oldNames = new Map;

    // dump(currentIndexes,desiredIndexes);

    for(let [idxName,idx] of desiredIndexes) {
        if(!currentIndexes.has(idxName)) {
            // dump('added',colName,currentIndexes.has(colName),desiredIndexes.has(colName));
            added.set(idxName,idx); // AFTER...?
            if(idx.oldName) {
                for(let oldName of toIter(idx.oldName)) {
                    oldNames.set(oldName, idx.name);
                }
            }
        } else {
            const currentCol = currentIndexes.get(idxName);
            idx = omit(idx,['oldName']);
            if(!objEq(idx,currentCol)) {
                modified.push(idx);
            }
            currentIndexes.delete(idxName);
        }
    }

    // dump(currentIndexes);
    for(let [idxName,curIdx] of currentIndexes) {
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
            changed.push({...newDef,oldName: curIdx.name});
            // }
            // dump('changedchangedchangedchangedchanged',changed);
        } else {
            dropped.push(idxName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());

    return {added,dropped,modified,changed,renamed}
}

function getColumnDiff(before,after) {

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

    for(let [colName,col] of desiredColumns) {
        if(!currentColumns.has(colName)) {
            // dump('added',colName,currentColumns.has(colName),desiredColumns.has(colName));
            added.set(colName,col); // AFTER...?
            if(col.oldName) {
                for(let oldName of toIter(col.oldName)) {
                    oldNames.set(oldName, col.name);
                }
            }
        } else {
            const currentCol = currentColumns.get(colName);
            col = omit(col,['oldName']);
            if(!objEq(col,currentCol)) {
                // dump('modified',colName);
                if(objEq(omit(col,['default']),omit(currentCol,['default']))) {
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
    for(let [colName,curCol] of currentColumns) {
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
                changed.push({...newDef,oldName: curCol.name});
            // }
            // dump('changedchangedchangedchangedchanged',changed);
        } else {
            dropped.push(colName);
        }
        // if(added.has(colName))
        // removed.set(colName,col);
    }
    added = Array.from(added.values());
    
    return {added,dropped,modified,changed,renamed,altered}
}

function fkDiffToSql(diff) {
    // dump(diff);process.exit(1);
    const lines = [];
    for(let fk of diff.dropped) {
        lines.push(`DROP FOREIGN KEY ${db.escapeId(fk.name)}`) // I *think* this works fine for PRIMARY keys too!
    }
    for(let fk of diff.changed) {
        lines.push(`DROP FOREIGN KEY ${db.escapeId(fk.oldName)}`)
        lines.push(`ADD ${fkDef(fk)}`)
    }
    for(let fk of diff.modified) {
        lines.push(`DROP FOREIGN KEY ${db.escapeId(fk.name)}`)
        lines.push(`ADD ${fkDef(fk)}`)
    }
    for(let fk of diff.renamed) {
        lines.push(`RENAME FOREIGN KEY ${db.escapeId(fk.oldName)} TO ${db.escapeId(fk.newName)}`)
    }
    for(let fk of diff.added) {
        lines.push(`ADD ${fkDef(fk)}`)
    }
    return lines;
}

function indexDiffToSql(diff) {
    // dump(diff);process.exit(1);
    const lines = [];
    for(let idx of diff.dropped) {
        lines.push(`DROP INDEX ${db.escapeId(idx)}`) // I *think* this works fine for PRIMARY keys too!
    }
    for(let idx of diff.changed) {
        lines.push(`DROP INDEX ${db.escapeId(idx.oldName)}`)
        lines.push(`ADD ${indexDefinition(idx)}`)
    }
    for(let idx of diff.modified) {
        lines.push(`DROP INDEX ${db.escapeId(idx.name)}`)
        lines.push(`ADD ${indexDefinition(idx)}`)
    }
    for(let idx of diff.renamed) {
        lines.push(`RENAME INDEX ${db.escapeId(idx.oldName)} TO ${db.escapeId(idx.newName)}`)
    }
    for(let idx of diff.added) {
        lines.push(`ADD ${indexDefinition(idx)}`)
    }
    return lines;
}
function columnDiffToSql(diff) {
    const lines = [];
    for(let colName of diff.dropped) {
        lines.push(`DROP COLUMN ${db.escapeId(colName)}`)
    }
    for(let col of diff.modified) {
        lines.push(`MODIFY COLUMN ${db.escapeId(col.name)} ${columnDefinition(col)}`)
    }
    for(let col of diff.changed) {
        lines.push(`CHANGE COLUMN ${db.escapeId(col.oldName)} ${db.escapeId(col.name)} ${columnDefinition(col)}`)
    }
    for(let col of diff.renamed) { // MySQL 8.0+
        lines.push(`RENAME COLUMN ${db.escapeId(col.oldName)} TO ${db.escapeId(col.newName)}`)
    }
    for(let col of diff.altered) {
        lines.push(`ALTER COLUMN ${db.escapeId(col.name)} ${col.default === undefined ? "DROP DEFAULT" : `SET DEFAULT ${getDefault(col)}`}`)
    }
    for(let col of diff.added) {
        lines.push(`ADD COLUMN ${db.escapeId(col.name)} ${columnDefinition(col)}`)
    }
    return lines;
}

function getDefault(col) {
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

function columnDefinition(col) {
    let str = col.type + columnDefinition2(col);
    if(col.collation) {
        str += ` COLLATE ${col.collation}`;
    }
    if(!col.null) {
        str += ' NOT NULL';
    }
    if(col.default !== undefined) {
        str += ` DEFAULT ${getDefault(col)}`;
    }
    if(col.comment) {
        str += ` COMMENT ${db.escapeValue(col.comment)}`;
    }
    if(col.autoIncrement) {
        str += ` AUTO_INCREMENT`;
    }
    return str;
}

function columnDefinition2(col) {
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

