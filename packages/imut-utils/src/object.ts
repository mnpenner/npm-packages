


export function fpShallowMerge<T>(...objects: Partial<T>[]) {
    return (obj: T) => Object.assign(Object.create(null), obj, ...objects)
}
