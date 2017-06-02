export default function bindable(fn) {
    return function boundFn(...args) {
        return this !== undefined && args.length < fn.length ? this::fn(this, ...args) : this::fn(...args);
    }
}