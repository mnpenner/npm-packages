import type {JsxNode} from './jsx-node'
import type {
    AnyAttributes,
    AttrArr,
    AttrKvPair,
    AttrObj,
    AttributeValue,
    Attributes,
    ClassNames,
    CommonAttributes,
    JsxChildren,
    JsxRenderable,
    SpecialAttributes,
    Stringable,
    StyleObject,
} from './htmlspec/attributes/ElementAttributes'

export type {Stringable}
export type PlainObject = Record<PropertyKey, unknown>
export type {ClassNames, StyleObject, AttributeValue, AttrKvPair, AttrArr, AttrObj, Attributes}

export type UnkFn = (...args: unknown[]) => unknown
export type AnyFn = (...args: any[]) => any

/**
 * @experimental
 */
export type HtmlSafe = { __html: string }

export type {JsxRenderable, JsxChildren}
export type {SpecialAttributes}
export type {CommonAttributes, AnyAttributes}

// export type JsxFn = (tag: string, props: AttrObj, children:undefined|JsxhtmlChildren) => JsxhtmlElement
export type JsxComponent<P=AnyAttributes> = ((props: P) => JsxNode) & {displayName?: string, name?: string}

export type FlatString =  string | Iterable<string>

export interface StringChildren { children: FlatString }
export interface ChildrenOnly { children: JsxChildren }

// export type JsxhtmlConstructor = (...args: ConstructorParameters<typeof JsxhtmlElement>) => JsxhtmlElement
