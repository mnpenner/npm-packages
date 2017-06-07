import {toHex} from './Number';
import bindable from './bindable';

export const replaceAll = bindable((string, search, replacement) => string.split(search).join(replacement));

export const percentEncode = bindable(char => '%' + toHex(char.codePointAt(0)));
