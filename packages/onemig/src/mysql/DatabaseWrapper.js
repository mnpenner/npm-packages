import MySql from 'mysql2/promise';
import ResultWrapper from './ResultWrapper';
import dump from '../dump';
import fromEmitter from '@async-generators/from-emitter';
import formatSql from './formatSql';
import {setDefaults} from '../util/object';
import {highlight} from 'cli-highlight';
import Util from 'util';

function escapeIdString(id) {
    return '`' + String(id).replace(/`/g,'``') + '`';
}

export default class DatabaseWrapper {

    constructor({sqlMode, foreignKeyChecks, ...options}) {
        setDefaults(options, {
            timezone: 'America/Vancouver',
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
            ],
        });
        // dump(options);
        
        this.pool = MySql.createPool(options);
        
        if(sqlMode != null || foreignKeyChecks != null) {
            if(Array.isArray(sqlMode)) {
                sqlMode = sqlMode.join(',');
            }
            this.pool.on('connection', conn => {
                if(sqlMode != null) {
                    conn.query(`SET sql_mode=?`, [sqlMode]);
                }
                if(foreignKeyChecks != null) {
                    conn.query(`SET foreign_key_checks=?`, [foreignKeyChecks ? 1 : 0]);
                }
            });
        }
    }

    query(sql, params) {
        // console.log(highlight(sql, {language: 'sql', ignoreIllegals: true}),Util.inspect(params,{colors:true}));
        return new ResultWrapper(this.pool.query(sql, params));
    }

    async exec(sql, params) {
        const [res] = await this.pool.query(sql, params);
        return res;
    }
    
    escapeValue(value) {
        return this.pool.escape(value);
    }
    
    escapeId(id) {
        if(Array.isArray(id)) {
            return id.map(escapeIdString).join('.')
        }
        return escapeIdString(id);
    }
    
    stream(sql, params) {
        // console.log(highlight(sql, {language: 'sql', ignoreIllegals: true}),Util.inspect(params,{colors:true}));
        //'result','error','end'
        return fromEmitter(this.pool.pool.query(sql, params),{
            onNext: 'result',
            onError: 'error',
            onDone: 'end',
        });
        
        // fixme: this would probably be nicer as an async-generator but those aren't available until node 10.0.0
        // https://babeljs.io/docs/plugins/transform-async-generator-functions/
        // https://gist.github.com/nybblr/3af62797052c42f7090b4f8614b5e157#file-2-medium-js
        // there appears to be a `once` method already: /home/mpenner/.PhpStorm2018.1/config/javascript/nodejs/8.10.0/core-modules/events.js

        // let resultEmitter = this.pool.pool.query(sql, params);
        //
        // dump(resultEmitter.addListener);
        // // resultEmitter.on('result', data => {
        // //     dump('got it',data);
        // // })
        //
        // for(;;) {
        //     let resultPromise = oncePromise(resultEmitter, 'result');
        //     let endPromise = oncePromise(resultEmitter, 'end');
        //    
        //     dump('waiting for results...')
        //     const result = await Promise.race([resultPromise,endPromise]);
        //     dump('aaa',result);
        //     yield result;
        // }
        
    }

    close() {
        return this.pool.end();
    }
}

async function* foo(){}

function oncePromise(emitter, event) {
    return new Promise(resolve => emitter.once(event, resolve))
}