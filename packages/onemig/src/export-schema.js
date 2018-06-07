#!/usr/bin/env node
import $RefParser from 'json-schema-ref-parser';
import Path from 'path';

async function main() {
    const parser = new $RefParser();
    const [file,$ref] = process.argv[2].split('#');
    let schema = require(Path.resolve(file));
    if(schema.__esModule) {
        schema = schema.default;
    }
    schema = await parser.dereference(schema);
    if($ref) {
       schema = await parser.$refs.get('#'+$ref); 
    }
    console.log(JSON.stringify(schema,null,4));
}

main().catch(err => {
    process.stderr.write(`${err}\n`);
    process.exit(1);
});
