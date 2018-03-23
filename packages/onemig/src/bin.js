import conn from './db';
import dump from './dump';
import * as async from './util/async';
import * as fs from './util/fs';
import objHash from 'object-hash';

async function __main__() {
    
    let serverVars = await conn.query('show variables').fetchPairs();
    // dump(serverVars);
    // dump(serverVars.innodb_default_row_format);
    

    let databases = await conn.query(`
        SELECT SCHEMA_NAME \`name\`, DEFAULT_CHARACTER_SET_NAME \`defaultCharset\`, DEFAULT_COLLATION_NAME \`defaultCollation\` 
        FROM information_schema.SCHEMATA 
        WHERE (SCHEMA_NAME LIKE 'wx_%' OR SCHEMA_NAME LIKE 'webenginex_%' OR SCHEMA_NAME LIKE 'fbs2_%')
            AND SCHEMA_NAME NOT LIKE '%_old' AND SCHEMA_NAME NOT IN ('wx_zlnxbcaana01_stats','wx_documentation')
        `).fetchAll();

    let allTables = Object.create(null);
    
    await async.forEach(databases, async db => {
        let tables = await conn.query("SHOW TABLE STATUS IN ?? WHERE ENGINE IS NOT NULL", [db.name]).fetchAll();
        // dump(tables);

        await async.forEach(tables, async tbl => {
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
                indexes: {},
                foreignKeys: {},
            };
            
            // if(tbl.Auto_increment !== null) {
            //     tblDef.options.autoIncrement = tbl.Auto_increment;
            // }
            if(tbl.Engine !== serverVars.default_storage_engine) {
                tblDef.options.engine = tbl.Engine;
            }
            if(tbl.Comment.length) {
                tblDef.options.comment = tbl.Comment;
            }
            if(tbl.Collation !== db.defaultCollation) {
                tblDef.options.collation = tbl.Collation;
            }
            if(!(
                (tbl.Engine === 'InnoDB' && tbl.Row_format === 'Compact')
                || (tbl.Engine === 'MyISAM' && tbl.Row_format === 'Dynamic')
            )) {
                tblDef.options.rowFormat = tbl.Row_format;
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
                    let indexes = await conn.query("SELECT INDEX_NAME,INDEX_TYPE,INDEX_COMMENT,NON_UNIQUE,COLUMN_NAME,SUB_PART FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY INDEX_NAME, SEQ_IN_INDEX", [db.name, tbl.Name]).fetchAll();
                    for(let idx of indexes) {
                        
                        let colName = idx.COLUMN_NAME;
                        if(idx.SUB_PART !== null) {
                            colName += `(${idx.SUB_PART})`;
                        }
                        
                        if(!tblDef.indexes.hasOwnProperty(idx.INDEX_NAME)) {
                            // FIXME: "USING HASH" cannot be detected; https://stackoverflow.com/q/49440609/65387
                            let idxDef = tblDef.indexes[idx.INDEX_NAME] = {};
                            if(idx.INDEX_TYPE !== 'BTREE') {
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
                            tblDef.indexes[idx.INDEX_NAME].columns.push(colName)
                        }
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
                    `, {dbname: db.name, tblname: tbl.Name}).fetchAll();

                    for(let fk of foreignKeys) {
                        // dump(fk);
                        if(!tblDef.foreignKeys.hasOwnProperty(fk.constraint_name)) {
                            let fkDef = tblDef.foreignKeys[fk.constraint_name] = {
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
                            tblDef.foreignKeys[fk.constraint_name].columnNames.push(fk.column_name);
                            tblDef.foreignKeys[fk.constraint_name].refColumnNames.push(fk.ref_column_name);
                        }
                    }

                },
            );
            
            
            let tblHash = objHash(tblDef);
            if(!allTables[tbl.Name]) {
                allTables[tbl.Name] = {};
            }
            if(!allTables[tbl.Name][tblHash]) {
                allTables[tbl.Name][tblHash] = {
                    databases: [db.name],
                    ...tblDef,
                }
            } else {
                allTables[tbl.Name][tblHash].databases.push(db.name);
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


/*

show create table _fulltexttest;
show indexes from _fulltexttest in webenginex_cbip;

SELECT *
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'webenginex_cbip' and TABLE_NAME='_fulltexttest';
 */