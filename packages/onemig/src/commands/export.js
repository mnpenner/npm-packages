import dump from '../dump';
import Chalk from 'chalk';
import * as async from '../util/async';
import objHash from 'object-hash';
import * as fs from '../util/fs';
import {dbNames} from '../napi';
import {getStruct} from '../schema/struct';
import InputOption from '../console/InputOption';
import Konsole from '../util/Konsole';
import Path from 'path';
import napi from '../napi';
import DatabaseWrapper from '../mysql/DatabaseWrapper';
import spinners from '../spinners';

export default {
    name: "export",
    description: "Export the current database schema",
    options: [
        {
            name: 'output-dir',
            alias: 'o',
            description: "Output directory. Will overwrite any files.",
            value: InputOption.Required,
            default: 'out',
        },
        {
            name: 'host',
            alias: 'h',
            description: "Connect to the MySQL server on the given host.",
            value: InputOption.Required,
        },
        {
            name: 'port',
            alias: 'P',
            description: "The TCP/IP port number to use for the connection.",
            value: InputOption.Required,
        },
        {
            name: 'user',
            alias: 'u',
            description: "The MySQL user name to use when connecting to the server.",
            value: InputOption.Required,
        },
        {
            name: 'password',
            alias: 'p',
            description: "The password to use when connecting to the server.",
            value: InputOption.Required,
        },
    ],
    async execute(args, opts) {
        const dbVars = napi.sharedDbVars('migrations');
        
        const conn = new DatabaseWrapper({
            host: opts.host || dbVars.host,
            port: opts.port || dbVars.port,
            user: opts.user || dbVars.login,
            password: opts.password || dbVars.password,
        });
        
        try {
            const allTables = Object.create(null);
            
            const dbStream = conn.stream(`
                SELECT SCHEMA_NAME 'name' 
                FROM information_schema.SCHEMATA 
                WHERE SCHEMA_NAME IN (?)
                    #LIMIT 10
                `,[dbNames]);

            const kon = new Konsole;
            let si = 0;
            
            for await(const db of dbStream) {
                const tblStream = conn.stream(`SELECT 
                        TABLE_NAME 'name'
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLES.TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'
                            #AND TABLE_NAME='outreach_report_consumption_drugs_methods'
                        `, [db.name]);

                for await(const tbl of tblStream) {
                    kon.rewrite(`${spinners.dots12.frames[si]} ${db.name}.${tbl.name}`);
                    si = (si+1)%spinners.dots12.frames.length;
                    
                    const tblDef = await getStruct(conn,db.name,tbl.name);
                    

                    const tblHash = objHash(tblDef);
                    if(!allTables[tbl.name]) {
                        allTables[tbl.name] = {};
                    }
                    if(!allTables[tbl.name][tblHash]) {
                        allTables[tbl.name][tblHash] = {
                            databases: [db.name],
                            ...tblDef,
                        }
                    } else {
                        allTables[tbl.name][tblHash].databases.push(db.name);
                    }
                }
            }
            
            kon.clear();

            await async.forEach(Object.keys(allTables), async tblName => {
                let json = {
                    name: tblName,
                    versions: Object.values(allTables[tblName]),
                };
                const filename = Path.join(opts.outputDir,`tables/${tblName}.json`);
                await fs.writeText(filename, JSON.stringify(json, null, 4));
                console.log(`wrote ${Chalk.underline(filename)}`);
            });
        } finally {
            conn.close();
        }
    }
}

