throw new Error("do not import this file");
import MySql from 'mysql2/promise';
import formatSql from './mysql/formatSql';
// import {log} from './debug';
import napi from './napi';

const dbVars = napi.sharedDbVars('migrations');
import dump from './dump';
import DatabaseWrapper from './mysql/DatabaseWrapper';
// options listed here: node_modules/mysql2/lib/connection_config.js

// dump(dbVars.password);process.exit(0);


export default new DatabaseWrapper({
    host: dbVars.host,
    user: dbVars.login,
    // database: dbVars.name,
    password: dbVars.password,
    timezone: dbVars.timezone || 'America/Vancouver',
    queryFormat: formatSql,
    charset: 'utf8mb4_unicode_ci',
    connectionLimit: 25, // TODO: increase this for production
    typeCast: (field, next) => {
        if(field.type === 'BIT' && field.length === 1) {
            let buf = field.buffer();
            return buf[0] === 1;
        }
        return next();
    },
    foreignKeyChecks: false, // must be disabled because the tables might not be created in the correct order... and even if we could resolve a dependency tree, there's still the chance there are circular references.
    sqlMode: [
        'ONLY_FULL_GROUP_BY',
        'STRICT_TRANS_TABLES',
        'STRICT_ALL_TABLES',
        'NO_ZERO_IN_DATE',
        'NO_ZERO_DATE', // apparently this is used.... wx_cldsl_pcs.fw_doc_ver_date
        'ERROR_FOR_DIVISION_BY_ZERO',
        // 'NO_AUTO_CREATE_USER', // not allowed in MySQL 8
        'NO_ENGINE_SUBSTITUTION',
        'NO_UNSIGNED_SUBTRACTION',
        'PAD_CHAR_TO_FULL_LENGTH',
    ]
})