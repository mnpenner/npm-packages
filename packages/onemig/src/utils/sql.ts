// extracted from node-mysql3b

const CHARS_REGEX = /[\x00\b\n\r\t\x1A'\\]/gu;
const CHARS_ESCAPE_MAP: Record<string,string> = {
    '\0': '\\0',
    '\b': '\\b',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\x1a': '\\Z',
    '\'': "''",
    '\\': '\\\\'
};
const ID_GLOBAL_REGEXP = /`/g;
const QUAL_GLOBAL_REGEXP = /\./g;

type SingleUnescapedValue = string | number | Buffer | bigint | boolean | null;
type UnescapedValue = SingleUnescapedValue|SingleUnescapedValue[]
type SingleValue = SingleUnescapedValue
type Value = SingleValue|SingleValue[];
type UnescapedId = string|[string]|[string,string]|[string,string,string];
type Id = UnescapedId;

export function escapeString(value: string): string {
    return "'" + String(value).replace(CHARS_REGEX,m => CHARS_ESCAPE_MAP[m]) + "'";
}


export function escapeId(id: Id): string {
    if(Array.isArray(id)) return id.map(escapeId).join('.');
    return '`' + String(id).replace(ID_GLOBAL_REGEXP, '``') + '`';
}
