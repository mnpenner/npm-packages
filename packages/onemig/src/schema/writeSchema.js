import * as async from '../util/async';
import Path from 'path';
import * as fs from '../util/fs';
import Chalk from 'chalk';
import {pick} from '../util/object';


export default async function writeSchema(schema, dir) {
    if(schema instanceof Map) {
        for(let [tblName,tbl] of schema.entries()) {
            tbl = pick(tbl, ['name', 'versions']);
            if(tblName !== tbl.name) throw new Error("Something's amiss");
            const filename = Path.join(dir,`tables/${tblName}.json`);
            await fs.writeText(filename, JSON.stringify(tbl, null, 4));
            console.log(`Wrote ${Chalk.underline(filename)}`);
        }
    } else {
        throw new Error("Schema is supposed to be map");
        await async.forEach(Object.keys(schema), async tblName => {
            let json = {
                name: tblName,
                versions: Object.values(schema[tblName]).map(ver => ({
                    ...ver,
                    databases: Array.from(ver.databases),
                })),
            };
            const filename = Path.join(dir, `tables/${tblName}.json`);
            await fs.writeText(filename, JSON.stringify(json, null, 4));
            console.log(`Wrote ${Chalk.underline(filename)}`);
        });
    }
}