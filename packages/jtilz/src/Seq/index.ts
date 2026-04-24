
// https://github.com/Microsoft/TypeScript/issues/1024#issuecomment-68059662
// https://github.com/Microsoft/TypeScript/issues/5453

export default function chain<T>(fn: Function) {
    return function chainWrap(this: any, ...args: any[]) {
        return fn.call(this, this, ...args);
    }
}

export function thru(this: any, callback: Function) {
    return callback(this);
}

export function tap(this: any, callback: Function) {
    callback(this);
    return this;
}
