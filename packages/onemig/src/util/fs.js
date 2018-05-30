import Util from 'util';
import mkdirp from 'make-dir';
import Path from 'path';
import FileSystem from 'fs';

export const fsa = Object.entries(FileSystem).reduce((acc, [k, v]) => {
    if(typeof v === 'function' && /^[a-z]/.test(k) && !k.endsWith('Sync')) {
        acc[k] = Util.promisify(v);
    } else {
        acc[k] = v;
    }
    return acc;
}, Object.create(null));

export const readText = path => fsa.readFile(path, {encoding: 'utf8'});

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