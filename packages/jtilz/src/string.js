import {dec2hex} from './number';

export function replaceAll(search, replacement) {
    return this.split(search).join(replacement);
}

export function percentEncode(char) {
    return '%' + dec2hex(char.codePointAt(0));
}