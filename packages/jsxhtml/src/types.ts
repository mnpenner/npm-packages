import type JsxhtmlElement from './JsxhtmlElement'

export interface Stringable {
    toString(): string
}

export type PlainObject = Record<PropertyKey, unknown>
export type AttributeValue = Stringable | PlainObject
export type AttrKvPair = [name: string, value: AttributeValue]
export type AttrArr = AttrKvPair[]
export type AttrObj = Record<string, AttributeValue>
export type Attributes = AttrObj | AttrArr

export type UnkFn = (...args: unknown[]) => unknown
export type AnyFn = (...args: any[]) => any

export type HtmlSafe = { __html: string }

export type JsxhtmlNode =
    null
    | undefined
    | false
    | JsxhtmlElement
    | HtmlSafe
    | string
    | number
    | UnkFn
    | Iterable<JsxhtmlNode>

export type JsxhtmlChildren = JsxhtmlNode[]

export type Props = Omit<AttrObj,'children'> & {children?: JsxhtmlNode}

// export type JsxFn = (tag: string, props: AttrObj, children:undefined|JsxhtmlChildren) => JsxhtmlElement
export type Component = (props: Props) => JsxhtmlElement

// export type JsxhtmlConstructor = (...args: ConstructorParameters<typeof JsxhtmlElement>) => JsxhtmlElement
