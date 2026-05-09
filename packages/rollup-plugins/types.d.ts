declare module 'rollup' {
    export type NormalizedOutputOptions = any
    export type OutputBundle = Record<string, any>
    export type Plugin = any
    export type PluginContext = any
    export type RenderedChunk = any
    export type ResolveIdResult = any
    export type RollupOptions = any
    export type WatcherOptions = any
}

declare module 'rollup-plugin-typescript2' {
    export type RPT2Options = any
    const typescript: any
    export default typescript
}

declare module '@rollup/plugin-babel' {
    export type RollupBabelInputPluginOptions = any
    export const babel: any
}

declare module '@rollup/plugin-commonjs' {
    const commonjs: any
    export default commonjs
}

declare module '@rollup/plugin-json' {
    const json: any
    export default json
}

declare module '@rollup/plugin-node-resolve' {
    export const nodeResolve: any
}

declare module '@rollup/plugin-replace' {
    const replace: any
    export default replace
}

declare module '@mpen/rollup-plugin-clean' {
    const cleanPlugin: any
    export default cleanPlugin
}

declare module '@mpen/rollup-plugin-executable' {
    export type RollupPluginExecutableOptions = any
    const execPlugin: any
    export default execPlugin
}

declare module '@mpen/rollup-plugin-node-resolve' {
    const nodeResolve: any
    export default nodeResolve
}

declare module '@mpen/rollup-plugin-package' {
    const packagePlugin: any
    export default packagePlugin
}

declare module '@mpen/rollup-plugin-run' {
    const runPlugin: any
    export default runPlugin
}

declare module 'builtin-modules' {
    const builtinModules: string[]
    export default builtinModules
}

declare module 'find-up' {
    const findUp: any
    export default findUp
}

declare module 'magic-string' {
    const MagicString: any
    export default MagicString
}

declare module 'pkg-dir' {
    const getPkgDir: any
    export default getPkgDir
}

declare module 'pkg-up' {
    const pkgUp: any
    export default pkgUp
}

declare module 'pug' {
    const Pug: any
    export default Pug
}

declare module 'rollup-plugin-node-externals' {
    const nodeExternals: any
    export default nodeExternals
}
