/* eslint-disable */
// ripped from react-dom

import {StyleObject} from './jsx-types'

// https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/react-dom-bindings/src/shared/hyphenateStyleName.js#L10
const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;

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
function hyphenateStyleName(name: string): string {
    return name
        .replace(uppercasePattern, '-$1')
        .toLowerCase()
        .replace(msPattern, '-ms-');
}

/**
 * Memoizes the return value of a function that accepts one string argument.
 */
function memoizeStringOnly(callback: (arg: string) => string) {
    const cache = new Map<string,string>()
    return function(this: unknown, string: string) {
        let value = cache.get(string)
        if(value === undefined) {
            value = callback.call(this, string)
            cache.set(string, value)
        }
        return value
    }
}

const makeStyleName = memoizeStringOnly(hyphenateStyleName)


// https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/react-dom-bindings/src/shared/isUnitlessNumber.js#L13
/**
 * CSS properties which accept numbers but are not in units of "px".
 */
const unitlessNumbers = new Set([
    'animationIterationCount',
    'aspectRatio',
    'borderImageOutset',
    'borderImageSlice',
    'borderImageWidth',
    'boxFlex',
    'boxFlexGroup',
    'boxOrdinalGroup',
    'columnCount',
    'columns',
    'flex',
    'flexGrow',
    'flexPositive',
    'flexShrink',
    'flexNegative',
    'flexOrder',
    'gridArea',
    'gridRow',
    'gridRowEnd',
    'gridRowSpan',
    'gridRowStart',
    'gridColumn',
    'gridColumnEnd',
    'gridColumnSpan',
    'gridColumnStart',
    'fontWeight',
    'lineClamp',
    'lineHeight',
    'opacity',
    'order',
    'orphans',
    'scale',
    'tabSize',
    'widows',
    'zIndex',
    'zoom',
    'fillOpacity', // SVG-related properties
    'floodOpacity',
    'stopOpacity',
    'strokeDasharray',
    'strokeDashoffset',
    'strokeMiterlimit',
    'strokeOpacity',
    'strokeWidth',
    'MozAnimationIterationCount', // Known Prefixed Properties
    'MozBoxFlex', // TODO: Remove these since they shouldn't be used in modern code
    'MozBoxFlexGroup',
    'MozLineClamp',
    'msAnimationIterationCount',
    'msFlex',
    'msZoom',
    'msFlexGrow',
    'msFlexNegative',
    'msFlexOrder',
    'msFlexPositive',
    'msFlexShrink',
    'msGridColumn',
    'msGridColumnSpan',
    'msGridRow',
    'msGridRowSpan',
    'WebkitAnimationIterationCount',
    'WebkitBoxFlex',
    'WebKitBoxFlexGroup',
    'WebkitBoxOrdinalGroup',
    'WebkitColumnCount',
    'WebkitColumns',
    'WebkitFlex',
    'WebkitFlexGrow',
    'WebkitFlexPositive',
    'WebkitFlexShrink',
    'WebkitLineClamp',
]);


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
    if(isNonNumeric || value === 0 || unitlessNumbers.has(name)) {
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
    for(const [styleName,styleValue] of Object.entries(styles)) {
        if(styleValue != null) {
            serialized += makeStyleName(styleName) + ':'
            serialized += makeStyleValue(styleName, styleValue) + ';'
        }
    }
    return serialized
}

