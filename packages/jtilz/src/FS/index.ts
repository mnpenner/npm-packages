import {URL} from 'url';
import FileSystem = require('fs');
import Path = require('path');
import {flatten} from '../Arr';
import {promisify} from '../Lang/promise';
import {filterAsync} from '../Col';
import {Stats} from 'fs';


export interface ReadOptions {
    encoding?: string|null,
    flag?: string,
}


export interface WriteOptions {
    encoding?: string|null,
    mode?: number,
    flag?: string,
}

export type FileDescriptor = number;

export const readFile: <T extends Buffer|string=Buffer>(path: string|Buffer|URL|FileDescriptor, options?: ReadOptions|string) => Promise<T> 
    = promisify(FileSystem.readFile);
export const writeFile: (file: string|Buffer|FileDescriptor, data: string|Buffer|Uint8Array, options?: WriteOptions|string) => Promise<void> 
    = promisify<void>(FileSystem.writeFile);
export const readText = (file: string) => readFile<string>(file, {encoding: 'utf8'});
export const readJson = (file: string) => readText(file).then(x => JSON.parse(x));
const _readDir = promisify<string[]>(FileSystem.readdir);
export const readDir = (path: string) => _readDir(path).then(entries => entries.map(e => Path.join(path, e)));
export const fileStat: (path: string|Buffer|URL) => Promise<Stats> 
    = promisify<Stats>(FileSystem.stat);
const _fileAccess = promisify<void>(FileSystem.access);
export const fileAccess = (path: string|Buffer|URL, mode: number) => _fileAccess(path, mode).then(() => true, err => {
    // if file does not exist or permission is denied, return false, otherwise throw
    if(err.code === 'ENOENT' || err.code === 'EACCES') {
        return false;
    }
    throw err;
});
export const fileExists = (file: string|Buffer|URL) => fileAccess(file, FileSystem.constants.F_OK);
export const deleteFile: (path: string|Buffer|URL) => Promise<void> 
    = promisify<void>(FileSystem.unlink);


export function getFiles(dir: string, recursive = true): Promise<string[]> {
    return readDir(dir).then(paths => {
        if(recursive) {
            return Promise.all(paths.map(path => fileStat(path)
                .then(stat => stat.isDirectory() ? getFiles(path, recursive) : [path])
            )).then(flatten);
        }

        return filterAsync(paths, p => fileStat(p).then(s => s.isFile()));
    });
}
