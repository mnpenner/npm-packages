// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/jsx-runtime.d.ts
// or https://github.com/kitajs/html/blob/master/jsx.d.ts#L593


declare namespace JSX {
    type IntrinsicElements = {
        [_ in import('./htmlspec/IntrinsicElements').HtmlElements]: import('./types').CommonProps
    }

    type Element = import('./jsx-node').JsxNode

    // Fixes "TS2741: Property  children  is missing in type  {}  but required in type  StringChildren "
    // https://www.typescriptlang.org/docs/handbook/jsx.html#children-type-checking
    interface ElementChildrenAttribute {
        children: unknown  // specify children name to use
    }
}
