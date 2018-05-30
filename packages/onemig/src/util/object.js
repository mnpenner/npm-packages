import stringToPath from './stringToPath';
import dump from '../dump';

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