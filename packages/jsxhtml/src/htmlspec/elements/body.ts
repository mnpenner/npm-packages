import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BodyAttributes extends CommonAttributes<ElementForTag<'body'>> {
    onafterprint?: string
    onbeforeprint?: string
    onbeforeunload?: string
    onblur?: string
    onerror?: string
    onfocus?: string
    onhashchange?: string
    onlanguagechange?: string
    onload?: string
    onmessage?: string
    onmessageerror?: string
    onoffline?: string
    ononline?: string
    onpageswap?: string
    onpagehide?: string
    onpagereveal?: string
    onpageshow?: string
    onpopstate?: string
    onresize?: string
    onrejectionhandled?: string
    onstorage?: string
    onunhandledrejection?: string
}

