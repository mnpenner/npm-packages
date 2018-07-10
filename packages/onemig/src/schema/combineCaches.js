import objHash from 'object-hash';
import {addMany} from '../util/set';
import * as async from '../util/async';
import Path from 'path';
import * as fs from '../util/fs';
import Chalk from 'chalk';
import dump from '../dump';


export default async function combineCaches(caches, out) {
    const allTables = Object.create(null);

    for(const tables of caches) {
        // dump(tables);
        for(const tbl of tables.values()) {
            for(let {databases, ...tblDef} of tbl.versions) {
                // TODO: maybe we should normalize the definition before hashing it..?
                const tblHash = objHash(tblDef);
                if(!allTables[tbl.name]) {
                    allTables[tbl.name] = {};
                }
                if(!allTables[tbl.name][tblHash]) {
                    allTables[tbl.name][tblHash] = {
                        databases: new Set(databases),
                        ...tblDef,
                    }
                } else {
                    allTables[tbl.name][tblHash].databases::addMany(databases);
                }
            }
        }
    }

    await async.forEach(Object.keys(allTables), async tblName => {
        let json = {
            name: tblName,
            versions: Object.values(allTables[tblName]).map(ver => ({
                ...ver,
                databases: Array.from(ver.databases),
            })),
        };
        const filename = Path.join(out,`tables/${tblName}.json`);
        await fs.writeText(filename, JSON.stringify(json, null, 4));
        console.log(`Wrote ${Chalk.underline(filename)}`);
    });
}