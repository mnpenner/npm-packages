#!/usr/bin/env node
import conn from './db';
import dump from './dump';
import {Application} from './console';
import {readDir} from './util/fs';

process.on('unhandledRejection', dump);

async function __main__() {
    const app = new Application();

    for(let cmd of await readDir(`${__dirname}/commands`)) {
        app.add(require(cmd).default);
    }
    
    await app.run();
    
}

__main__().catch(async err => {
    dump(err);
    await conn.close();
});
