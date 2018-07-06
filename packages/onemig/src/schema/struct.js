// import Chalk from 'chalk';
// import dump from '../dump';
import * as async from '../util/async';
// import objHash from 'object-hash';
import {dbNameMap} from '../napi';
// import conn from '../db';
// import {memoized} from '../util/func';


export const getDefaultStorageEngine = conn => conn.query('select @@default_storage_engine').fetchValue();

export const getDatabaseCollation = (conn,dbName) => conn.query('SELECT DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[dbName]).fetchValue();

export async function getStruct(conn, dbName, tblName) {
    
    const [defaultStorageEngine,dbCollation,tbl] = await Promise.all([
        getDefaultStorageEngine(conn),
        getDatabaseCollation(conn,dbName),
        conn.query(`SELECT 
                        TABLE_NAME 'name'
                        ,ENGINE 'engine'
                        ,TABLE_COMMENT 'comment'
                        ,TABLE_COLLATION 'collation'
                        #,ROW_FORMAT 'rowFormat' -- requires OPEN_FULL_TABLE: https://dev.mysql.com/doc/refman/5.7/en/information-schema-optimization.html
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLES.TABLE_SCHEMA=? AND TABLE_NAME=?
                        `, [dbName,tblName]).fetchRow()
    ]);
    
    if(!tbl) {
        return null;
    }
    
    const tblDef = {
        // name: table.Name,
        options: {
            // engine: tbl.Engine,
            // autoIncrement: tbl.Auto_increment,
            // comment: tbl.Comment,
            // charset: table.Collation !== null ? table.Collation.match(/^[^_]+/)[0] : null,
            // collation: tbl.Collation,
            // rowFormat: tbl.Row_format,
        },
        // stats: {
        //     version: tbl.Version,
        //     rows: tbl.Rows,
        //     avgRowLength: tbl.Avg_row_length,
        //     dataLength: tbl.Data_length,
        //     maxDataLength: tbl.Max_data_length,
        //     dataFree: tbl.Data_free,
        //     createTime: tbl.Create_time,
        //     updateTime: tbl.Update_time,
        //     checkTime: tbl.Check_time,
        // },
        columns: [],
        indexes: [],
        foreignKeys: [],
    };

    // if(tbl.engine !== defaultStorageEngine) {
        tblDef.options.engine = tbl.engine;
    // }
    if(tbl.comment.length) {
        tblDef.options.comment = tbl.comment;
    }
    // if(tbl.collation !== dbCollation) {
        tblDef.options.collation = tbl.collation;
    // }
    // if(!(
    //     (tbl.engine === 'InnoDB' && tbl.rowFormat === 'Compact')
    //     || (tbl.engine === 'MyISAM' && tbl.rowFormat === 'Dynamic')
    // )) {
    //     tblDef.options.rowFormat = tbl.rowFormat;
    // }

    await async.parallel(
        async function fetchColumns() {
            const colStream = conn.stream(`
                            select 
                                COLUMN_NAME 'name'
                                ,COLUMN_DEFAULT 'default'
                                ,IS_NULLABLE 'isNullable'
                                ,COLLATION_NAME 'collation'
                                ,DATA_TYPE 'dataType'
                                ,COLUMN_TYPE 'columnType'
                                ,COLUMN_COMMENT 'comment'
                                ,EXTRA 'extra'
                                #,NUMERIC_PRECISION 'numericPrecision'
                            from information_schema.columns 
                            where table_schema=? and table_name=? 
                            order by ORDINAL_POSITION`, [dbName, tblName]);

            for await(const col of colStream) {

                let colDef = {
                    name: col.name,
                    type: col.columnType,
                };

                if(col.comment.length) {
                    colDef.comment = col.comment;
                }

                if(col.default !== null) {
                    colDef.default = col.default;
                }

                if(col.collation !== null && col.collation !== tbl.collation) {
                    colDef.collation = col.collation;
                }
                
                if(col.extra === 'auto_increment') { 
                    // TODO: what else can go in here??
                    // https://dev.mysql.com/doc/refman/8.0/en/columns-table.html
                    // "The EXTRA column contains VIRTUAL GENERATED or VIRTUAL STORED for generated columns"
                    colDef.autoIncrement = true;
                }


                tblDef.columns.push(colDef);

                // https://stackoverflow.com/a/5256505/65387
                // zerofill implies unsigned


                switch(col.dataType) {
                    case 'enum':
                    case 'set': {
                        let [match, type, values] = /^(\w+)\((.*)\)$/.exec(col.columnType);
                        if(!match) {
                            throw new Error(`Unexpected ${col.dataType} format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type;
                        colDef.values = splitValues(values);
                    }
                        break;
                    case 'tinyint':
                    case 'smallint':
                    case 'mediumint':
                    case 'int':
                    case 'bigint': {
                        let [match, type, width, unsigned, zerofill] = /^(\w+)\((\d+)\)( unsigned)?( zerofill)?$/.exec(col.columnType);
                        if(!match) {
                            throw new Error(`Unexpected integer format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type;
                        // width = parseInt(width,10);
                        // const utype = (unsigned !== undefined ? 'u' : '')+type;
                        // if(width !== defaultWidths[utype]) {
                        //     colDef.width = width;
                        // }
                        if(zerofill !== undefined) {
                            colDef.zerofill = parseInt(width, 10);
                        } else if(unsigned !== undefined) {
                            colDef.unsigned = true;
                        }
                        if(col.default != null) {
                            const defaultValue = parseInt(col.default, 10);
                            if(Number.isSafeInteger(defaultValue)) {
                                colDef.default = defaultValue;
                            }
                        }
                    }
                        break;
                    case 'float':
                    case 'decimal':
                    case 'double': {
                        // http://www.java2s.com/Tutorial/MySQL/0200__Data-Types/FLOATMDUNSIGNEDZEROFILL.htm
                        let [match, type, m, d, unsigned, zerofill] = /^(\w+)(?:\((\d+)(?:,(\d+))?\))?( unsigned)?( zerofill)?$/.exec(col.columnType);
                        if(!match) {
                            throw new Error(`Unexpected float format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type;
                        // m = m === undefined ? null : parseInt(m,10);
                        // d = d === undefined ? null : parseInt(d,10);
                        if(m !== undefined) {
                            if(d === undefined) {
                                throw new Error(`${type}(p) syntax is allowed during creation but was unexpected in information schema`)
                            }
                            colDef.precision = [parseInt(m, 10), parseInt(d, 10)];
                        }
                        if(zerofill !== undefined) {
                            colDef.zerofill = true;
                            if(unsigned === undefined) {
                                throw new Error("numbers cannot be signed zerofill");
                            }
                        } else if(unsigned !== undefined) {
                            colDef.unsigned = true;
                        }
                    }
                        break;
                    case 'char':
                    case 'varchar':
                    case 'bit':
                    case 'binary':
                    case 'varbinary': {
                        let [match, type, length] = /^(\w+)\((\d+)\)$/.exec(col.columnType);
                        if(!match) {
                            throw new Error(`Unexpected string format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        length = parseInt(length, 10);
                        colDef.type = type;
                        if(type === 'bit' && length === 1) {
                            //
                        } else {
                            colDef.length = parseInt(length, 10);
                        }
                    }
                        break;
                    case 'year':
                        let [match, type, width] = /^(\w+)\((\d+)\)$/.exec(col.columnType);
                        if(!match) {
                            throw new Error(`Unexpected year format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type;
                        if(width !== '4') {
                            // YEAR(2) was removed in MySQL 8, but I can't even get it to work in MySQL 5.6
                            colDef.width = parseInt(width, 10);
                        }
                        break;
                    case 'tinytext':
                    case 'text':
                    case 'mediumtext':
                    case 'longtext':
                    case 'tinyblob':
                    case 'blob':
                    case 'mediumblob':
                    case 'longblob':
                    default: {
                        if(col.dataType !== col.columnType) {
                            throw new Error(`${dbName}.${tblName}.${col.name}: "${col.dataType}" ≠ "${col.columnType}"`);
                        }
                    }
                        break;
                }

                if(col.isNullable === 'YES') {
                    colDef.null = true;
                }
            }
        },
        async function fetchIndexes() {
            const idxStream = conn.stream(`SELECT 
                                    INDEX_NAME 'name'
                                    ,INDEX_TYPE 'type'
                                    ,INDEX_COMMENT 'comment'
                                    ,NON_UNIQUE 'nonUnique'
                                    ,COLUMN_NAME 'columnName'
                                    ,SUB_PART 'subPart' 
                                FROM INFORMATION_SCHEMA.STATISTICS 
                                WHERE TABLE_SCHEMA=? AND TABLE_NAME=? 
                                ORDER BY INDEX_NAME, SEQ_IN_INDEX`, [dbName, tblName]);
            const idxMap = {};

            for await(const idx of idxStream) {
                let colName = idx.columnName;
                if(idx.subPart !== null) {
                    colName += `(${idx.subPart})`;
                }

                if(!idxMap.hasOwnProperty(idx.name)) {
                    let idxDef = idxMap[idx.name] = {
                        name: idx.name,
                    };

                    if(idx.name === 'PRIMARY') {
                        idxDef.type = 'PRIMARY';
                    } else if(idx.type !== 'BTREE') {
                        idxDef.type = idx.type;
                    } else if(idx.nonUnique === 0) {
                        idxDef.type = 'UNIQUE';
                    } else {
                        idxDef.type = 'INDEX';
                    }
                    idxDef.columns = [colName];

                    // if(idx.Index_type !== 'BTREE') {
                    //     idxDef.type = idx.Index_type; 
                    // }
                    if(idx.comment.length) {
                        idxDef.comment = idx.comment;
                    }
                } else {
                    idxMap[idx.name].columns.push(colName);
                }
            }

            // if(!idxMap.PRIMARY) {
            //     process.stderr.write(`${dbName}.${tblName} does not have a PRIMARY key\n`);
            // }

            tblDef.indexes = sortIndexes(Object.values(idxMap));
        },
        async function fetchForeignKeys() {
            const fkStream = conn.stream(`
                                SELECT
                                  tc.CONSTRAINT_NAME 'constraintName',
                                  kcu.COLUMN_NAME 'columnName',
                                  kcu.REFERENCED_TABLE_SCHEMA 'refDatabase',
                                  kcu.REFERENCED_TABLE_NAME 'refTable',
                                  kcu.REFERENCED_COLUMN_NAME 'refColumnName',
                                  rc.DELETE_RULE 'onDelete',
                                  rc.UPDATE_RULE 'onUpdate'
                                FROM information_schema.TABLE_CONSTRAINTS tc
                                  JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
                                    ON rc.CONSTRAINT_SCHEMA = :dbname
                                      AND rc.TABLE_NAME = :tblname
                                      AND rc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                                  JOIN information_schema.KEY_COLUMN_USAGE kcu
                                    ON kcu.TABLE_SCHEMA = :dbname
                                      AND kcu.TABLE_NAME = :tblname
                                      AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                                WHERE tc.TABLE_SCHEMA = :dbname
                                    AND tc.TABLE_NAME = :tblname
                                    AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
                                ORDER BY kcu.ORDINAL_POSITION;
                            `, {dbname: dbName, tblname: tblName});

            const fkMap = {};

            for await(const fk of fkStream) {
                // dump(fk);
                if(!fkMap.hasOwnProperty(fk.constraintName)) {
                    let fkDef = fkMap[fk.constraintName] = {
                        name: fk.constraintName,
                        columns: [fk.columnName],
                        // refDatabase: fk.refDatabase,
                        refTable: fk.refTable,
                        refColumns: [fk.refColumnName],
                        onDelete: fk.onDelete,
                        onUpdate: fk.onUpdate,
                    }
                    if(fk.refDatabase !== dbName) {
                        const thisDb = dbNameMap.get(dbName);
                        const thatDb = dbNameMap.get(fk.refDatabase);
                        if(thisDb && thatDb && thisDb[0] === thatDb[0]) {
                            // if FK points to same GSID but different app, use special syntax
                            fkDef.refDatabase = {$app: thatDb[1]};
                        } else {
                            // process.stderr.write(`Foreign key ${dbName}.${tblName}.${fk.constraintName} on ${fk.columnName} points to another database ${fk.refDatabase}`);
                            fkDef.refDatabase = fk.refDatabase;
                        }
                    }
                } else {
                    fkMap[fk.constraintName].columns.push(fk.columnName);
                    fkMap[fk.constraintName].refColumns.push(fk.refColumnName);
                }
            }

            tblDef.foreignKeys = sortBy(Object.values(fkMap), 'name');
        }
    )


    return tblDef;

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

function sortIndexes(array) {
    return array.sort((a, b) => {
        if(a.name === 'PRIMARY') return -1;
        if(b.name === 'PRIMARY') return 1;
        return a.name.localeCompare(b.name);
    });
}

function sortBy(array, prop) {
    return array.sort((a, b) => a[prop].localeCompare(b[prop]));
}