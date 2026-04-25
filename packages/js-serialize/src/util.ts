
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
