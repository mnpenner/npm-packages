function isNativeFunction(obj) {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
}

function isNumber(obj) {
    return typeof obj === 'number' || obj instanceof Number;
}

function isRegExp(obj) {
    return obj instanceof RegExp;
}

function isArray(obj) {
    return Array.isArray(obj);
}

function isNull(obj) {
    return obj === null;
}

function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

function isPlainObject(obj) {
    return isObject(obj)
        && !isString(obj)
        && !isNumber(obj)
        && !isRegExp(obj)
        && !isArray(obj);
}

function isSymbol(obj) {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}

/**
 * @param {Array} arr
 * @param {Function} cb
 * @returns {Array}
 * @see http://stackoverflow.com/q/5501581/65387
 */
function map(arr, cb) {
    let res = [];
    for(let i=0; i<arr.length; ++i) {
        res.push(cb(arr[i],i));
    }
    return res;
}

function hasAssignedValues(arr) {
    for(let i=0; i<arr.length; ++i) {
        if(arr.hasOwnProperty(i)) {
            return true;
        }
    }
    return false;
}

function dotGet(obj, path, defaultValue) {
    let parts = path.split('.');
    for(let p of parts) {
        obj = obj[p];
        if(!obj) return defaultValue;
    }
    return obj;
}

// function findFunction(lib, fn, path=[], seen=new Set) {
//     if(lib[fn.name] === fn) {
//         return [...path, fn.name];
//     }
//     seen.add(lib);
//     console.log(seen);
//     // process.stdout.write(`${path.join('.')}\n`);
//     for(let n of Object.getOwnPropertyNames(lib)) {
//         if(isObject(lib[n]) && !seen.has(lib[n])) {
//             let res = findFunction(lib[n], fn, [...path, n], seen);
//             if(res !== null) {
//                 return res;
//             }
//         }
//     }
//     return null;
// }

let reserved = new Set(['length','name','prototype']);

function findFunction(lib, fn) {
    let queue = [
        [[], lib]
    ];
    let seen = new Set();
    do {
        let [path,lib] = queue.shift();
        if(lib[fn.name] === fn) {
            return [...path, fn.name];
        }
        if(path.length < 4) {
            for(let n of Object.getOwnPropertyNames(lib)) {
                if(n[0] !== '_' && !reserved.has(n) && lib[n] && !seen.has(lib[n])) {
                    queue.push([[...path, n], lib[n]]);
                }
            }
        }
    } while(queue.length);
    return null;
}

module.exports = {isNativeFunction, isFunction, isObject, isNull, isString, isArray, isNumber, isRegExp, map, hasAssignedValues, isSymbol, dotGet, findFunction};