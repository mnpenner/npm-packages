import {decToHex} from './number';


export function replaceAll(this: string, search: string, replacement: string): string {
    return this.split(search).join(replacement);
}

/**
 * Percent-encodes a character.
 * 
 * @param char A single character
 */
export function percentEncode(char: string): string {
    let codePoint = char.codePointAt(0);
    if(codePoint === undefined) {
        return '';
    }
    return '%' + decToHex(codePoint);
}