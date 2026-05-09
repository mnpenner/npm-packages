declare module 'react' {
    const React: any
    export default React
    export const lazy: any
    export const memo: any
    export const StrictMode: any
    export const Suspense: any
    export const useState: any
    export type ButtonHTMLAttributes<T = any> = any
    export type ComponentType<T = any> = any
    export type ComponentProps<T = any> = any
    export type DetailedHTMLProps<E = any, T = any> = any
    export type ErrorInfo = any
    export type Factory<T = any> = any
    export type FunctionComponent<T = any> = any
    export type ReactElement<T = any> = any
    export type ReactNode = any
    export type SuspenseProps = any
}

declare module 'react-dom' {
    export const createPortal: any
    export const render: any
    export const unmountComponentAtNode: any
}

declare module '*.less'

declare module 'react-hot-loader/root' {
    export const hot: any
}

declare module 'styled-components' {
    const styled: any
    export default styled
    export const css: any
}

declare module '@reach/router' {
    export const Link: any
    export const Match: any
    export const Router: any
    export type MatchRenderProps<T = any> = any
    export type RouteComponentProps<T = any> = any
}

declare namespace React {
    type ButtonHTMLAttributes<T = any> = any
    type ComponentType<T = any> = any
    type ComponentProps<T = any> = any
    type DetailedHTMLProps<E = any, T = any> = any
    type Factory<T = any> = any
    type FunctionComponent<T = any> = any
    type ReactElement<T = any> = any
    type ReactNode = any

    class Component<P = any, S = any> {
        props: P
        state: S
        setState(state: Partial<S>): void
    }
}

declare namespace JSX {
    interface IntrinsicElements {
        [name: string]: any
    }
}
