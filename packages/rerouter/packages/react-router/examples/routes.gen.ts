// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-routes.ts ./examples/routes.tsx -o ./examples/routes.gen.ts

type __AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }

type __ParamType = string | number | boolean
type __WildcardType = Iterable<__ParamType>

export function home(): string {
    let sb = ""

    sb += "/"

    return sb
}

export function kitchenSink(
    params: {
    "foo": __ParamType
    "baz": __ParamType
    "splat": __WildcardType
} & __AllOrNone<{
    "optional": __ParamType
    "two": __ParamType
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

export function login(): string {
    let sb = ""

    sb += "/login"

    return sb
}

export function match(
    params: {
    "id": __ParamType
}
): string {
    let sb = ""

    if (params["id"] == null) throw new Error("Missing param: id")
    sb += "/matches/"
    sb += encodeURIComponent(params["id"])

    return sb
}
