import FileSystem from 'fs';
import Path from 'path';
import {flatten} from './Array';
import {filterAsync} from './Collection';
import {promisify} from './Promise';

// export * as default from './fs';
export const readFile = promisify(FileSystem.readFile);
export const writeFile = promisify(FileSystem.writeFile);
export const readText = file => readFile(file, {encoding: 'utf8'});
export const readJson = file => readText(file).then(x => JSON.parse(x));
const _readDir = promisify(FileSystem.readdir);
export const readDir = path => _readDir(path).then(entries => entries.map(e => Path.join(path, e)));
export const fileStat = promisify(FileSystem.stat);
const _fileAccess = promisify(FileSystem.access);
export const fileAccess = (path, mode) => _fileAccess(path, mode).then(() => true, err => {
    // if file does not exist or permission is denied, return false, otherwise throw
    if(err.code === 'ENOENT' || err.code === 'EACCES') {
        return false;
    }
    throw err;
});
export const fileExists = file => fileAccess(file, FileSystem.constants.F_OK);
export const deleteFile = promisify(FileSystem.unlink);

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

    return filterAsync(paths, p => fileStat(p).then(s => s.isFile()));
}

