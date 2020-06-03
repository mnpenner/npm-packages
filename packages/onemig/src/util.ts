function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    // https://stackoverflow.com/a/47232883/65387
    const ret: any = {};
    keys.forEach(key => {
        ret[key] = obj[key];
    })
    return ret;
}

/**
 * Takes a string in the format "'foo','bar''baz'" and splits it into an array ["foo", "bar'baz"]
 *
 * @param {string} subject
 * @returns {Array}
 */
export function splitValues(subject: string): string[] {
    if (!subject) {
        return [];
    }
    let terms = [];
    let term = '';
    let quoted = false;
    const q = "'";
    for (let i = 0; i < subject.length;) {
        let ch = subject[i];
        if (ch === q) {
            if (!quoted) {
                quoted = true;
            } else if (subject[i + 1] === q) {
                term += q;
                i += 2;
                continue;
            } else {
                quoted = false;
            }
        } else if (!quoted && ch === ',') {
            terms.push(term);
            term = '';
        } else {
            term += ch;
        }
        ++i;
    }
    terms.push(term);
    return terms;
}

type AsyncFunc<T = any> = (...a: any) => Promise<T>

export function parallel(...funcs: AsyncFunc[]) {
    return Promise.all(funcs.map(call));
}

function isFunction(x: any): x is Function {
    return typeof x === 'function'
}

function call<TRet, TArgs extends any[]>(this: any, fn: TRet | ((...a: TArgs) => TRet), ...args: TArgs): TRet {
    return isFunction(fn) ? fn.call(this, ...args) : fn;
}

export function sortBy<T extends object>(array: T[], prop: keyof T) {
    return array.sort((a, b) => a[prop].localeCompare(b[prop]));
}
