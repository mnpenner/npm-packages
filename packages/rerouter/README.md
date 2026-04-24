# @mpen/rerouter

An implementation of [RFC 6570: URI Template](https://tools.ietf.org/html/rfc6570).
    
## Installation

```sh
bun add @mpen/rerouter
```

## API

```ts
const templ = new UriTemplate('/query{?firstName,lastName}')
console.log(templ.match('/query?firstName=Bj%c3%b6rk&lastName=Gu%c3%b0mundsd%c3%b3ttir'))
// {
//   score: 7,
//   params: {
//     firstName: "Björk",
//     lastName: "Guðmundsdóttir"
//   }
// }
console.log(templ.expand({firstName: 'Mark', lastName: 'Penner'}))
// /query?firstName=Mark&lastName=Penner
```

That's it. That's the whole API. 2 methods.

It's been tested against https://github.com/uri-templates/uritemplate-test and all 157 tests pass.

The `score` is still experimental. The idea is that you can run a URL against multiple templates and if multiple match, you should use the one with the highest score. Higher score means more matching parts, i.e. more specific match.
