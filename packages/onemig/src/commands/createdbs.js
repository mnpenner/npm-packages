import dump from '../dump';
import {readDir, readJson} from '../util/fs';
import objHash from 'object-hash';
import napi, {dbNameMap} from '../napi';
import {InputOption} from '../console';
import Path from 'path';
import db from '../db';
import {getDatabaseCollation, getDefaultStorageEngine, getStruct} from '../struct';
import Ajv from 'ajv';
import tableSchema from '../table.schema.js';
import {omit} from '../util/object';
import {isNumber, isObject, isPlainObject} from '../util/types';
import {highlight} from 'cli-highlight';
import {ciCompare, toIter} from '../util/array';
import Konsole from '../util/Konsole';
import Chalk from 'chalk';
import * as async from '../util/async';
import * as fs from '../util/fs';
import {addMany} from '../util/set';
import conn from '../db';
import Crypto from 'crypto';

export default {
    name: "createdbs",
    description: "Create databases from napi.json",
    options: [

    ],
    async execute(args, opts) {
        for(const [gsid,agency] of Object.entries(napi.data.database.agency)) {
            const passwordHash = mysqlHash(napi.decrypt(agency.password));
            
            for(const [appId,dbName] of Object.entries(agency.db_names)) {
                const sql = `CREATE DATABASE IF NOT EXISTS ${conn.escapeId(dbName)};\nGRANT ALL PRIVILEGES ON ${conn.escapeId(dbName)}.* TO ${db.escapeValue(agency.login)}@'localhost' IDENTIFIED BY PASSWORD ${db.escapeValue(passwordHash)};`;
                console.log(highlight(sql, {language: 'sql', ignoreIllegals: true}));
            }
        }
        console.log(highlight(`FLUSH PRIVILEGES;`, {language: 'sql', ignoreIllegals: true}));
    }
}

function mysqlHash(data) {
    const hash1 = Crypto.createHash('sha1');
    hash1.update(data);
    const data2 = hash1.digest();
    const hash2 = Crypto.createHash('sha1');
    hash2.update(data2);
    return '*' + hash2.digest('hex').toUpperCase();
}