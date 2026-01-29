import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface FormAttributes extends CommonAttributes<ElementForTag<'form'>> {
    /**
     * The character encoding accepted by the server. The specification allows a single case-insensitive value of `"UTF-8"`, reflecting the ubiquity of this encoding (historically multiple character encodings could be specified as a comma-separated or space-separated list).
     */
    'accept-charset'?: string
    /**
     * Controls whether the browser may automatically complete the value and provides guidance about the type of information expected in the field.
     *
     * Possible values:
     * - off
     * - on
     */
    autocomplete?: 'on' | 'off' | string
    /**
     * The name of the form. The value must not be the empty string, and must be unique among the `form` elements in the forms collection that it is in, if any. The name becomes a property of the Window, Document, and document.forms objects, containing a reference to the form element.
     */
    name?: string
    /**
     * The **`rel`** attribute defines the relationship between a linked resource and the current document. Valid on link, a, area, and form, the supported values depend on the element on which the attribute is found.
     */
    rel?: string
    /**
     * The URL that processes the form submission. This value can be overridden by a `formaction` attribute on a button, `<input type="submit" `, or `<input type="image" ` element. This attribute is ignored when `method="dialog"` is set.
     */
    action?: string
    /**
     * If the value of the `method` attribute is `post`, `enctype` is the MIME type of the form submission. Possible values: This value can be overridden by `formenctype` attributes on button, `<input type="submit" `, or `<input type="image" ` elements.
     *
     * Possible values:
     * - application/x-www-form-urlencoded
     * - multipart/form-data
     * - text/plain
     */
    enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'
    /**
     * The HTTP method to submit the form with. The only allowed methods/values are (case insensitive): This value is overridden by `formmethod` attributes on button, `<input type="submit" `, or `<input type="image" ` elements.
     *
     * Possible values:
     * - post
     * - get
     * - dialog
     */
    method?: 'post' | 'get' | 'dialog'
    /**
     * This Boolean attribute indicates that the form shouldn't be validated when submitted. If this attribute is not set (and therefore the form **_is_** validated), it can be overridden by a `formnovalidate` attribute on a button, `<input type="submit" `, or `<input type="image" ` element belonging to the form.
     */
    novalidate?: boolean
    /**
     * Indicates where to display the response after submitting the form. It is a name/keyword for a _browsing context_ (for example, tab, window, or iframe). The following keywords have special meanings: This value can be overridden by a `formtarget` attribute on a button, `<input type="submit" `, or `<input type="image" ` element.
     *
     * Possible values:
     * - _self
     * - _blank
     * - _parent
     * - _top
     * - _unfencedTop
     */
    target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop'

}
