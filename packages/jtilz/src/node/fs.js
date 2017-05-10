import FileSystem from 'fs';
import Path from 'path';

import promisify from '../promisify';

// export * as default from './fs';
export const readFile = promisify(FileSystem.readFile);
export const writeFile = promisify(FileSystem.writeFile);
export const readText = file => readFile(file, {encoding: 'utf8'});
export const readJson = file => readText(file).then(x => JSON.parse(x));
export const readDir = promisify(FileSystem.readdir);
export const fileStat = promisify(FileSystem.stat);


export function getFiles(dir) {
    return readDir(dir).then(files => files.map(file => {
        let path = Path.join(dir, file);
        return fileStat(path).then(stat => stat.isDirectory() ? getFiles(path) : path);
    }))
        .then(result => Promise.all(result))
        .then(files => Array.prototype.concat(...files));
}