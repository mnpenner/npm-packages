

export function once<Args extends any[], Return>(fn: (...args: Args) => Return): (...args: Args) => Return {
    let fired = false
    let result: Return
    return (...args: Args): Return => {
        if(fired) return result
        fired = true
        result = fn(...args)
        return result
    }
}
