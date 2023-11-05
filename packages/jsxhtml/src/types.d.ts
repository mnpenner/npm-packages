import type {JsxNode} from './jsx-nodes'
import type {StyleObject} from './styleObjectToString'

export interface Stringable {
    toString(): string
}

export type PlainObject = Record<PropertyKey, unknown>
export type ClassNames = import('classnames').Argument
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

export type CommonProps = Omit<AttrObj, 'children' | 'style' | 'class'> & {
    children?: JsxChildren,
    style?: StyleObject | string,
    class?: ClassNames
}

// export type JsxFn = (tag: string, props: AttrObj, children:undefined|JsxhtmlChildren) => JsxhtmlElement
export type JsxComponent<P=CommonProps> = ((props: P) => JsxNode) & {displayName?: string, name?: string}

export type FlatString =  string | Iterable<string>

export interface StringChildren { children: FlatString }
export interface ChildrenOnly { children: JsxChildren }

// export type JsxhtmlConstructor = (...args: ConstructorParameters<typeof JsxhtmlElement>) => JsxhtmlElement
