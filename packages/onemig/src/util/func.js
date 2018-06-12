import {isPrimitive} from './types';
import objHash from 'object-hash';
import dump from '../dump';

const NOT_SET = Symbol('NOT_SET');

export function memoized(fn) {
    let noArgs = NOT_SET;
    const primitiveArg = new Map;
    const hashMap = new Map;

    return (...args) => {
        if(args.length === 0) {
            if(noArgs === NOT_SET) {
                noArgs = fn();
            } 
            return noArgs;
        }
        if(args.length === 1 && isPrimitive(args[0])) {
            if(primitiveArg.has(args[0])) {
                return primitiveArg.get(args[0]);
            }
            const ret = fn(args[0]);
            primitiveArg.set(args[0], ret);
            return ret;
        }
        const key = objHash(args);
        if(hashMap.has(key)) {
            return hashMap.get(key);
        }
        const ret = fn(...args);
        primitiveArg.set(key, ret);
        return ret;
    }
}