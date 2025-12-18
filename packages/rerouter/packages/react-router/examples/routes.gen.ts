// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-routes.ts ./examples/routes.tsx -o ./examples/routes.gen.ts

type __AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }

type __ParamType = string | number | boolean
type __WildcardType = Iterable<__ParamType>

export function home(
    params: {
}
): string {
    let sb = ""

    sb += "/"

    return sb
}

export function login(
    params: {
}
): string {
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
