import {isFunction,isString,isPlainObject} from './Types';
import bindable from './bindable';

export const entries = bindable(Object.entries);

export const mapEntries = bindable((obj,callback) => Reflect.ownKeys(obj).map(k => callback(k,obj[k])));

export const omit = bindable(function omit(obj, keys) {
    keys = keys::toSet();
    return Object.keys(obj).reduce((acc,k) => {
        if(!keys.has(k)) {
            acc[k] = obj[k];
        }
        return acc;
    }, Object.create(null));
});


export const pairsToObject = bindable(array => {
    let result = Object.create(null);
    for(let [k,v] of array) {
        result[k] = v;
    }
    return result;
});

// /**
//  * 
//  * @param {Array} array
//  * @param {Function} callback
//  * @returns {Object}
//  */
// export function mapToObject(array, callback) {
//     let result = Object.create(null);
//     for(let i = 0; i<array.length; ++i) {
//         let pair = callback(array[i], i);
//         result[pair[0]] = pair[1];
//     }
//     return result;
// }

export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if(Array.isArray(target)) {
        if(Array.isArray(source)) {
            target.push(...source);
        } else {
            target.push(source);
        }
    } else if(isPlainObject(target)) {
        if(isPlainObject(source)) {
            for(let key of Object.keys(source)) {
                if(!target[key]) {
                    target[key] = source[key];
                } else {
                    mergeDeep(target[key], source[key]);
                }
            }
        } else {
            throw new Error(`Cannot merge object with non-object`);
        }
    } else {
        target = source;
    }

    return mergeDeep(target, ...sources);
}

export function getMethods(obj) {
    return Reflect.ownKeys(obj).filter(k => isFunction(obj[k]));
}