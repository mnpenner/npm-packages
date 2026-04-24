import type {OneOrMany} from '../types'

export const toArray = <T, >(v: OneOrMany<T>): T[] => (Array.isArray(v) ? v : [v])
