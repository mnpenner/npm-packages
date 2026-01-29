import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface BodyAttributes extends CommonAttributes<ElementForTag<'body'>> {
    /**
     * Function to call after the user has printed the document.
     */
    onafterprint?: string
    /**
     * Function to call when the user requests printing of the document.
     */
    onbeforeprint?: string
    /**
     * Function to call when the document is about to be unloaded.
     */
    onbeforeunload?: string
    /**
     * Function to call when the document loses focus.
     */
    onblur?: string
    /**
     * Function to call when the document fails to load properly.
     */
    onerror?: string
    /**
     * Function to call when the document receives focus.
     */
    onfocus?: string
    /**
     * Function to call when the fragment identifier part (starting with the hash (`'#'`) character) of the document's current address has changed.
     */
    onhashchange?: string
    /**
     * Function to call when the preferred languages changed.
     */
    onlanguagechange?: string
    /**
     * Function to call when the document has finished loading.
     */
    onload?: string
    /**
     * Function to call when the document has received a message.
     */
    onmessage?: string
    /**
     * Function to call when the document has received a message that cannot be deserialized.
     */
    onmessageerror?: string
    /**
     * Function to call when network communication has failed.
     */
    onoffline?: string
    /**
     * Function to call when network communication has been restored.
     */
    ononline?: string
    /**
     * Function to call when you navigate across documents, when the previous document is about to unload.
     */
    onpageswap?: string
    /**
     * Function to call when the browser hides the current page in the process of presenting a different page from the session's history.
     */
    onpagehide?: string
    /**
     * Function to call when a document is first rendered, either when loading a fresh document from the network or activating a document.
     */
    onpagereveal?: string
    /**
     * Function to call when the browser displays the window's document due to navigation.
     */
    onpageshow?: string
    /**
     * Function to call when the user has navigated session history.
     */
    onpopstate?: string
    /**
     * Function to call when the document has been resized.
     */
    onresize?: string
    /**
     * Function to call when a JavaScript Promise is handled late.
     */
    onrejectionhandled?: string
    /**
     * Function to call when the storage area has changed.
     */
    onstorage?: string
    /**
     * Function to call when a JavaScript Promise that has no rejection handler is rejected.
     */
    onunhandledrejection?: string
}

