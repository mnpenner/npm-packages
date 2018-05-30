import ssh2 from 'ssh2';
import {fsa} from './util/fs';
import shellescape from 'shell-escape';
import os from 'os';
import dump from './dump';
import Chalk from 'chalk';

export default class SshClient {
    
    constructor(options) {
        const userInfo = os.userInfo();
        options = {
            username: userInfo.username,
            privateKey: '~/.ssh/id_rsa',
            ...options,
        };
        this._client = new Promise(async (resolve,reject) => {
            const client = new ssh2.Client;
            if(typeof options.privateKey === 'string' && /^([~/]|[a-z]:)/i.test(options.privateKey)) {
                if(options.privateKey.startsWith('~')) {
                    options.privateKey = userInfo.homedir + options.privateKey.slice(1);
                }
                options.privateKey = await fsa.readFile(options.privateKey, {encoding: 'utf8'})
            }
            client
                .on('ready',() => resolve(client))
                .on('error',reject)
                .connect(options)
        })
    }
    
    async close() {
        const client = await this._client;
        client.end();
    }
    
    async exec(cmd) {
        const client = await this._client;
        if(Array.isArray(cmd)) {
            cmd = shellescape(cmd);
        }
        console.log(Chalk.magenta(cmd));
        return new Promise((resolve,reject) => {
            client.exec(cmd, (err, stream) => {
                if(err) return reject(err);
                let stdout = [];
                let stderr = [];
                stream
                    .on('close', (code, signal) => code === 0
                        ? resolve(Buffer.concat(stdout).toString())
                        : reject(new Error(`Command exited with status code ${code}: ${Buffer.concat(stderr).toString()}`)))
                    .on('data', data => stdout.push(data))
                    .stderr.on('data', data => stderr.push(data))
            })
            
        })
    }
}