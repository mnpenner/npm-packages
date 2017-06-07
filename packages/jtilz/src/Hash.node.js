import Crypto from 'crypto';

export function md5(buffer, encoding='hex') {
    let hash = Crypto.createHash('md5');
    hash.update(buffer);
    return hash.digest(encoding);
}