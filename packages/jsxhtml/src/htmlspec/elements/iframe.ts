import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'
import type {Numeric} from '../attributes/StandardGlobalAttributes'

export interface IframeAttributes extends CommonAttributes<ElementForTag<'iframe'>> {
    /** allow attribute. */
    allow?: string
    /** allowfullscreen attribute. */
    allowfullscreen?: string
    /** credentialless attribute. */
    credentialless?: string
    /** csp attribute. */
    csp?: string
    /** height attribute. */
    height?: Numeric
    /** loading attribute. */
    loading?: string
    /** name attribute. */
    name?: string
    /** privateToken attribute. */
    privateToken?: string
    /** referrerpolicy attribute. */
    referrerpolicy?: string
    /** sandbox attribute. */
    sandbox?: string
    /** src attribute. */
    src?: string
    /** srcdoc attribute. */
    srcdoc?: string
    /** width attribute. */
    width?: Numeric
}

