import MySql from 'mysql2/promise';
import ResultWrapper from './ResultWrapper';

export default class DatabaseWrapper {

    constructor({sqlMode, ...options}) {
        this.pool = MySql.createPool(options);
        if(sqlMode) {
            if(Array.isArray(sqlMode)) {
                sqlMode = sqlMode.join(',');
            }
            this.pool.on('connection', conn => {
                conn.query(`set sql_mode=?`, [sqlMode]);
            });
        }
    }

    query(sql, params) {
        return new ResultWrapper(this.pool.query(sql, params));
    }
    
    stream(sql, params) {
        // fixme: this would probably be nicer as an async-generator but those aren't available until node 10.0.0
        return this.pool.pool.query(sql, params);
    }

    close() {
        return this.pool.end();
    }
}