export const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([])
export const EMPTY_OBJECT: Record<string,any> = Object.freeze(Object.create({__proto__:null}))
export const TRUE_VALUES = new Set(['y', 'yes', 't', 'true', '1', 'on'])
export const FALSE_VALUES = new Set(['n', 'no', 'f', 'false', '0', 'off'])
