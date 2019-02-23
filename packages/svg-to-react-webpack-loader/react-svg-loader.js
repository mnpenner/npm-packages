const Path = require('path');
const htmlparser = require('htmlparser2')
const js = require('js-serialize');

module.exports = function(content) {
    const loader = this;
    loader.cacheable && loader.cacheable();
    const callback = loader.async();
    const sb = ['export default function Svg({title,desc,...props}) { return null'];
    let svgOpen = false;

    const parser = new htmlparser.Parser({
        onopentag(name, attrs) {
            if(name === 'svg') {
                svgOpen = true;
            }
            if(svgOpen) {
                if(attrs.hasOwnProperty('class')) {
                    attrs.className = attrs.class;
                    delete attrs.class;
                }
                if(attrs.hasOwnProperty('style')) {
                    throw new Error("Sorry, `style` attributes are not presently supported (requires parsing CSS)")
                }
                let attrCode = js(attrs);
                let contentCode = 'null';
                if(name === 'svg') {
                    attrCode = `Object.assign(${attrCode},props)`;
                    contentCode = ['title','desc'].map(a => `${a}!=null?React.createElement(${js(a)},null,${a}):null`).join(',') + `,${contentCode}`
                }
                sb.push(`||React.createElement(${js(name)},${attrCode},${contentCode}`);
            }
        },
        onclosetag(name) {
            if(svgOpen) {
                sb.push(')');
                if(name === 'svg') {
                    svgOpen = false;
                }
            }
        },
        ontext(text) {
            sb.push('||',js(text));
        },
        onerror(err) {
            callback(err);
        },
        onend() {
            sb.push(`}Svg.displayName=${js(Path.relative(loader.rootContext,loader.resourcePath))}`)
            const svg = sb.join('');
            // console.log(svg);
            callback(null, svg)
        }
    }, {decodeEntities: false, recognizeSelfClosing: true, lowerCaseTags: true})

    parser.write(content)
    parser.end()
}

module.exports.seperable = true;

