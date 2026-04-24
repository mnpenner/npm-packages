const XRegExp = require('xregexp');
const propName = XRegExp('^[$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}][$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Ll}\u200C\u200D\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]*$');


const asciiJson = require('./ascii-json');


console.log(asciiJson.stringify(propName.toString()).slice(1,-1));