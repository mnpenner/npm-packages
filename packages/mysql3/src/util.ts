import mariadb from 'mariadb'
import {SqlFrag} from './sql'
import type * as geojson from 'geojson'

export function zip<A, B>(a: A[], b: B[]): Array<[A, B]> {
    if(a.length !== b.length) throw new Error("Cannot zip arrays; lengths differ")
    return a.map((x, i) => [x, b[i]])
}

export interface QueryOptions extends mariadb.QueryConfig {
    sql: SqlFrag
}

export type QueryParam = SqlFrag | QueryOptions

export function makeOptions(query: QueryParam) {
    if(query instanceof SqlFrag) {
        return {sql: query}
    } else if(typeof query === 'object') {
        return query
    }
    throw new Error(`Expected sql\`template string\` or {options}, got ${typeof query}`)
}

export const META = 'meta'
export type DefaultValueType =
    string
    | number
    | /*FIXME might be coming out wrong*/Buffer
    | boolean
    | Date
    | bigint
    | null
    | /*set*/string[]
    | geojson.Geometry
export type DefaultRecordType = Record<string, DefaultValueType>
export type QueryResult<T> = T[] & { [META]: mariadb.FieldInfo[] }
