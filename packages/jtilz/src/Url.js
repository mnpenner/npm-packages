import fmap, {__skip__} from './fmap';

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
    return encodeURIComponent(x);
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

/**
 * Joins URLs together with /. Leaves leading and trailing slashes alone. Does not duplicate internal slashes.
 * 
 * @param {string[]} urls
 * @returns {string}
 */
function joinUrlPaths(...urls) {
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