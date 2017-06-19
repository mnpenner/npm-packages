import {__skip__, filterMap} from './collection';
import {isArray, isNumber} from './types';
import {IDictionary} from './type-defs';

/**
 * Encodes a value for use in a URI.
 */
export function encodeParam(x: string|number|boolean|undefined|null): string {
    if(x === true) {
        return '1';
    }
    if(x === false) {
        return '0';
    }
    if(x === undefined || x === null) {
        return '';
    }
    return encodeURIComponent(String(x));
}

/**
 * Joins URLs together with /. Leaves leading and trailing slashes alone. Does not duplicate internal slashes.
 */
export function joinUrlPaths(...urls: string[]): string {
    return urls.map((u,i) => {
        if(i > 0) {
            u = u.replace(/^\/+/g, '');
        }
        if(i < urls.length - 1) {
            u = u.replace(/\/+$/g, '');
        }
        return u;
    }).join('/');
}

/**
 * Encodes an object as a query string.
 */
export function queryParams(params: {[key: string]: any}): string {
    return filterMap(Object.keys(params), (k: string) => {
        if(params[k] === undefined) {
            return __skip__;
        }
        if(isArray(params[k])) {
            return params[k]
                .map((val:any) => `${encodeParam(k)}[]=${encodeParam(val)}`)
                .join('&')
        }
        return `${encodeParam(k)}=${encodeParam(params[k])}`;
    }).join('&');
}