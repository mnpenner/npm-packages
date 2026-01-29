import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BodyAttributes extends CommonAttributes<ElementForTag<'body'>> {
    /** onafterprint attribute. */
    onafterprint?: string
    /** onbeforeprint attribute. */
    onbeforeprint?: string
    /** onbeforeunload attribute. */
    onbeforeunload?: string
    /** onblur attribute. */
    onblur?: string
    /** onerror attribute. */
    onerror?: string
    /** onfocus attribute. */
    onfocus?: string
    /** onhashchange attribute. */
    onhashchange?: string
    /** onlanguagechange attribute. */
    onlanguagechange?: string
    /** onload attribute. */
    onload?: string
    /** onmessage attribute. */
    onmessage?: string
    /** onmessageerror attribute. */
    onmessageerror?: string
    /** onoffline attribute. */
    onoffline?: string
    /** ononline attribute. */
    ononline?: string
    /** onpageswap attribute. */
    onpageswap?: string
    /** onpagehide attribute. */
    onpagehide?: string
    /** onpagereveal attribute. */
    onpagereveal?: string
    /** onpageshow attribute. */
    onpageshow?: string
    /** onpopstate attribute. */
    onpopstate?: string
    /** onresize attribute. */
    onresize?: string
    /** onrejectionhandled attribute. */
    onrejectionhandled?: string
    /** onstorage attribute. */
    onstorage?: string
    /** onunhandledrejection attribute. */
    onunhandledrejection?: string
}

