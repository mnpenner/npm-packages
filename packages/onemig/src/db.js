import MySql from 'mysql2/promise';
import formatSql from './mysql/formatSql';
// import {log} from './debug';
import napi from './napi';

const dbVars = napi.sharedDbVars('migrations');
import dump from './dump';
import DatabaseWrapper from './mysql/DatabaseWrapper';
// options listed here: node_modules/mysql2/lib/connection_config.js


export default new DatabaseWrapper({
    host: 'dev3',
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
    sqlMode: [
        'ONLY_FULL_GROUP_BY',
        'STRICT_TRANS_TABLES',
        'STRICT_ALL_TABLES',
        'NO_ZERO_IN_DATE',
        'NO_ZERO_DATE',
        'ERROR_FOR_DIVISION_BY_ZERO',
        'NO_AUTO_CREATE_USER',
        'NO_ENGINE_SUBSTITUTION',
        'NO_UNSIGNED_SUBTRACTION',
        'PAD_CHAR_TO_FULL_LENGTH',
    ]
})