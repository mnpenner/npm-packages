export default {
    None: 1<<0, // value is a boolean
    Required: 1<<1, // value is required
    Optional: 1<<2, // not presently supported... i think we might need an = sign so we know whether or not to interpret the next arg is an option value or positional arg
    Array: 1<<3, // array implies a value is expected
}