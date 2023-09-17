/**
 * Like Array.prototype.map, but filters out undefined|null values.
 */
export function mapDefined<TItem, TReturn>(array: TItem[] | nil, callback: (value: TItem, index: number) => TReturn | null | undefined): TReturn[] {
    if(!array?.length) return []
    const accum: TReturn[] = []
    if(array?.length) {
        for(let i = 0; i < array.length; ++i) {
            const x = callback(array[i], i)
            if(x != null) {
                accum.push(x)
            }
        }
    }
    return accum
}


export type nil = null | undefined


// export function findMax<T>(array: T[], callback: (value: T, index: number) => number): T {
//     if(!array?.length) throw new Error("Empty array")
//
//     let maxEl = array[0]
//     let maxVal = callback(array[0], 0)
//
//     for(let i = 1; i < array.length; ++i) {
//         const val = callback(array[i], i)
//         if(val > maxVal) {
//             maxEl = array[i]
//             maxVal = val
//         }
//     }
//
//     return maxEl
// }

export type Full<T> = {
    [P in keyof T]-?: T[P];
}

export type PartialRecord<V,K extends keyof any=string> = {
    [P in K]?: V
}

export type AnyFn = (...args: any[]) => any
export type UnkFn = (...args: unknown[]) => unknown
type VoidFn = () => void

export const NOOP: AnyFn = Object.freeze(() => {/* do nothing*/})

// export const sleep = (ms: number) => new Promise(r => setTimeout(r,ms))
