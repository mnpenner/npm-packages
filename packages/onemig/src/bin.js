import conn from './db';
import dump from './dump';
import * as async from './util/async';
import * as fs from './util/fs';

async function __main__() {
    
    let serverVars = await conn.query('show variables').fetchPairs();
    // dump(serverVars);
    // dump(serverVars.innodb_default_row_format);
    
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
            options: {
                collation: db.defaultCollation,
            },
            tables: {},
         
        };
        
        let tables = await conn.query("SHOW TABLE STATUS IN ?? WHERE ENGINE IS NOT NULL", [db.name]).fetchAll();
        // dump(tables);

        await async.forEach(tables, async tbl => {
            let tableOut = out.databases[db.name].tables[tbl.Name] = {
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
                indexes: {},
                foreignKeys: {},
            };
            
            if(tbl.Auto_increment !== null) {
                tableOut.options.autoIncrement = tbl.Auto_increment;
            }
            if(tbl.Engine !== serverVars.default_storage_engine) {
                tableOut.options.engine = tbl.Engine;
            }
            if(tbl.Comment.length) {
                tableOut.options.comment = tbl.Comment;
            }
            if(tbl.Collation !== db.defaultCollation) {
                tableOut.options.collation = tbl.Collation;
            }
            if(!(
                (tbl.Engine === 'InnoDB' && tbl.Row_format === 'Compact')
                || (tbl.Engine === 'MyISAM' && tbl.Row_format === 'Dynamic')
            )) {
                tableOut.options.rowFormat = tbl.Row_format;
            }
            
            await async.parallel(
                async () => {
                    let columns = await conn.query(`
                        select 
                            COLUMN_NAME,
                            COLUMN_DEFAULT,
                            IS_NULLABLE,
                            COLLATION_NAME,
                            DATA_TYPE,
                            COLUMN_TYPE,
                            COLUMN_COMMENT
                        from information_schema.columns 
                        where table_schema=? and table_name=? 
                        order by ORDINAL_POSITION`, [db.name, tbl.Name]).fetchAll();
                    
                    for(let col of columns) {
                        
                        let colDef = {
                            name: col.COLUMN_NAME,
                            type: col.COLUMN_TYPE,
                            null: col.IS_NULLABLE === 'YES',
                        };

                        if(col.COLUMN_COMMENT.length) {
                            colDef.comment = col.COLUMN_COMMENT; 
                        }
                        
                        if(col.COLUMN_DEFAULT !== null) {
                            colDef.default = col.COLUMN_DEFAULT; 
                        }

                        if(col.COLLATION_NAME !== null && col.COLLATION_NAME !== tbl.Collation) {
                            colDef.collation = col.COLLATION_NAME;
                        }
                        
                        
                        out.databases[db.name].tables[tbl.Name].columns.push(colDef);
                        

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
                                colDef.type = type;
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
                                // colDef.length = parseInt(length);
                                // colDef.unsigned = unsigned !== undefined;
                                // colDef.zerofill = zerofill !== undefined;
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
                                // if(length !== undefined) {
                                //     colDef.length = parseInt(length);
                                // }
                                // if(decimals !== undefined) {
                                //     colDef.decimals = parseInt(decimals);
                                // }
                                // colDef.unsigned = unsigned !== undefined;
                                // colDef.zerofill = zerofill !== undefined;
                            } break;
                            
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
