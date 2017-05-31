import FileSystem from 'fs';
import Path from 'path';
import {filterAsync, flatten} from './array';
import {promisify} from './promise';

// export * as default from './fs';
export const readFile = promisify(FileSystem.readFile);
export const writeFile = promisify(FileSystem.writeFile);
export const readText = file => readFile(file, {encoding: 'utf8'});
export const readJson = file => readText(file).then(x => JSON.parse(x));
const readDirAsync = promisify(FileSystem.readdir);
export const readDir = path => readDirAsync(path).then(entries => entries.map(e => Path.join(path, e)));
export const fileStat = promisify(FileSystem.stat);
export const fileAccess = promisify(FileSystem.access);
export const fileExists = file => fileAccess(file, FileSystem.F_OK);

/**
 *
 * @param {string} dir
 * @param {Boolean} recursive
 * @returns {Promise.<string[]>}
 */
export async function getFiles(dir, recursive = true) {
    let paths = await readDir(dir);

    if(recursive) {
        return Promise.all(paths.map(path => fileStat(path)
            .then(stat => stat.isDirectory() ? getFiles(path, recursive) : [path])
        )).then(flatten);
    }

    return paths::filterAsync(p => fileStat(p).then(s => s.isFile()));
}

