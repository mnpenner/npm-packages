import * as v from 'valibot'

export const StringInt = v.pipe(v.string(), v.trim(), v.digits(), v.toNumber())
export const Int = v.pipe(v.union([v.pipe(v.number(), v.integer()), StringInt]))
