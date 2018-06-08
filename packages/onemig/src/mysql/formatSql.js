// import {log} from './debug';
import {isPlainObject} from '../util/types';

const {hasOwnProperty} = Object.prototype;
const {map} = Array.prototype;
import Chalk from 'chalk';

const strPatt = /(['"`])(?:\\.|\1\1|(?!\1).)*\1/g;
const objPatt = /:{1,2}[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/g;
const arrPatt = /\?{1,2}/g;

function splitQuery(str) {
    let sqlFrags = [];
    let stringLiterals = [];
    let lastIndex = 0;
    let match;

    while((match = strPatt.exec(str)) !== null) {
        sqlFrags.push(str.slice(lastIndex, match.index));
        lastIndex = match.index + match[0].length;
        stringLiterals.push(match[0]);
    }
    sqlFrags.push(str.slice(lastIndex));
    return [sqlFrags, stringLiterals];
}


export default function formatSql(sqlQuery, values) {
    if(!values || (Array.isArray(values) && values.length === 0)) {
        return sqlQuery;
    }
    let [sqlFrags, stringLiterals] = splitQuery(sqlQuery);

    if(isPlainObject(values)) {
        sqlFrags = sqlFrags.map(frag => frag.replace(objPatt, m => {
            if(m.startsWith('::')) {
                let p = m.slice(2);
                if(!values::hasOwnProperty(p)) {
                    throw new Error(`Missing placeholder id ${p}`);
                }
                return this::escapeId(values[p]);
            }
            let p = m.slice(1);
            if(!values::hasOwnProperty(p)) {
                throw new Error(`Missing placeholder value ${p}`);
            }
            return this::escapeValue(values[p]);
        }));
    } else if(Array.isArray(values)) {
        sqlFrags = sqlFrags.map(frag => {
            let i = -1;
            return frag.replace(arrPatt, m => {
                if(++i >= values.length) {
                    throw new Error(`Not enough placeholder values`);
                }
                if(m.length === 1) {
                    return this::escapeValue(values[i]);
                }
                return this::escapeId(values[i]);
            });
        });
    } else {
        throw new Error(`Unsupported values type`);
    }


    let formattedQuery = weave(sqlFrags, stringLiterals).join('');
    // console.log(`${Chalk.bold('QUERY:')} ${formattedQuery}`);
    return formattedQuery;
}

function escapeId(value) {
    if(isPlainObject(value)) {
        // FIXME: not sure if this is a good idea or not... only supporting "AND" is probably too limited
        let keys = Object.keys(value);
        if(keys.length === 0) {
            return '1';
        }
        // TODO: add support for "IN" when value[k] is an array/iterable
        let where = keys.map(k => `${this::escapeId(k)}=${this::escapeValue(value[k])}`).join(' AND ');
        if(keys.length > 1) {
            return `(${where})`;
        }
        return where;
    }
    if(value instanceof Set) {
        value = Array.from(value);
    }
    return this.escapeId(value);
}

function escapeValue(value) {
    if(isPlainObject(value)) {
        let keys = Object.keys(value);
        if(keys.length === 0) {
            throw new Error(`Cannot escape empty object`);
        }
        return keys.map(k => `${this::escapeId(k)}=${this::escapeValue(value[k])}`).join(',');
    }
    if(value instanceof Set) {
        value = Array.from(value);
    }
    if(Array.isArray(value)) {
        if(value.length === 0) {
            throw new Error(`Cannot escape empty array`);
        }
        if(Array.isArray(value[0])) {
            return value.map(v => `(${this::escapeValue(v)})`).join(',');
        }
        return value.map(this::escapeValue).join(',');
    }
    if(value instanceof Date) {
        return value.getTime();
    }
    return this.escape(value);
}

function weave(a, b) {
    let out = [];
    let i = 0;
    for(; i < b.length; ++i) {
        out.push(a[i], b[i]);
    }
    out.push(a[i]);
    return out;
}