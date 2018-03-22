export function queryAll(...args) {
    return this.query(...args).then(([rows, fields]) => rows);
}

export function queryOne(...args) {
    return this.query(...args).then(([[row], fields]) => row);
}

export function queryValue(sql, values, options) {
    return this.query({
        ...options,
        sql,
        values,
        rowsAsArray: true,
    }).then(([[[value]], fields]) => value);
}
