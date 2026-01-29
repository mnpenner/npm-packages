export type ClassNamePrimitive = string | number | bigint
export type ClassNameDictionary = Record<string, unknown>
export type ClassNameValue = ClassNamePrimitive | ClassNameDictionary | ClassNameValue[] | null | undefined | boolean
export type ClassNames = ClassNameValue

function pushClassNames(value: ClassNameValue, classes: string[]) {
    if(value == null || value === false || value === true) return

    if(typeof value === 'string') {
        if(value) classes.push(value)
        return
    }

    if(typeof value === 'number' || typeof value === 'bigint') {
        classes.push(String(value))
        return
    }

    if(Array.isArray(value)) {
        for(const item of value) {
            pushClassNames(item, classes)
        }
        return
    }

    for(const key of Object.keys(value)) {
        if((value as ClassNameDictionary)[key]) {
            classes.push(key)
        }
    }
}

/**
 * Build a class string from strings, numbers, arrays, and objects.
 *
 * @param values Class name fragments.
 * @returns Space-separated class string.
 */
export function classCat(...values: ClassNameValue[]): string {
    const classes: string[] = []
    for(const value of values) {
        pushClassNames(value, classes)
    }
    return classes.join(' ')
}
