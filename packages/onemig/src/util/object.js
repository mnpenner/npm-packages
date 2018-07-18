import stringToPath from './stringToPath';
import dump from '../dump';
import {isBoolean,isString,isNumber,isArray} from './types';
import * as Type from './types';

export function getValue(obj, path, def) {
    if(!obj) return def;
 
    if(!Array.isArray(path)) {
        path = stringToPath(path);
    }
    let ret = obj;

    for(let key of path) {
        // console.log(obj,ret,key,path);
        // if(ret == null) {
        //     // console.log('key not found',ret,key);
        //     return def;
        // }
        if(isMap(ret)) {
            ret = ret.get(key);
        } else {
            ret = ret[key];
        }
        if(ret === undefined) {
            return def;
        }
    }
    // console.log(obj,path);

    return ret;
}

function isMap(x) {
    return x instanceof Map || x instanceof WeakMap;
}

function isInt(obj) {
    return (typeof obj === 'string' && /^(0|[1-9][0-9]*)$/.test(obj)) || Number.isInteger(obj);
}

export function setValue(obj, path, value) {
    const end = path.length - 1;
    for(let i=0; i<end; ++i) {
        const key = path[i];
        const path1 = path[i+1];
        if(obj[key]) {
            // nada. no clone. mutate dat shit.
        } else if(isInt(path1)) {
            obj[key] = new Array(parseInt(path1,10)+1);
        } else {
            obj[key] = Object.create(null);
        }
        obj = obj[key];
    }
    obj[path[end]] = value;
}

export function pick(obj, keys) {
    const out = Object.create(null);
    for(const k of keys) {
        out[k] = obj[k];
    }
    return out;
}

export function omit(obj, keys) {
    const out = Object.create(null);
    for(let k of Object.keys(obj)) {
        if(!keys.includes(k)) {
            out[k] = obj[k];
        }
    }
    return out;
}

export function toBool(str, def) {
    if(isString(str)) {
        let boolStr = str.trim().toLowerCase();
        if(['1', 't', 'true', 'y', 'yes', 'on'].includes(boolStr)) return true;
        if(['0', 'f', 'false', 'n', 'no', 'off'].includes(boolStr)) return false;
    } else if(isBoolean(str)) {
        return str;
    } else if(isNumber(str)) {
        return str !== 0;
    } else if(isArray(str)) {
        return str.length > 0;
    }
    return def;
}

function deepCloneObject(obj) {
    const clone = Object.create(null);
    for(const key of Object.keys(obj)) {
        clone[key] = deepClone(obj[key]);
    }
    return clone;
}

export function deepClone(value) {
    if(Type.isArray(value)) {
        return value.map(deepClone);
    }
    if(Type.isDate(value)) {
        return Object.assign(new Date(value.valueOf()),value);
    }
    if(Type.isMap(value) || Type.isSet(value)) {
        return Object.assign(new value.constructor(value),value);
    }
    if(Type.isNumber(value) || Type.isString(value) || Type.isNullish(value) || Type.isBoolean(value) || Type.isSymbol(value)) {
        return value; // these types are immutable. no clone necessary
    }
    if(Type.isRegExp(value)) {
        return Object.assign(new RegExp(value.source, value.flags),value);
    }
    if(Type.isObject(value)) {
        return deepCloneObject(value);
    }
    throw new Error(`Could not clone value`);
}


export function setDefaults(obj, ...defaults) {
    for(const def of defaults) {
        for(const [k, v] of Object.entries(def)) {
            if(obj[k] === undefined && v !== undefined) {
                obj[k] = v;
            }
        }
    }
    return obj;
}