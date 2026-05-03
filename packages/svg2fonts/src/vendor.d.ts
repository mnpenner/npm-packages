declare module 'cssesc' {
    export default function cssesc(
        value: string,
        options?: {
            wrap?: boolean
            isIdentifier?: boolean
        },
    ): string
}

declare module 'he' {
    export function escape(value: string): string
}

declare module 'mkdirp' {
    const mkdirp: {
        sync(path: string): void
    }
    export default mkdirp
}

declare module 'sanitize-filename' {
    export default function sanitizeFileName(value: string): string
}
