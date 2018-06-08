export function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj) {
    return isObject(obj) && (
        obj.constructor === Object  // obj = {}
        || obj.constructor === undefined // obj = Object.create(null)
    );
}