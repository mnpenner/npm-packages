import {isFunction,isString} from './isType';
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