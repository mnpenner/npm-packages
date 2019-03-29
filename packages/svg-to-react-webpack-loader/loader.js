const Path = require('path');
const htmlparser = require('htmlparser2')
const toJs = require('js-serialize');
const stdAttrs = require('./std-attrs');

// TODO: put static part of SVG into a const outside of the function for performance.
// https://babeljs.io/docs/en/babel-plugin-transform-react-constant-elements

module.exports = function(content) {
    const loader = this;
    loader.cacheable && loader.cacheable();
    const callback = loader.async();
    const sb = ["import {createElement as e} from 'react';\n",'const C=({title,desc,...props})=>'];
    let svgOpen = false;

    const parser = new htmlparser.Parser({
        onopentag(tagName, attrs) {
            const isSvg = tagName.toLowerCase() === 'svg';
            if(isSvg) svgOpen = true;
            if(!svgOpen) return;
            if(attrs.hasOwnProperty('style')) {
                throw new Error(`Sorry, "style" attributes are not presently supported (requires parsing CSS)`)
            }
            for(let attrName of Object.keys(attrs)) {
                if(stdAttrs.hasOwnProperty(attrName) && attrName !== stdAttrs[attrName]) {
                    if(attrs.hasOwnProperty(stdAttrs[attrName])) {
                        loader.emitWarning(new Error(`<${tagName}> has both "${attrName}" and "${stdAttrs[attrName]}" attributes`));
                    } else {
                        attrs[stdAttrs[attrName]] = attrs[attrName];
                        delete attrs[attrName];
                    }
                }
            }

            if(!isSvg) sb.push(',');
            sb.push(`e(`,toJs(tagName));
            let attrCode = toJs(attrs);
            if(isSvg) attrCode = `Object.assign(${attrCode},props)`;
            sb.push(',',attrCode);
            if(isSvg) sb.push(',',['title', 'desc'].map(a => `${a}!=null?e(${toJs(a)},null,${a}):null`).join(','));
        },
        onclosetag(name) {
            if(!svgOpen) return;
            sb.push(')');
            if(name === 'svg') {
                svgOpen = false;
            }
        },
        ontext(text) {
            text = text.trim();
            if(text.length) {
                sb.push(',', toJs(text));
            }
        },
        onerror(err) {
            callback(err);
        },
        onend() {
            if(process.env.NODE_ENV !== 'production') {
                sb.push(`;\nC.displayName=${toJs(Path.relative(loader.rootContext, loader.resourcePath))}`)
            }
            sb.push(';\nexport default C;')
            const svg = sb.join('');
            // console.log(svg);
            callback(null, svg)
        }
    }, {decodeEntities: false, recognizeSelfClosing: true, lowerCaseTags: false})

    parser.write(content)
    parser.end()
}

module.exports.seperable = true;

