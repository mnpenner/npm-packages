import {isFunction,isString} from './isType';
import bindable from './bindable';
import {identity} from './value';

export const flatten = bindable(arrayOfArrays => Array.prototype.concat.call(...arrayOfArrays));

export const map = bindable((array,callback) => Array.prototype.map.call(array, callback));

export const filterAsync = bindable(async (array, mapCb, filterCb=identity) => {
        let results = await Promise.all(array.map(mapCb));
        return array.filter((_,i) => filterCb(results[i]));
    }
);

/**
 * Map and flatten
 */
export const flatMap = bindable((array, callback) => array::map(callback)::flatten());

export const groupBy = bindable(function groupBy(array, grouper) {
    return array.reduce((acc,val,idx) => {
        let key = grouper(val,idx);
        if(acc[key]) {
            acc[key].push(val);
        } else {
            acc[key] = [val];
        }
        return acc;
    }, Object.create(null));
});

export const thru = bindable((array,callback) => callback(array));

export const tap = bindable((array,callback) => {
    callback(array);
    return array;
});