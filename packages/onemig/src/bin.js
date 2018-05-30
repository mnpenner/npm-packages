import conn from './db';
import dump from './dump';
import * as async from './util/async';
import * as fs from './util/fs';
import objHash from 'object-hash';
import {startTimer, stopTimer} from './util/hrtime';
import {parseFrm} from './mysql/parseData';


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve,ms));
}

// this is bugged!!! https://github.com/babel/babel/issues/4969
// async function __main__2() {
//    
//     let results = conn.stream("SELECT TABLE_NAME,ENGINE,TABLE_COMMENT,TABLE_COLLATION,ROW_FORMAT,AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLES.TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'", ['wx_ncdcs_cs']);
//    
//     for await(let row of results) {
//         dump(row);
//     }
// }

async function __main__() {
    
    dump(await parseFrm(`${__dirname}/../data/emr_client.frm`));
    return;
    
    let serverVars = await conn.query('show variables').fetchPairs();
    // dump(serverVars.innodb_stats_on_metadata);
    // dump(serverVars.innodb_default_row_format);
    // process.exit();
    
    // let t = startTimer();

    // await async.forEachLimit([1,2,3,6,5,4], 3, async x => {
    //     console.log(x,stopTimer(t));
    //     await sleep(x*100);
    // });
    // console.log('done',stopTimer(t));
    // conn.stream("SELECT TABLE_NAME,ENGINE,TABLE_COMMENT,TABLE_COLLATION,ROW_FORMAT,AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLES.TABLE_SCHEMA='wx_ncdcs_cs' AND TABLE_TYPE='BASE TABLE'")
    //     .on('result', row => {
    //         dump(row);
    //     });
    //
    // process.exit();
    

    let databases = await conn.query(`
        SELECT SCHEMA_NAME \`name\`, DEFAULT_CHARACTER_SET_NAME \`defaultCharset\`, DEFAULT_COLLATION_NAME \`defaultCollation\` 
        FROM information_schema.SCHEMATA 
        WHERE (SCHEMA_NAME LIKE 'wx_%' OR SCHEMA_NAME LIKE 'webenginex_%' OR SCHEMA_NAME LIKE 'fbs2_%')
            AND SCHEMA_NAME NOT LIKE '%_old' AND SCHEMA_NAME NOT IN ('wx_zlnxbcaana01_stats','wx_documentation')
        -- LIMIT 10
        `).fetchAll();

    let allTables = Object.create(null);
    
    await async.forEachLimit(databases, 5, async db => {
        console.log(`fetching tables for ${db.name}`);
      
        
        // FIXME: might be quicker if we avoid AUTO_INCREMENT and ROW_FORMAT https://dev.mysql.com/doc/refman/5.7/en/information-schema-optimization.html (tested: might be a bit faster, but still takes like 4 seconds) and conn.stream (or maybe not, the query takes forever but it isn't a lot of data)
        let t = startTimer();
        let tables = await conn.query("SELECT TABLE_NAME,ENGINE,TABLE_COMMENT,TABLE_COLLATION,ROW_FORMAT,AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLES.TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'", [db.name]).fetchAll();
        dump(db.name,stopTimer(t));
        // dump(tables);

        await async.forEachLimit(tables, 5, async tbl => {
            console.log(`inspecting ${db.name}.${tbl.TABLE_NAME}`);
            let tblDef = {
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
                // indexes: [],
                // foreignKeys: [],
            };
            
            // if(tbl.Auto_increment !== null) {
            //     tblDef.options.autoIncrement = tbl.Auto_increment;
            // }
            if(tbl.ENGINE !== serverVars.default_storage_engine) {
                tblDef.options.engine = tbl.ENGINE;
            }
            if(tbl.TABLE_COMMENT.length) {
                tblDef.options.comment = tbl.TABLE_COMMENT;
            }
            if(tbl.TABLE_COLLATION !== db.defaultCollation) {
                tblDef.options.collation = tbl.TABLE_COLLATION;
            }
            if(!(
                (tbl.ENGINE === 'InnoDB' && tbl.ROW_FORMAT === 'Compact')
                || (tbl.ENGINE === 'MyISAM' && tbl.ROW_FORMAT === 'Dynamic')
            )) {
                tblDef.options.rowFormat = tbl.ROW_FORMAT;
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
                        order by ORDINAL_POSITION`, [db.name, tbl.TABLE_NAME]).fetchAll();
                    
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

                        if(col.COLLATION_NAME !== null && col.COLLATION_NAME !== tbl.TABLE_COLLATION) {
                            colDef.collation = col.COLLATION_NAME;
                        }
                        
                        
                        tblDef.columns.push(colDef);
                        

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
                },

                async () => {
                    let indexes = await conn.query("SELECT INDEX_NAME,INDEX_TYPE,INDEX_COMMENT,NON_UNIQUE,COLUMN_NAME,SUB_PART FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY INDEX_NAME, SEQ_IN_INDEX", [db.name, tbl.TABLE_NAME]).fetchAll();
                    
                    if(indexes.length) {
                        let idxMap = {};

                        for(let idx of indexes) {

                            let colName = idx.COLUMN_NAME;
                            if(idx.SUB_PART !== null) {
                                colName += `(${idx.SUB_PART})`;
                            }

                            if(!idxMap.hasOwnProperty(idx.INDEX_NAME)) {
                                // FIXME: "USING HASH" cannot be detected; https://stackoverflow.com/q/49440609/65387
                                let idxDef = idxMap[idx.INDEX_NAME] = {
                                    name: idx.INDEX_NAME,
                                };

                                if(idx.INDEX_NAME === 'PRIMARY') {
                                    idxDef.type = 'PRIMARY';
                                } else if(idx.INDEX_TYPE !== 'BTREE') {
                                    idxDef.type = idx.INDEX_TYPE;
                                } else if(idx.NON_UNIQUE === 0) {
                                    idxDef.type = 'UNIQUE';
                                } else {
                                    idxDef.type = 'INDEX';
                                }
                                idxDef.columns = [colName];

                                // if(idx.Index_type !== 'BTREE') {
                                //     idxDef.type = idx.Index_type; 
                                // }
                                if(idx.INDEX_COMMENT.length) {
                                    idxDef.comment = idx.INDEX_COMMENT;
                                }
                            } else {
                                idxMap[idx.INDEX_NAME].columns.push(colName)
                            }
                        }

                        tblDef.indexes = sortBy(Object.values(idxMap),'name');
                    }
                },

                async () => {
                    let foreignKeys = await conn.query(`
                        SELECT
                          tc.CONSTRAINT_NAME \`constraint_name\`,
                          kcu.COLUMN_NAME \`column_name\`,
                          kcu.REFERENCED_TABLE_SCHEMA \`ref_table_schema\`,
                          kcu.REFERENCED_TABLE_NAME \`ref_table_name\`,
                          kcu.REFERENCED_COLUMN_NAME \`ref_column_name\`,
                          rc.DELETE_RULE \`delete_rule\`,
                          rc.UPDATE_RULE \`update_rule\`
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
                    `, {dbname: db.name, tblname: tbl.TABLE_NAME}).fetchAll();

                    
                    if(foreignKeys.length) {
                        let fkMap = {};

                        for(let fk of foreignKeys) {
                            // dump(fk);
                            if(!fkMap.hasOwnProperty(fk.constraint_name)) {
                                let fkDef = fkMap[fk.constraint_name] = {
                                    name: fk.constraint_name,
                                    columnNames: [fk.column_name],
                                    // refTableSchema: fk.ref_table_schema,
                                    refTableName: fk.ref_table_name,
                                    refColumnNames: [fk.ref_column_name],
                                    deleteRule: fk.delete_rule,
                                    updateRule: fk.update_rule,
                                }
                                if(fk.ref_table_schema !== db.name) {
                                    // FIXME: we need to generalize this for {{pcs}}
                                    fkDef.refTableSchema = fk.ref_table_schema;
                                }
                            } else {
                                fkMap[fk.constraint_name].columnNames.push(fk.column_name);
                                fkMap[fk.constraint_name].refColumnNames.push(fk.ref_column_name);
                            }
                        }

                        tblDef.foreignKeys = sortBy(Object.values(fkMap),'name');
                    }
                },
            );
            
            
            let tblHash = objHash(tblDef);
            if(!allTables[tbl.TABLE_NAME]) {
                allTables[tbl.TABLE_NAME] = {};
            }
            if(!allTables[tbl.TABLE_NAME][tblHash]) {
                allTables[tbl.TABLE_NAME][tblHash] = {
                    databases: [db.name],
                    ...tblDef,
                }
            } else {
                allTables[tbl.TABLE_NAME][tblHash].databases.push(db.name);
            }
        });
    });
    
    
    await async.forEach(Object.keys(allTables), async tblName => {
        let json = {
            name: tblName,
            versions: Object.values(allTables[tblName]),
        };
        await fs.writeText(`out/tables/${tblName}.json`,JSON.stringify(json,null,4));
    });
    

    // dump(Object.keys(allTables));
    // fs.writeText('out/schema.json',JSON.stringify(out,null,4));
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

function sortBy(array, prop) {
    return array.sort((a,b) => {
        if(a[prop] === 'PRIMARY') return -1;
        if(b[prop] === 'PRIMARY') return 1;
        return a[prop].localeCompare(b[prop]);
    });
}



/*

show create table _fulltexttest;
show indexes from _fulltexttest in webenginex_cbip;

SELECT *
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'webenginex_cbip' and TABLE_NAME='_fulltexttest';
 */