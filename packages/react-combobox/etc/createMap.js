const fs = require('fs');
const readline = require('readline');
const serialize = require('js-serialize');

async function main() {
    const lineReader = readline.createInterface({
        input: fs.createReadStream(`${__dirname}/allkeys.txt`)
    });
    const mapping = {};
    lineReader.on('line', line => {
        line = line.replace(/\s*(#.*)?$/,'');
        if(!line || line.startsWith('@')) return;
        // https://www.unicode.org/reports/tr10/#File_Format
        const [ch,collElement] = line.split(';',2).map(s => s.trimRight());
        const weights = collElement.split('][').map(w => /[0-9A-F]+/.exec(w)[0]).map(hex => parseInt(hex,16)).filter(x => x);
        
        if(weights.length) {
            const cp = parseInt(ch, 16);
            if(cp <= 0x1FFF) { // TypeScript craps out if we make this too large.
                mapping[String.fromCodePoint(cp)] = weights;
            }
        }
        // console.log(charList,weights);
        
        // var result = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec('2016-03-11');
        // console.log(charList,collElement);
        
        // const result = /(?<ch>\S+)\s*;\s*(?<collElement>)/
    })
    
    lineReader.on('close', () => {
        fs.writeFileSync(`${__dirname}/../src/charMap.ts`, `const $: {[ch:string]:number[]} = ${serialize(mapping)};\nexport default $;`,{encoding:'utf8'});
    })
}

main().catch(err => {
    console.error(err);
    process.exit(1);
})