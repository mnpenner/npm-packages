- Standardize on "search" vs "query" params for both packages/react-router and packages/server-router.
- Maybe add `neverject` to this project?
- Add mass `bun run publish-all` (can we detect if there was a change from npm and bump the version?)
- Build `http-helpers`
- Implement `neverject-fetch`
    - Create `Fetcher` shims for axios et al
- Verify `server-router` can handle money-manager/server/routes.tsx
- Add `-o` option to `packages/server-router/src/bin/` so that react-router and server-route bins are similar.
- Figure out best split for bin/ vs examples/ vs public lib/. Should "examples" really be "tests" ? Each "examples" is
  basically a mini-app, should it be moved into a subdir?

Envoy sets these headers:

```txt
 "x-forwarded-for": "1.2.3.4                                    
 "x-forwarded-proto": "https                                             
 "x-envoy-external-address": "1.2.3.4
 "x-request-id": "b7738766-fd6a-4922-a0f0-d26660f0df08",  
```

Add a `ip-address-ctx` middleware.

Adjust the `request-id-ctx` middleware to check `x-envoy-external-address`.
