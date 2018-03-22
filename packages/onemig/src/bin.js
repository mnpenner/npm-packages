import conn from './db';
import dump from './dump';
import * as async from './util/async';
import * as fs from './util/fs';

async function __main__() {
    
    // let serverVars = await conn.query('show variables').fetchPairs();
    // dump(serverVars);
    
    let [
        version,
        timeOffset,
        timeZone,
        databases
    ] = await Promise.all([
        conn.query("SELECT VERSION()").fetchValue(),
        conn.query("SELECT TIMEDIFF(NOW(), UTC_TIMESTAMP)").fetchValue(),
        conn.query("SELECT IF(@@session.time_zone = 'SYSTEM', @@system_time_zone, @@session.time_zone)").fetchValue(),
        conn.query("SELECT SCHEMA_NAME `name`, DEFAULT_CHARACTER_SET_NAME `defaultCharset`, DEFAULT_COLLATION_NAME `defaultCollation` FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'wx_%' OR SCHEMA_NAME LIKE 'webenginex_%' limit 2").fetchAll()
    ]);
    
    let out = {
        time: new Date(),
        server: {
            timeOffset,
            timeZone,
            version,
        },
        databases: {},
    };
    
    await async.forEach(databases, async db => {
        out.databases[db.name] = {
            tables: {},
            meta: {
                defaultCharset: db.defaultCharset,
                defaultCollation: db.defaultCollation,
            },
        };
        
        let tables = await conn.query("SHOW TABLE STATUS IN ?? WHERE ENGINE IS NOT NULL", [db.name]).fetchAll();

        await async.forEach(tables, async tbl => {
            let tableOut = out.databases[db.name].tables[tbl.Name] = {
                // name: table.Name,
                options: {
                    engine: tbl.Engine,
                    autoIncrement: tbl.Auto_increment,
                    comment: tbl.Comment,
                    // charset: table.Collation !== null ? table.Collation.match(/^[^_]+/)[0] : null,
                    collation: tbl.Collation,
                    rowFormat: tbl.Row_format,
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
                columns: {},
                indexes: {},
                foreignKeys: {},
            };
            
            await async.parallel(
                async () => {
                    let columns = await conn.query(`
                        select 
                            COLUMN_NAME,
                            ORDINAL_POSITION,
                            COLUMN_DEFAULT,
                            IS_NULLABLE,
                            COLUMN_TYPE,
                            CHARACTER_SET_NAME,
                            COLLATION_NAME,
                            EXTRA,
                            COLUMN_COMMENT,
                            DATA_TYPE,
                            CHARACTER_MAXIMUM_LENGTH,
                            CHARACTER_OCTET_LENGTH,
                            NUMERIC_PRECISION,
                            NUMERIC_SCALE,
                            DATETIME_PRECISION
                        from information_schema.columns 
                        where table_schema=? and table_name=? 
                        order by ORDINAL_POSITION`, [db.name, tbl.Name]).fetchAll();
                    
                    for(let col of columns) {
                        let colDef = tableOut.columns[col.COLUMN_NAME] = {
                            dataType: col.DATA_TYPE,
                            isNullable: col.IS_NULLABLE === 'YES',
                            defaultValue: col.COLUMN_DEFAULT,
                            charMaxLength: col.CHARACTER_MAXIMUM_LENGTH,
                            charOctetLength: col.CHARACTER_OCTET_LENGTH,
                            numericPrecision: col.NUMERIC_PRECISION,
                            numericScale: col.NUMERIC_SCALE,
                            datetimePrecision: col.DATETIME_PRECISION, // FSP?
                            extra: col.EXTRA,
                            charset: col.CHARACTER_SET_NAME,
                            collation: col.COLLATION_NAME,
                            comment: col.COLUMN_COMMENT,
                            position: col.ORDINAL_POSITION,
                            values: [], // Permitted values for ENUM and SET
                            zerofill: null,
                            unsigned: null,
                            length: null,
                            decimals: null,
                        };
                        

                        switch(col.DATA_TYPE) {
                            case 'enum':
                            case 'set':
                                let [match,type,values] = /^(\w+)\((.*)\)$/.exec(col.COLUMN_TYPE);
                                if(!match) {
                                    throw new Error(`Unexpected ${col.DATA_TYPE} format: ${col.COLUMN_TYPE}`);
                                }
                                if(type !== col.DATA_TYPE) {
                                    throw new Error(`Data type (${col.DATA_TYPE}) does not match column type (${type})`);
                                }
                                colDef.values = splitValues(values);
                                break;
                            case 'tinyint':
                            case 'smallint':
                            case 'mediumint':
                            case 'int':
                            case 'bigint': {
                                let [match,type,length,unsigned,zerofill] = /^(\w+)\((\d+)\)( unsigned)?( zerofill)?$/.exec(col.COLUMN_TYPE);
                                if(!match) {
                                    throw new Error(`Unexpected integer format: ${col.COLUMN_TYPE}`);
                                }
                                if(type !== col.DATA_TYPE) {
                                    throw new Error(`Data type (${col.DATA_TYPE}) does not match column type (${type})`);
                                }
                                colDef.length = parseInt(length);
                                colDef.unsigned = unsigned !== undefined;
                                colDef.zerofill = zerofill !== undefined;
                            } break;
                            case 'float':
                            case 'decimal':
                            case 'double': {
                                let [match,type,length,decimals,unsigned,zerofill] = /^(\w+)(?:\((\d+)(?:,(\d+))?\))?( unsigned)?( zerofill)?$/.exec(col.COLUMN_TYPE);
                                if(!match) {
                                    throw new Error(`Unexpected float format: ${col.COLUMN_TYPE}`);
                                }
                                if(type !== col.DATA_TYPE) {
                                    throw new Error(`Data type (${col.DATA_TYPE}) does not match column type (${type})`);
                                }
                                if(length !== undefined) {
                                    colDef.length = parseInt(length);
                                }
                                if(decimals !== undefined) {
                                    colDef.decimals = parseInt(decimals);
                                }
                                colDef.unsigned = unsigned !== undefined;
                                colDef.zerofill = zerofill !== undefined;
                            } break;
                            case 'char':
                            case 'binary':
                            case 'varbinary':
                            case 'varchar': {
                                let [match, type, length] = /^(\w+)\((\d+)\)$/.exec(col.COLUMN_TYPE);
                                if(type !== col.DATA_TYPE) {
                                    throw new Error(`Something weird: ${type} ${col.DATA_TYPE}`);
                                }
                                if(!match) {
                                    throw new Error(`Unexpected char format: ${col.COLUMN_TYPE}`);
                                }
                                colDef.length = parseInt(length);
                            } break;
                            case 'longblob':
                            case 'longtext':
                            case 'mediumblob':
                            case 'mediumtext':
                            case 'text':
                            case 'blob':
                                // nothing interesting to record
                                break;
                            default: {
                                dump(col);
                                throw new Error(`Unhandled DATA_TYPE: ${col.DATA_TYPE}`);
                            }
                        }
                    }
                }
            )
        });
    });
    
    fs.writeText('schema.json',JSON.stringify(out,null,4));
    // dump('done!');
    // dump(timeOffset,timeZone,databases);
    
    // let timeOffset = await db.query("SELECT TIMEDIFF(NOW(), UTC_TIMESTAMP) offset").fetchValue();
    // let timeZone = await db.query("SELECT IF(@@session.time_zone = 'SYSTEM', @@system_time_zone, @@session.time_zone) timeZone").fetchValue();
    //
    // dump(timeOffset);
    // dump(timeZone);
    //
    // let databases = await db.query("SELECT SCHEMA_NAME `name`, DEFAULT_CHARACTER_SET_NAME `defaultCharset`, DEFAULT_COLLATION_NAME `defaultCollation` FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'wx_%' OR SCHEMA_NAME LIKE 'webenginex_%' limit 2").fetchAll();
    // dump(databases);
    
    
    
    
    //
    // await async.forEach(databases.slice(0,3), async dbName => {
    //     let tables = await db.query('SELECT SCHEMA_NAME `name`, DEFAULT_CHARACTER_SET_NAME `defaultCharset`, DEFAULT_COLLATION_NAME `defaultCollation` FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[dbName]).fetchAll();
    //     dump(dbName,tables);
    // });
    // dump('done');
    // dump(databases);
    
    await conn.close();
}

__main__().catch(async err => {
    dump(err);
    await conn.close();
});

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
            } else if(subject[i+1] === q) {
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
