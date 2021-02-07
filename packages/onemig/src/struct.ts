import {ConnectionPool, sql} from "mysql3";
import {parallel, sortBy, splitValues} from "./util";
import {DbColumn, DbColumnType, DbFkMap, DbForeignKey, DbIndex, DbIndexMap, DbTable, DbTrigger} from "./dbtypes";


export const getDefaultStorageEngine = (conn:ConnectionPool) => conn.value<string>(sql`select @@default_storage_engine`)
export const getDatabaseCollation = (conn:ConnectionPool,dbName:string) => conn.value<string>(sql`SELECT DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=${dbName}`)


const TYPE_ALIASES = {
    'boolean': 'tinyint',
    'integer': 'int',
    'dec': 'decimal',
    'numeric': 'decimal',
    'fixed': 'decimal',
    'real': 'double',
    'double precision': 'double',
    'char byte': 'binary',
}

let defaultStorageEngine: string
let dbCollationMap: Record<string,string> = {}

export async function getColumns(conn: ConnectionPool, dbName: string, tblName:string): Promise<Record<string,Omit<DbColumn,'name'>>> {
    const struct = await getStruct(conn,dbName,tblName)
    if(!struct) throw new Error(`Could not get definition for table ${tblName}`)
    return Object.fromEntries(struct.columns.map(({name,...def}) => [name,def]))
}

