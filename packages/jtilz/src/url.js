import fmap, {__skip__} from './fmap';
import {percentEncode, replaceAll} from './string';

export function encodeParam(x) {
    if(x === true) {
        return '1';
    }
    if(x === false) {
        return '0';
    }
    if(x === undefined || x === null) {
        return '';
    }
    
    return encodeURIComponent(x)
        .replace(/(%2F|%5C|^)\.{1,2}(?=%2F|%5C|$)/g, m => m::replaceAll('.','%2E'));
}

export function queryParams(params) {
    return Object.keys(params)
        ::fmap(k => {
            if(params[k] === undefined) {
                return __skip__;
            }
            if(Array.isArray(params[k])) {
                return params[k]
                    .map(val => `${encodeParam(k)}[]=${encodeParam(val)}`)
                    .join('&')
            }
            return `${encodeParam(k)}=${encodeParam(params[k])}`
        }).join('&');
}
