import type {CommonAttributes} from '../attributes/ElementAttributes'
import type {ElementForTag} from './element-types'

export interface TemplateAttributes extends CommonAttributes<ElementForTag<'template'>> {
    /**
     * Creates a shadow root for the parent element. It is a declarative version of the Element.attachShadow() method and accepts the same enumerated values. Exposes the internal shadow root DOM for JavaScript (recommended for most use cases). Hides the internal shadow root DOM from JavaScript.
     *
     * Possible values:
     * - open
     * - closed
     */
    shadowrootmode?: 'open' | 'closed'
    /**
     * Sets the value of the `clonable` property of a `ShadowRoot` created using this element to `true`. If set, a clone of the shadow host (the parent element of this `<template `) created with Node.cloneNode() or Document.importNode() will include a shadow root in the copy.
     */
    shadowrootclonable?: string
    /**
     * Sets the value of the `delegatesFocus` property of a `ShadowRoot` created using this element to `true`. If this is set and a non-focusable element in the shadow tree is selected, then focus is delegated to the first focusable element in the tree. The value defaults to `false`.
     */
    shadowrootdelegatesfocus?: string
    /**
     * Sets the value of the `referenceTarget` property of a `ShadowRoot` created using this element. The value should be the ID of an element inside the shadow DOM. If set, target references to the host element from outside the shadow DOM will cause the referenced target element to become the effective target of the reference to the host element.
     * @experimental
     */
    shadowrootreferencetarget?: string
    /**
     * Sets the value of the `serializable` property of a `ShadowRoot` created using this element to `true`. If set, the shadow root may be serialized by calling the Element.getHTML() or ShadowRoot.getHTML() methods with the `options.serializableShadowRoots` parameter set `true`. The value defaults to `false`.
     */
    shadowrootserializable?: string
}

