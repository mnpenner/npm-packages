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

/**
 * Recursively searches (BFS) through `lib` (an object/module) to find the fully-qualified name of `fn`.
 * 
 * This function may be expensive.
 * 
 * @param {Object} lib
 * @param {Function} fn
 * @param {Number} maxDepth
 * @returns {null|Array.<string>}
 */
function findFunction(lib, fn, maxDepth=3) {
    let queue = [];
    let path = [];
    let seen = new Set();
    --maxDepth;
    for(;;) {
        if(lib[fn.name] === fn) {
            return [...path, fn.name];
        }
        seen.add(lib);
        if(path.length < maxDepth) {
            for(let n of Object.getOwnPropertyNames(lib)) {
                if(n[0] !== '_' && n !== 'prototype' && lib[n] && !seen.has(lib[n])) {
                    queue.push([[...path, n], lib[n]]);
                }
            }
        }
        if(!queue.length) {
            return null;
        }
        [path,lib] = queue.shift();
    }
}

module.exports = {isNativeFunction, isFunction, isObject, isNull, isString, isArray, isNumber, isRegExp, map, hasAssignedValues, isSymbol, dotGet, findFunction};