declare module 'mkdirp' {
    export default function mkdirp(path: string): Promise<string | undefined>
}

declare module 'rmfr' {
    export default function rmfr(path: string): Promise<void>
}
