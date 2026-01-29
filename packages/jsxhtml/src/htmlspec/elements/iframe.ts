import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface IframeAttributes extends CommonAttributes<ElementForTag<'iframe'>> {
    allow?: string
    allowfullscreen?: string
    credentialless?: string
    csp?: string
    height?: string
    loading?: string
    name?: string
    privateToken?: string
    referrerpolicy?: string
    sandbox?: string
    src?: string
    srcdoc?: string
    width?: string
}

