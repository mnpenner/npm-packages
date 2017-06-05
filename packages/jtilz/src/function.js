import {isFunction} from './isType';

export function wrapMethods(module, wrapFn) {
    // TODO: create an object version of fmap and just use that
    return Object.keys(obj)
        .filter(k => isFunction(obj[k]))
        .map(k => [k, wrapFn(obj[k])])
        .reduce((o, a) => {
            o[a[0]] = a[1];
            return o;
        }, {});
}