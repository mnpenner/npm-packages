// Do not modify this file. It was auto-generated with the following command:
// $ bun /mnt/c/Users/Mark/PhpstormProjects/rerouter/packages/react-router/src/bin/gen-routes.ts ./examples/routes.tsx -o ./examples/routes.gen.ts

type AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }

type ParamType = string | number | boolean
type WildcardType = Iterable<ParamType>

export function route_root(
    params: {
}
): string {
    let sb = ""

    sb += "/"

    return sb
}

export function route_login(
    params: {
}
): string {
    let sb = ""

    sb += "/login"

    return sb
}

export function route_matches_id(
    params: {
    "id": ParamType
}
): string {
    let sb = ""

    if (params["id"] == null) throw new Error("Missing param: id")
    sb += "/matches/"
    sb += encodeURIComponent(params["id"])

    return sb
}
