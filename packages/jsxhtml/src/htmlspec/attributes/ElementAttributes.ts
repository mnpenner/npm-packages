import type {Class} from 'classcat'
import type {Properties, PropertiesHyphen} from 'csstype'
import type {AllGlobalAttributes} from './GlobalAttributes'
import type {Override} from '../../util-types'

export interface Stringable {
    toString(): string
}

export type ClassNames = Class
export type StyleObject = Properties | PropertiesHyphen
export type AttributeValue = Stringable | StyleObject | ClassNames
export type AttrKvPair = [name: string, value: AttributeValue]
export type AttrArr = AttrKvPair[]
export type AttrObj = Record<string, AttributeValue>
export type Attributes = AttrObj | AttrArr

export type JsxRenderable = any
export type JsxChildren = JsxRenderable | Iterable<JsxRenderable>

export interface SpecialAttributes {
    children?: JsxChildren
    style?: StyleObject | string
    /**
     * CSS class.
     */
    class?: ClassNames
}

export interface CommonAttributes<E=HTMLElement> extends Override<AllGlobalAttributes<E>, SpecialAttributes> {}

export interface AnyAttributes<E=HTMLElement> extends Override<AttrObj, CommonAttributes<E>> {}
