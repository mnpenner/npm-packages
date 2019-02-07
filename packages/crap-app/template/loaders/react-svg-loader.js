const Path = require('path');

module.exports = function(content) {
    this.cacheable && this.cacheable();
    // console.log(Object.entries(this).filter(([k,v]) => typeof v === 'string'));
    return `export default function Svg({title,desc,...props}) { return ${content.replace('>',' {...props}>{title?<title>{title}</title>:null}{desc?<desc>{desc}</desc>:null}')} };
    Svg.displayName = ${JSON.stringify(Path.relative(this.rootContext,this.resourcePath))}`;
}
module.exports.seperable = true;