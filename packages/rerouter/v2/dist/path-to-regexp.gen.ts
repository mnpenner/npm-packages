type AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }
type ParamType = string | number | boolean
type WilcardType = Iterable<ParamType>

function generate(params: { "foo": ParamType, "baz": ParamType, "splat": WilcardType } & AllOrNone<{
    "optional": ParamType,
    "two": ParamType
}>): string {
    let sb = ""
    if(params["foo"] == null) throw new Error("Missing param: foo")
    if(params["baz"] == null) throw new Error("Missing param: baz")
    if(params["splat"] == null) throw new Error("Missing param: splat")
    sb += "/hello/"
    sb += encodeURIComponent(params["foo"])
    sb += "/bar/"
    sb += encodeURIComponent(params["baz"])
    sb += "/"
    sb += Array.from(params["splat"], encodeURIComponent).join(",")
    sb += "/xxx"
    if(params["optional"] != null && params["two"] != null) {
        sb += "/"
        sb += encodeURIComponent(params["optional"])
        sb += "/lol/"
        sb += encodeURIComponent(params["two"])
    } else if(!(params["optional"] == null && params["two"] == null)) {
        throw new Error("Group requires all-or-none: \"optional\", \"two\"")
    }
    return sb
}


console.log(generate({foo: 'bar', baz: 2, splat: new Set(['a', 'b', 3]), optional: 'd', two: false}))
