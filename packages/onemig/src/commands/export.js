import dump from '../dump';
import {readJson,writeJson} from '../util/fs';
import SshClient from '../ssh-client';
import Moment from 'moment';
import Chalk from 'chalk';
// import conn from '../db';
// import {Command} from '../console';

const FIND_DATE_FORMAT = 'ddd DD MMM YYYY HH:mm:ss'; // https://stackoverflow.com/questions/848293/shell-script-get-all-files-modified-after-date#comment84300127_848327

export default {
    name: "export",
    description: "Export the current database schema",
    async execute(args, opts) {
        const {default: dbClient} = await import('../db');
        
        try {
            const dataDir = await dbClient.query("select @@datadir").fetchValue();
            let metaData;
            const metaFile = `${__dirname}/../../cache/meta.json`;
            try {
                metaData = await readJson(metaFile);
                
            } catch(err) {
                console.log(`cache file ${Chalk.underline(metaFile)} not found`);
                metaData = {};
            }
            
            const findCmd = ['sudo','find',dataDir,'-mindepth',2,'-maxdepth','2','-type','f'];
            
            if(metaData.lastRun) {
                const lastRun = Moment(metaData.lastRun);
                console.log(`struct was last exported on ${Chalk.underline(lastRun.format('DD-MMM-YYYY @ h:mma'))}`);
                findCmd.push('-newermt', lastRun.format(FIND_DATE_FORMAT))
            }
            
            findCmd.push('-name','*.frm','-print0');

            metaData.lastRun = Date.now();

            const sshClient = new SshClient({
                host: 'dev-sql',
                // debug: dump,
            });
            let frmFiles = await sshClient.exec(findCmd);
            sshClient.close();
            
            if(!frmFiles.length) {
                console.log('cache is already up to date');
                return;
            }
            
            frmFiles = frmFiles.slice(0,-1).split('\0');

            dump(frmFiles);
            
            const frmFilesRegex = /([^/]+)\/([^/]+)\.frm/;

            let modifiedTables = frmFiles.map(f => {
                const [, db, tbl] = frmFilesRegex.exec(f);
                return [db, tbl];
            });
            
            dump(modifiedTables);
            
            await writeJson(metaFile,metaData);
        } finally {
            dbClient.close();
        }
    }
}