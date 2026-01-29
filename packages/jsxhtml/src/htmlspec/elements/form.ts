import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface FormAttributes extends CommonAttributes<ElementForTag<'form'>> {
    /**
     * The  accepted by the server.
     * The specification allows a single case-insensitive value of `"UTF-8"`, reflecting the ubiquity of this encoding (historically multiple character encodings could be specified as a comma-separated or space-separated list).
     */
    'accept-charset'?: string
    /**
     * Indicates whether input elements can by default have their values automatically completed by the browser. `autocomplete` attributes on form elements override it on `<form>`. Possible values:
     */
    autocomplete?: string
    /**
     * The name of the form. The value must not be the empty string, and must be unique among the `form` elements in the forms collection that it is in, if any. The name becomes a property of the , , and  objects, containing a reference to the form element.
     */
    name?: string
    /**
     * Controls the annotations and what kinds of links the form creates. Annotations include [`external`](/en-US/docs/Web/HTML/Reference/Attributes/rel#external), [`nofollow`](/en-US/docs/Web/HTML/Reference/Attributes/rel#nofollow), [`opener`](/en-US/docs/Web/HTML/Reference/Attributes/rel#opener), [`noopener`](/en-US/docs/Web/HTML/Reference/Attributes/rel#noopener), and [`noreferrer`](/en-US/docs/Web/HTML/Reference/Attributes/rel#noreferrer). Link types include [`help`](/en-US/docs/Web/HTML/Reference/Attributes/rel#help), [`prev`](/en-US/docs/Web/HTML/Reference/Attributes/rel#prev), [`next`](/en-US/docs/Web/HTML/Reference/Attributes/rel#next), [`search`](/en-US/docs/Web/HTML/Reference/Attributes/rel#search), and [`license`](/en-US/docs/Web/HTML/Reference/Attributes/rel#license). The [`rel`](/en-US/docs/Web/HTML/Reference/Attributes/rel) value is a space-separated list of these enumerated values.
     */
    rel?: string
    /**
     * The URL that processes the form submission. This value can be overridden by a [`formaction`](/en-US/docs/Web/HTML/Reference/Elements/button#formaction) attribute on a , [`<input type="submit">`](/en-US/docs/Web/HTML/Reference/Elements/input/submit), or [`<input type="image">`](/en-US/docs/Web/HTML/Reference/Elements/input/image) element. This attribute is ignored when `method="dialog"` is set.
     */
    action?: string
    /**
     * If the value of the `method` attribute is `post`, `enctype` is the [MIME type](https://en.wikipedia.org/wiki/Mime_type) of the form submission. Possible values:
     */
    enctype?: string
    /**
     * The [HTTP](/en-US/docs/Web/HTTP) method to submit the form with.
     * The only allowed methods/values are (case insensitive):
     */
    method?: string
    /**
     * This Boolean attribute indicates that the form shouldn't be validated when submitted. If this attribute is not set (and therefore the form **_is_** validated), it can be overridden by a [`formnovalidate`](/en-US/docs/Web/HTML/Reference/Elements/button#formnovalidate) attribute on a , [`<input type="submit">`](/en-US/docs/Web/HTML/Reference/Elements/input/submit), or [`<input type="image">`](/en-US/docs/Web/HTML/Reference/Elements/input/image) element belonging to the form.
     */
    novalidate?: string
    /**
     * Indicates where to display the response after submitting the form. It is a name/keyword for a _browsing context_ (for example, tab, window, or iframe). The following keywords have special meanings:
     */
    target?: string
}

