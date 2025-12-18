// Do not modify this file. It was auto-generated with the following command:
// $ bun /mnt/c/Users/Mark/PhpstormProjects/rerouter/packages/react-router/src/bin/gen-path-to-regexp.ts

type AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }

type ParamType = string | number | boolean
type WildcardType = Iterable<ParamType>

export function generate(
    params: {
        "foo": ParamType
        "baz": ParamType
        "splat": WildcardType
    } & AllOrNone<{
        "optional": ParamType
        "two": ParamType
    }>
): string {
    let sb = ""

    if (params["foo"] == null) throw new Error("Missing param: foo")
    if (params["baz"] == null) throw new Error("Missing param: baz")
    if (params["splat"] == null) throw new Error("Missing param: splat")
    sb += "/hello/"
    sb += encodeURIComponent(params["foo"])
    sb += "/bar/"
    sb += encodeURIComponent(params["baz"])
    sb += "/"
    sb += Array.from(params["splat"], encodeURIComponent).join("/")
    sb += "/xxx"
    if (params["optional"] != null && params["two"] != null) {
        sb += "/"
        sb += encodeURIComponent(params["optional"])
        sb += "/lol/"
        sb += encodeURIComponent(params["two"])
    } else if (!(params["optional"] == null && params["two"] == null)) {
        throw new Error("Group requires all-or-none: \"optional\", \"two\"")
    }

    return sb
}
