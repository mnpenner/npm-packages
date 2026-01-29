import type {StandardGlobalAttributes} from './StandardGlobalAttributes'
import type {AriaAttributes} from './AriaAttributes'
import type {GlobalEventHandlers} from './EventHandlers'

export interface AllGlobalAttributes<E=HTMLElement>
    extends StandardGlobalAttributes, AriaAttributes, GlobalEventHandlers<E> {}

export type {StandardGlobalAttributes} from './StandardGlobalAttributes'
export {InputMode} from './StandardGlobalAttributes'
export type {Numeric} from './StandardGlobalAttributes'
export type {AriaAttributes} from './AriaAttributes'
export type {XmlAttributes} from './XmlAttributes'
export type {EventHandlerMap, GlobalEventHandlers} from './EventHandlers'
export type {
    AnyAttributes,
    Attributes,
    AttrArr,
    AttrKvPair,
    AttrObj,
    AttributeValue,
    ClassNames,
    CommonAttributes,
    JsxChildren,
    JsxRenderable,
    SpecialAttributes,
    Stringable,
    StyleObject,
} from './ElementAttributes'
