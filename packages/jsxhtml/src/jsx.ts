/// <reference no-default-lib="true"/>

// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/jsx-runtime.d.ts
// or https://github.com/kitajs/html/blob/master/jsx.d.ts#L593


// declare namespace JSX {
//     type IntrinsicElements = import('./htmlspec/IntrinsicElements').IntrinsicElements
//     type Element = import('./jsx-node').JsxNode
//
//     // Fixes "TS2741: Property  children  is missing in type  {}  but required in type  StringChildren "
//     // https://www.typescriptlang.org/docs/handbook/jsx.html#children-type-checking
//     interface ElementChildrenAttribute {
//         children: unknown  // specify children name to use
//     }
// }

import {JsxNode} from './jsx-node'
import * as instrinsic from './htmlspec/IntrinsicElements'


export type ComponentType<P = {}> = FunctionComponent<P>;

export type JsxChild = string | number | boolean | null | undefined | JsxNode | JsxNode[];


export interface FunctionComponent<P = {}> {
    (props: P): JsxChild;
    displayName?: string | undefined;
}


export declare namespace JSX {
    type ElementType<P = any, Tag extends keyof IntrinsicElements = keyof IntrinsicElements> =
        | { [K in Tag]: P extends IntrinsicElements[K] ? K : never }[Tag]
        | ComponentType<P>;
    interface Element extends JsxNode {}
    type ElementClass = never
    interface ElementAttributesProperty {
        props: {};
    }
    interface ElementChildrenAttribute {
        children: {};
    }


    type LibraryManagedAttributes<Component, Props> = Props;

    interface IntrinsicAttributes {
        // key?: Key | null | undefined;
    }

    interface IntrinsicClassAttributes<T> {
        // ref?: Ref<T> | undefined;
    }

    /**
     * Attributes specific to intrinsic elements (lowercase tags).
     */
    interface IntrinsicElements extends instrinsic.IntrinsicElements {}
}

// Create a concrete object to export
// export const JSX = {}
