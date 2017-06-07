import {decToHex} from './Number';
import bindable from './bindable';

export const replaceAll = bindable((string, search, replacement) => string.split(search).join(replacement));

export const percentEncode = bindable(char => '%' + decToHex(char.codePointAt(0)));
