import type {DefaultValueType, QueryResult} from './util';
import { zip} from './util'
import mariadb from 'mariadb'
import type {SqlFrag} from './sql'
import {PoolConnection} from './PoolConnection'

export class ConnectionPool<TDefaultValue = DefaultValueType> {

    constructor(private readonly pool: mariadb.Pool) {
    }

    async getConnection() {
        return new PoolConnection<TDefaultValue>(await this.pool.getConnection())
    }

    private _fwd<K extends keyof typeof PoolConnection.prototype>(method: K): typeof PoolConnection.prototype[K] {
        return (async (...args: any[]) => {
            const conn = await this.getConnection()
            try {
                return await (conn[method] as any)(...args)
            } finally {
                conn.release()  // TODO: what if release fails? should we at least log something?
            }
        }) as any
    }

    query = this._fwd('query')  // FIXME: type is not exporting correctly
    exec = this._fwd('exec')
    row = this._fwd('row')
    col = this._fwd('col')
    value = this._fwd('value')
    exists = this._fwd('exists')
    count = this._fwd('count')

    async* stream<TRecord extends object = Record<string, TDefaultValue>>(query: SqlFrag): AsyncGenerator<TRecord, unknown, undefined> {
        const conn = await this.getConnection()
        try {
            yield* conn.stream(query)
        } finally {
            conn.release()
        }
        return
    }

    // close = this.pool.end.bind(this.pool)
    close() {
        return this.pool.end()
    }

    async transaction<TReturn>(callback: (conn: PoolConnection<TDefaultValue>) => Promise<TReturn>): Promise<TReturn>;
    async transaction<TUnionResults = Record<string, TDefaultValue>>(sqlFrags: SqlFrag[]): Promise<QueryResult<TUnionResults>[]>;
    async transaction<TResult>(callback: any): Promise<any> {
        if(Array.isArray(callback)) {
            return this.transaction<any>(async conn => {
                const results = await Promise.allSettled(callback.map(sql => conn.query(sql)))
                if(results.some(r => r.status === 'rejected')) {
                    const errors = zip(callback, results).map((x, i) => ({
                        index: i,
                        query: x[0],
                        result: x[1],
                    })).filter(r => r.result.status === 'rejected')
                    throw Error(`${errors.length} quer${errors.length === 1 ? 'y' : 'ies'} failed:${errors.map(err => `\n[${err.index}] ${err.query.toSqlString()} :: ${(err.result as any).reason}`).join('')}`)
                }
                return results.map(r => (r as any).value)
            })
        }

        const conn = await this.getConnection()
        try {
            await conn.beginTransaction()
            let result: TResult
            try {
                result = await callback(conn)
            } catch(err) {
                await conn.rollback()
                throw err
            }
            await conn.commit()
            return result
        } finally {
            await conn.release()
        }
    }


    get activeConnections() {
        return this.pool.activeConnections()
    }

    get totalConnections() {
        return this.pool.totalConnections()
    }

    get idleConnections() {
        return this.pool.idleConnections()
    }

    get taskQueueSize() {
        return this.pool.taskQueueSize()
    }
}

export async function createPool<T = DefaultValueType>(config: mariadb.PoolConfig) {
    return new ConnectionPool<T>(mariadb.createPool({
        // bigIntAsNumber: true,
        dateStrings: true,
        ...config,
    }))
}
