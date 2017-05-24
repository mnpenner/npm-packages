export default function bindable(fn) {
    return function boundFn(...args) {
        return this === undefined ? fn(...args) : fn(this, ...args);
    }
}