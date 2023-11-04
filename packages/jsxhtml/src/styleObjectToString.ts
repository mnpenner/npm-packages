/* eslint-disable */
// ripped from react-dom

import {UnkFn} from './types'

const _uppercasePattern = /([A-Z])/g

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * For CSS style names, use `hyphenateStyleName` instead which works properly
 * with all vendor prefixes, including `ms`.
 */
function hyphenate(string: string): string {
    return string.replace(_uppercasePattern, '-$1').toLowerCase()
}

const msPattern = /^ms-/

/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 */
function hyphenateStyleName(string: string): string {
    return hyphenate(string).replace(msPattern, '-ms-')
}

/**
 * Memoizes the return value of a function that accepts one string argument.
 */
function memoizeStringOnly(callback: (arg: string) => string) {
    let cache: Record<string, unknown> = {}
    return function(this: unknown, string: string) {
        if(!cache.hasOwnProperty(string)) {
            cache[string] = callback.call(this, string)
        }
        return cache[string]
    }
}

const makeStyleName = memoizeStringOnly(function(styleName: string) {
    return hyphenateStyleName(styleName)
})


/**
 * CSS properties which accept numbers but are not in units of "px".
 */

const isUnitlessNumber: Record<string, boolean> = {
    animationIterationCount: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridRow: true,
    gridColumn: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,

    // SVG-related properties
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
}


/**
 * Convert a value into the proper css writable value. The style name `name`
 * should be logical (no hyphens), as specified
 * in `CSSProperty.isUnitlessNumber`.
 *
 * @param {string} name CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @return {string} Normalized style value with dimensions applied.
 */
function makeStyleValue(name: string, value: any): string {
    // Note that we've removed escapeTextForBrowser() calls here since the
    // whole string will be escaped when the attribute is injected into
    // the markup. If you provide unsafe user data here they can inject
    // arbitrary CSS which may be problematic (I couldn't repro this):
    // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
    // This is not an XSS hole but instead a potential CSS injection issue
    // which has lead to a greater discussion about how we're going to
    // trust URLs moving forward. See #2115901

    let isEmpty = value == null || typeof value === 'boolean' || value === ''
    if(isEmpty) {
        return ''
    }

    let isNonNumeric = isNaN(value)
    if(isNonNumeric || value === 0 || (Object.hasOwn(isUnitlessNumber, name) && isUnitlessNumber[name])) {
        return '' + value // cast to string
    }

    if(typeof value === 'string') {
        value = value.trim()
    }
    return value + 'px'
}

/**
 * Serializes a mapping of style properties for use as inline styles:
 *
 *   > createMarkupForStyles({width: '200px', height: 0})
 *   "width:200px;height:0;"
 *
 * Undefined values are ignored so that declarative programming is easier.
 * The result should be HTML-escaped before insertion into the DOM.
 *
 * @param {object} styles
 * @return {?string}
 */
export default function styleObjectToString(styles: StyleObject): string {
    let serialized = ''
    for(let styleName in styles) {
        if(!Object.hasOwn(styles, styleName)) {
            continue
        }
        let styleValue = styles[styleName]
        if(styleValue != null) {
            serialized += makeStyleName(styleName) + ':'
            serialized += makeStyleValue(styleName, styleValue) + ';'
        }
    }
    return serialized
}

export type StyleObject = Record<string, any>