export async function getStruct(conn: ConnectionPool, dbName: string, tblName:string) {
    const tbl = await conn.row<{name:string,engine:string,comment:string,collation:string}>(sql`SELECT 
        TABLE_NAME 'name'
        ,ENGINE 'engine'
        ,TABLE_COMMENT 'comment'
        ,TABLE_COLLATION 'collation'
        #,ROW_FORMAT 'rowFormat' -- requires OPEN_FULL_TABLE: https://dev.mysql.com/doc/refman/5.7/en/information-schema-optimization.html
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLES.TABLE_SCHEMA=${dbName} AND TABLE_NAME=${tblName}
        `)
    
    if(!tbl) {
        return null;
    }

    if(defaultStorageEngine == null) {
        defaultStorageEngine = (await getDefaultStorageEngine(conn))!
    }
    if(dbCollationMap[dbName] == null) {
        dbCollationMap[dbName] = (await getDatabaseCollation(conn,dbName))!
    }

    const tblDef: DbTable = {
        name: tbl.name,
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

    if(tbl.engine !== defaultStorageEngine) {
        tblDef.options.engine = tbl.engine;
    }
    if(tbl.comment.length) {
        tblDef.options.comment = tbl.comment;
    }
    if(tbl.collation !== dbCollationMap[dbName]) {
        tblDef.options.collation = tbl.collation;
    }


    // if(!(
    //     (tbl.engine === 'InnoDB' && tbl.rowFormat === 'Compact')
    //     || (tbl.engine === 'MyISAM' && tbl.rowFormat === 'Dynamic')
    // )) {
    //     tblDef.options.rowFormat = tbl.rowFormat;
    // }

    await parallel(
        async function fetchColumns() {
            // https://mariadb.com/kb/en/information-schema-columns-table/
            const colStream = conn.stream<{
                name: string,
                default: string,
                isNullable: string,
                collation: string,
                dataType: string,
                columnType: string,
                comment: string,
                extra: string,
                generationExpression: string,
            }>(sql`
                            select 
                                COLUMN_NAME 'name'
                                ,COLUMN_DEFAULT 'default'
                                ,IS_NULLABLE 'isNullable'
                                ,COLLATION_NAME 'collation'
                                ,DATA_TYPE 'dataType'
                                ,COLUMN_TYPE 'columnType'
                                ,COLUMN_COMMENT 'comment'
                                ,EXTRA 'extra'
                                ,GENERATION_EXPRESSION 'generationExpression'
                                #,IS_GENERATED 'isGenerated'
                                #,NUMERIC_PRECISION 'numericPrecision'
                            from information_schema.columns 
                            where table_schema=${dbName} and table_name=${tblName} 
                            order by ORDINAL_POSITION`);

            for await(const col of colStream) {
                let colDef: DbColumn = {
                    name: col.name,
                    type: col.columnType,
                };

                if(col.comment.length) {
                    colDef.comment = col.comment;
                }

                if(col.default !== null && !(col.isNullable && col.default === 'NULL')) {
                    colDef.default = col.default;
                }

                if(col.collation !== null && col.collation !== tbl.collation) {
                    colDef.collation = col.collation;
                }

                if(col.extra) {
                    if (col.extra === 'auto_increment') {
                        colDef.autoIncrement = true;
                    } else if(col.extra.startsWith('on update ')) {
                        colDef.onUpdate = col.extra.slice(10)
                    } else if(col.extra.endsWith(' GENERATED')) {
                        colDef.generated = col.extra.slice(0,-10)
                    } else if(col.extra === 'INVISIBLE') {
                        colDef.invisible = true
                    } else {
                        console.log('EXTRA',tbl.name,col)
                    }
                }

                if(col.generationExpression !== null) {
                    colDef.genExpr = col.generationExpression
                }


                tblDef.columns.push(colDef);

                // https://stackoverflow.com/a/5256505/65387
                // zerofill implies unsigned


                switch(col.dataType) {
                    case 'enum':
                    case 'set': {
                        let [match, type, values] = /^(\w+)\((.*)\)$/.exec(col.columnType)!;
                        if(!match) {
                            throw new Error(`Unexpected ${col.dataType} format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type as DbColumnType;
                        colDef.values = splitValues(values);
                    }
                        break;
                    case 'tinyint':
                    case 'smallint':
                    case 'mediumint':
                    case 'int':
                    case 'bigint': {
                        let [match, type, width, unsigned, zerofill] = /^(\w+)\((\d+)\)( unsigned)?( zerofill)?$/.exec(col.columnType)!;
                        if(!match) {
                            throw new Error(`Unexpected integer format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type as DbColumnType;
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
                        let [match, type, m, d, unsigned, zerofill] = /^(\w+)(?:\((\d+)(?:,(\d+))?\))?( unsigned)?( zerofill)?$/.exec(col.columnType)!;
                        if(!match) {
                            throw new Error(`Unexpected float format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type as DbColumnType;
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
                        let [match, type, length] = /^(\w+)\((\d+)\)$/.exec(col.columnType)!;
                        if(!match) {
                            throw new Error(`Unexpected string format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        let len = parseInt(length, 10);
                        colDef.type = type as DbColumnType
                        if(type === 'bit' && len === 1) {
                            //
                        } else {
                            colDef.length = len;
                        }
                    }
                        break;
                    case 'year':
                        let [match, type, width] = /^(\w+)\((\d+)\)$/.exec(col.columnType)!;
                        if(!match) {
                            throw new Error(`Unexpected year format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type as DbColumnType
                        if(width !== '4') {
                            // YEAR(2) was removed in MySQL 8, but I can't even get it to work in MySQL 5.6
                            colDef.width = parseInt(width, 10);
                        }
                        break;
                    case 'datetime':
                    case 'timestamp': {
                        const [match, type, fracStr] = /^(\w+)(?:\((\d+)\))?$/.exec(col.columnType)!;
                        if(!match) {
                            throw new Error(`Unexpected ${col.dataType} format: ${col.columnType}`);
                        }
                        if(type !== col.dataType) {
                            throw new Error(`Data type (${col.dataType}) does not match column type (${type})`);
                        }
                        colDef.type = type as DbColumnType
                        if(fracStr) {
                            const digits = Number(fracStr)
                            if(digits) {
                                colDef.fracDigits = digits;
                            }
                        }
                    } break;
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
                    } break;
                }

                if(col.isNullable === 'YES') {
                    colDef.nullable = true;
                }
            }
        },
        async function fetchIndexes() {
            const idxStream = conn.stream<{
                name: string,
                type: string,
                comment: string,
                nonUnique: string,
                columnName: string,
                subPart: string,
            }>(sql`SELECT 
                                    INDEX_NAME 'name'
                                    ,INDEX_TYPE 'type'
                                    ,INDEX_COMMENT 'comment'
                                    ,NON_UNIQUE 'nonUnique'
                                    ,COLUMN_NAME 'columnName'
                                    ,SUB_PART 'subPart' 
                                FROM INFORMATION_SCHEMA.STATISTICS 
                                WHERE TABLE_SCHEMA=${dbName} AND TABLE_NAME=${tblName} 
                                ORDER BY INDEX_NAME, SEQ_IN_INDEX`);
            const idxMap: DbIndexMap = {};

            for await(const idx of idxStream) {
                let colName = idx.columnName;
                if(idx.subPart !== null) {
                    colName += `(${idx.subPart})`;
                }

                if(!idxMap.hasOwnProperty(idx.name)) {
                    let idxDef: Partial<DbIndex> = (idxMap[idx.name] as any) = {
                        name: idx.name,
                    };

                    if(idx.name === 'PRIMARY') {
                        idxDef.type = 'PRIMARY';
                    } else if(idx.type !== 'BTREE') {
                        idxDef.type = idx.type;
                    } else if(!idx.nonUnique) {
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
            const fkStream = conn.stream<{
                constraintName: string,
                columnName: string,
                refDatabase: string,
                refTable: string,
                refColumnName: string,
                onDelete: string,
                onUpdate: string,
            }>(sql`
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
                                    ON rc.CONSTRAINT_SCHEMA = ${dbName}
                                      AND rc.TABLE_NAME = ${tblName}
                                      AND rc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                                  JOIN information_schema.KEY_COLUMN_USAGE kcu
                                    ON kcu.TABLE_SCHEMA = ${dbName}
                                      AND kcu.TABLE_NAME = ${tblName}
                                      AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                                WHERE tc.TABLE_SCHEMA = ${dbName}
                                    AND tc.TABLE_NAME = ${tblName}
                                    AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
                                ORDER BY kcu.ORDINAL_POSITION;
                            `);

            const fkMap: DbFkMap = {};

            for await(const fk of fkStream) {
                // console.log(fk)
                if(!fkMap.hasOwnProperty(fk.constraintName)) {
                    let fkDef: DbForeignKey = fkMap[fk.constraintName] = {
                        name: fk.constraintName,
                        columns: [fk.columnName],
                        // refDatabase: fk.refDatabase,
                        refTable: fk.refTable,
                        refColumns: [fk.refColumnName],
                        onDelete: fk.onDelete,
                        onUpdate: fk.onUpdate,
                    }
                    if(fk.refDatabase !== dbName) {
                        fkDef.refDatabase = fk.refDatabase;
                    }
                } else {
                    fkMap[fk.constraintName].columns.push(fk.columnName);
                    fkMap[fk.constraintName].refColumns.push(fk.refColumnName);
                }
            }

            tblDef.foreignKeys = sortBy<DbForeignKey>(Object.values(fkMap), 'name');
        },
        async function fetchTriggers() {
            // dump('fetchin triggersss');
            const triggerStream = conn.stream<{
                name: string,
                timing: string,
                event: string,
                statement: string,
            }>(sql`
                                SELECT
                                    #TRIGGER_SCHEMA database,
                                    TRIGGER_NAME name
                                    ,ACTION_TIMING timing
                                    ,EVENT_MANIPULATION event
                                    ,ACTION_STATEMENT statement
                                    #,DEFINER definer
                                    #,SQL_MODE sqlMode
                                FROM
                                    information_schema.TRIGGERS
                                WHERE
                                    EVENT_OBJECT_SCHEMA = ${dbName} 
                                    AND EVENT_OBJECT_TABLE = ${tblName}
                                ORDER BY EVENT_MANIPULATION,ACTION_TIMING,ACTION_ORDER,TRIGGER_NAME
                            `);


            tblDef.triggers = [];


            for await(const trigger of triggerStream) {
                tblDef.triggers.push(trigger as DbTrigger)
            }
        }
    )


    return tblDef;
}

function sortIndexes(array:DbIndex[]) {
    return array.sort((a, b) => {
        if(a.name === 'PRIMARY') return -1;
        if(b.name === 'PRIMARY') return 1;
        return a.name.localeCompare(b.name);
    });
}

