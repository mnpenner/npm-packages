import {JsxNode} from './jsx-node'
import {AllGlobalAttributes} from './htmlspec/GlobalAttributes'
import {Override} from './util-types'

export interface Stringable {
    toString(): string
}

export type PlainObject = Record<PropertyKey, unknown>
export type ClassNames = import('classcat').Class
export type StyleObject = import('csstype').Properties | import('csstype').PropertiesHyphen
export type AttributeValue = Stringable | StyleObject | ClassNames
export type AttrKvPair = [name: string, value: AttributeValue]
export type AttrArr = AttrKvPair[]
export type AttrObj = Record<string, AttributeValue>
export type Attributes = AttrObj | AttrArr

export type UnkFn = (...args: unknown[]) => unknown
export type AnyFn = (...args: any[]) => any

export type HtmlSafe = { __html: string }

export type JsxRenderable = any

export type JsxChildren = JsxRenderable | Iterable<JsxRenderable>

export type SpecialProps = {
    children?: JsxChildren,
    style?: StyleObject | string,
    /**
     * CSS class.
     */
    class?: ClassNames
}

export type CommonProps = Override<AllGlobalAttributes, SpecialProps>

export type AnyAttributes = Override<AttrObj, CommonProps>

// export type JsxFn = (tag: string, props: AttrObj, children:undefined|JsxhtmlChildren) => JsxhtmlElement
export type JsxComponent<P=AnyAttributes> = ((props: P) => JsxNode) & {displayName?: string, name?: string}

export type FlatString =  string | Iterable<string>

export interface StringChildren { children: FlatString }
export interface ChildrenOnly { children: JsxChildren }

// export type JsxhtmlConstructor = (...args: ConstructorParameters<typeof JsxhtmlElement>) => JsxhtmlElement
