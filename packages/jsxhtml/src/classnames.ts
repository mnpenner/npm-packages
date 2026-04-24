import {cc, type ClassArray, type ClassObject, type ClassValue} from '@mpen/classcat'

export type ClassNamePrimitive = string | number
export type ClassNameDictionary = ClassObject
export type ClassNameValue = ClassValue
export type ClassNames = ClassArray | ClassNameValue

/**
 * Build a class string from strings, numbers, arrays, and objects.
 *
 * @param values Class name fragments.
 * @returns Space-separated class string.
 */
export function classCat(...values: ClassNameValue[]): string {
    return cc(...values)
}
