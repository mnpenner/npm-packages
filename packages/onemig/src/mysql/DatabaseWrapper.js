import MySql from 'mysql2/promise';
import ResultWrapper from './ResultWrapper';
import dump from '../dump';
import fromEmitter from '@async-generators/from-emitter';

function escapeIdString(id) {
    return '`' + String(id).replace(/`/g,'``') + '`';
}

export default class DatabaseWrapper {

    constructor({sqlMode, foreignKeyChecks, ...options}) {
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