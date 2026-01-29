import type {AnyAttributes} from '../jsx-types'
import {DocType} from './DocType'

/**
 * `<!DOCTYPE html><html ...>{children}</html>`
 */
export function HtmlDocument({children, ...htmlAttrs}: AnyAttributes) {
    return <>
        <DocType html />
        <html {...htmlAttrs}>
        {children}
        </html>
    </>
}
