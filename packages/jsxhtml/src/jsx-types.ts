import type {JsxNode} from './jsx-node'
import type {AllGlobalAttributes} from './htmlspec/GlobalAttributes'
import type {Override} from './util-types'
import type {Class} from 'classcat'
import type {Properties,PropertiesHyphen} from 'csstype'

export interface Stringable {
    toString(): string
}

export type PlainObject = Record<PropertyKey, unknown>
export type ClassNames = Class
export type StyleObject = Properties | PropertiesHyphen
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

export type CommonProps<E=HTMLElement> = Override<AllGlobalAttributes<E>, SpecialProps>

export type AnyAttributes<E=HTMLElement> = Override<AttrObj, CommonProps<E>>

// export type JsxFn = (tag: string, props: AttrObj, children:undefined|JsxhtmlChildren) => JsxhtmlElement
export type JsxComponent<P=AnyAttributes> = ((props: P) => JsxNode) & {displayName?: string, name?: string}

export type FlatString =  string | Iterable<string>

export interface StringChildren { children: FlatString }
export interface ChildrenOnly { children: JsxChildren }

// export type JsxhtmlConstructor = (...args: ConstructorParameters<typeof JsxhtmlElement>) => JsxhtmlElement
