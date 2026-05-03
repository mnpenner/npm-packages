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

import type { JsxNode } from './jsx-node'
import type * as instrinsic from './htmlspec/IntrinsicElements'

export type ComponentType<P = {}> = FunctionComponent<P>

export type JsxChild = string | number | boolean | null | undefined | JsxNode | JsxNode[]

export interface FunctionComponent<P = {}> {
    (props: P): JsxChild
    displayName?: string | undefined
}

export namespace JSX {
    export type ElementType<
        P = any,
        Tag extends keyof IntrinsicElements = keyof IntrinsicElements,
    > = { [K in Tag]: P extends IntrinsicElements[K] ? K : never }[Tag] | ComponentType<P>
    export interface Element extends JsxNode {}
    export type ElementClass = never
    export interface ElementAttributesProperty {
        props: {}
    }
    export interface ElementChildrenAttribute {
        children: {}
    }

    export type LibraryManagedAttributes<Component, Props> = Props

    export interface IntrinsicAttributes {} // eslint-disable-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface

    export interface IntrinsicClassAttributes<T> {} // eslint-disable-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface, unused-imports/no-unused-vars

    /**
     * Attributes specific to intrinsic elements (lowercase tags).
     */
    export interface IntrinsicElements extends instrinsic.IntrinsicElements {}
}

export const JSX = {} // Bun tries to import this for some reason
