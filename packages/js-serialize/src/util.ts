export function isNativeFunction(obj: any): obj is Function {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

export function isFunction(obj:any): obj is Function {
    return typeof obj === 'function';
}

export function isString(obj:any): obj is string {
    return typeof obj === 'string'
}

export function isStringLike(obj:any): obj is string|String {
    return typeof obj === 'string' || obj instanceof String;
}

export function isNumber(obj:any) : obj is number {
    return typeof obj === 'number';
}

export function isNumberLike(obj:any) : obj is number|Number {
    return typeof obj === 'number' || obj instanceof Number;
}

export function isBigInt(obj: any): obj is bigint {
    return typeof obj === 'bigint';
}

export function isBoolean(obj: any): obj is boolean {
    return obj === true || obj === false;
}

export function isRegExp(obj: any): obj is RegExp {
    return obj instanceof RegExp;
}

export function isArray(obj: any): obj is any[] {
    return Array.isArray(obj);
}

export function isNull(obj: any): obj is null {
    return obj === null;
}

export function isObject(obj: any): obj is object {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj: any): obj is object {
    return isObject(obj)
        && !isStringLike(obj)
        && !isNumberLike(obj)
        && !isRegExp(obj)
        && !isArray(obj);
}

export function isSymbol(obj: any): obj is symbol {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
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
export function findFunction(lib: any, fn: Function, maxDepth:number=3):null|string[] {
    let queue: [path:string[],lib:any][] = [];
    let path: string[] = [];
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
        [path,lib] = queue.shift()!;
    }
}
