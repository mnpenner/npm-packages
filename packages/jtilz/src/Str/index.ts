import {decToHex} from '../Nbr';


/**
 * Replaces all occurrences of a string with another string.
 * @param this - The source string.
 * @param search - The string to search for.
 * @param replacement - The string to replace with.
 * @returns The new string.
 * @deprecated Use [`String.prototype.replaceAll`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll} instead.
 */
export function replaceAll(this: string, search: string, replacement: string): string {
    return this.split(search).join(replacement);
}


/**
 * Percent-encodes a character.
 * 
 * @param char - A single character.
 * @returns The percent-encoded string.
 */
export function percentEncode(char: string): string {
    const codePoint = char.codePointAt(0);
    if(codePoint === undefined) {
        return '';
    }
    return '%' + decToHex(codePoint);
}