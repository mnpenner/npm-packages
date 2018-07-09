import {readDir, readJson} from '../util/fs';
import Path from 'path';
import Validator from './validator';
// import dump from '../dump';
import Util from 'util';
import {ciCompare} from '../util/array';
import SpinnerKonsole from '../util/SpinnerKonsole';

export default async function readSchema(dir) {
    const tableFiles = (await readDir(Path.join(dir, 'tables'))).filter(f => f.endsWith('.json'));
    tableFiles.sort(ciCompare);
    const validator = Validator();
    const tables = new Map;
    const errors = [];
    const kon = new SpinnerKonsole;
    
    for(let filename of tableFiles) {
        kon.rewrite(`Reading "${filename}"`);
        const tbl = await readJson(filename);
        const ajvErrors = validator.validate(tbl);
        if(ajvErrors) {
            errors.push(`"${filename}" contains validation errors:\n${Util.inspect(ajvErrors,{depth:10,maxArrayLength:100})}`);
        }
        if(tables.has(tbl.name)) {
            errors.push(`Duplicate table definition found for "${tbl.name}" in ${filename}; previously found in ${tables.get(tbl.name).filename}`);
        } else {
            tables.set(tbl.name, {...tbl, filename});
        }
        // out.push({...tbl, filename});
    }
    
    kon.clear();
    
    if(errors.length) {
        throw new Error(errors.join("\n\n"));
    }
    
    return tables;
}