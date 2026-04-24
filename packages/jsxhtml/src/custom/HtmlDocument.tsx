/** @jsxImportSource @mpen/jsxhtml */
import type {HtmlAttributes} from '../htmlspec/elements'
import {DocType} from './DocType'

/**
 * `<!DOCTYPE html><html ...>{children}</html>`
 */
export function HtmlDocument({children, ...htmlAttrs}: HtmlAttributes) {
    return <>
        <DocType html />
        <html {...htmlAttrs}>
        {children}
        </html>
    </>
}
