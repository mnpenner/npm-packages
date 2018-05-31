import Util from 'util';
import mkdirp from 'make-dir';
import Path from 'path';
import FileSystem, {Stats} from 'fs';
import {URL} from "url";
import dump from '../dump';

export const fsa = Object.entries(FileSystem).reduce((acc, [k, v]) => {
    if(typeof v === 'function' && /^[a-z]/.test(k) && !k.endsWith('Sync')) {
        acc[k] = Util.promisify(v);
    } else {
        acc[k] = v;
    }
    return acc;
}, Object.create(null));

export const readText = path => fsa.readFile(path, {encoding: 'utf8', flag: 'r'});
export const readJson = file => readText(file).then(JSON.parse);

export const writeText = (path,contents) => {
    const write = () => fsa.writeFile(path, contents, {encoding: 'utf8'});

    return write().catch(async err => {
        if(err.code === 'ENOENT') {
            await mkdirp(Path.dirname(path));
            return write();
        }
        throw err;
    });
};

export const writeJson = (file,data,options) => writeText(file,JSON.stringify(data,null,'\t'),options);

export const readDir = (path) => fsa.readdir(path).then(entries => entries.map(e => Path.join(path, e)));


// export async function getFiles(dir, recursive = true) {
//     const entries = await readDir(dir);
//     dump(entries);
// }
