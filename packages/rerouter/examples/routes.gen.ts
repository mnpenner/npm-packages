// Do not modify this file. It was auto-generated with the following command:
// $ rerouter ./examples/routes.ts -w

type AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }

type ParamType = string | number | boolean
type WildcardType = Iterable<ParamType>

export function home(): string {
    let sb = ""

    sb += "/"

    return sb
}

export function kitchenSink(
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
    sb += (encodeURIComponent)(String(params["foo"]))
    sb += "/bar/"
    sb += (encodeURIComponent)(String(params["baz"]))
    sb += "/"
    sb += Array.from(params["splat"], v => (encodeURIComponent)(String(v))).join("/")
    sb += "/xxx"
    if (params["optional"] != null && params["two"] != null) {
        sb += "/"
        sb += (encodeURIComponent)(String(params["optional"]))
        sb += "/lol/"
        sb += (encodeURIComponent)(String(params["two"]))
    } else if (!(params["optional"] == null && params["two"] == null)) {
        throw new Error("Group requires all-or-none: \"optional\", \"two\"")
    }

    return sb
}

export function blogPost(
    params: {
    "id": ParamType
} & AllOrNone<{
    "title": ParamType
}>
): string {
    let sb = ""

    if (params["id"] == null) throw new Error("Missing param: id")
    sb += "/blog/"
    sb += (encodeURIComponent)(String(params["id"]))
    if (params["title"] != null) {
        sb += "-"
        sb += (encodeURIComponent)(String(params["title"]))
    } else if (!(params["title"] == null)) {
        throw new Error("Group requires all-or-none: \"title\"")
    }

    return sb
}

export function slowLoading(): string {
    let sb = ""

    sb += "/slow-loading"

    return sb
}

export function login(): string {
    let sb = ""

    sb += "/login"

    return sb
}

export function match(
    params: {
    "id": ParamType
}
): string {
    let sb = ""

    if (params["id"] == null) throw new Error("Missing param: id")
    sb += "/matches/"
    sb += (encodeURIComponent)(String(params["id"]))

    return sb
}
