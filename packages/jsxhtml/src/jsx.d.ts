// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/jsx-runtime.d.ts
// or https://github.com/kitajs/html/blob/master/jsx.d.ts#L593


declare namespace JSX {

    type IntrinsicElements = {
        [_ in import('./tags/IntrinsicElements').HtmlElements]: import('./types').CommonProps
    }
}
