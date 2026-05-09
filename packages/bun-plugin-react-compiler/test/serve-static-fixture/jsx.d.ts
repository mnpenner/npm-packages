declare namespace JSX {
    interface IntrinsicElements {
        [elementName: string]: unknown
    }
}

declare module 'react' {
    const React: unknown
    export default React
}

declare module 'react/jsx-runtime' {
    export const jsx: unknown
    export const jsxs: unknown
    export const Fragment: unknown
}

declare module 'react-dom/client' {
    export function createRoot(element: Element): {
        render(children: unknown): void
    }
}
