import jsSerialize from 'js-serialize'

// TODO: write css`` or style`` string that escapes with CSS.escape
// js`` or script`` that escapes with JSON.stringify
// attr`` that escapes for HTML attributes
// html``
// url`` escapeUriComponent

export function js(strings: TemplateStringsArray, ...values: any[]) {
    // TODO: wrap this in some kind of marker so we know when it's already been escaped
    return strings.reduce((out, str, i) =>
        out + str + (i < values.length ? jsSerialize(values[i]) : ''), '')
}
