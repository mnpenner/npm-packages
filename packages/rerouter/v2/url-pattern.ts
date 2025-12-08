import { compile,parse } from "path-to-regexp";

const toPath = compile("/user/:id");


console.log(toPath({id:'foo'}))
console.log(toPath.toString())
console.log(parse("/user/:id"))

// @ts-ignore: Property 'UrlPattern' does not exist
// if (!globalThis.URLPattern) {
//     await import("urlpattern-polyfill");
// }

const patt = new URLPattern({pathname:"/user/:id"})
console.log(patt)
console.log(patt.exec("https://example.com/user/foo"))
