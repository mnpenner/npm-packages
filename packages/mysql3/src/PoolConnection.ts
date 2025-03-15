import {DefaultValueType, makeOptions, QueryParam, QueryResult} from './util'
import mariadb from 'mariadb'
import {sql, SqlFrag} from './sql'

export class PoolConnection<TDefaultValue = DefaultValueType> {

    constructor(private readonly conn: mariadb.PoolConnection) {
    }

    query<TRecord = Record<string, TDefaultValue>>(query: QueryParam): Promise<QueryResult<TRecord>> {
        const opts = makeOptions(query)
        return this.conn.query({
            ...opts,
            sql: opts.sql.toSqlString(),
        })
    }

    exec: ((...args: Parameters<typeof PoolConnection.prototype.query>) => Promise<mariadb.UpsertResult>) = this.query.bind(this) as any

    async row<TRecord extends object = Record<string, TDefaultValue>>(query: QueryParam): Promise<TRecord | null> {
        const opts = makeOptions(query)
        const rows = await this.query<TRecord>({
            ...opts,
            sql: sql`select *
                     from (${opts.sql}) _query
                     limit 1`
        })
        return rows.length ? rows[0] : null
    }

    async col<TValue = TDefaultValue>(query: SqlFrag): Promise<TValue[]> {
        const rows = await this.query<any[]>({
            sql: query,
            rowsAsArray: true,
        })
        if(!rows.length) return []
        if(rows[0].length !== 1) throw new Error(`Expected exactly 1 field in query, got ${rows[0].length}`)
        return rows.map(r => r[0])
    }

    async value<TValue = TDefaultValue>(query: SqlFrag): Promise<TValue | null> {
        const row = await this.row<TValue[]>({
            sql: query,
            rowsAsArray: true,
        })
        if(!row) return null
        if(row.length !== 1) throw new Error(`Expected exactly 1 field in query, got ${row.length}`)
        return row[0]
    }

    async exists(query: SqlFrag): Promise<boolean> {
        return Boolean(await this.value<0 | 1>(sql`select exists(${query})`))
    }

    async count(query: SqlFrag) {
        return Number(await this.value(sql`select count(*) from (${query}) _query`))
    }

    async* stream<TRecord extends object = Record<string, TDefaultValue>>(query: SqlFrag): AsyncGenerator<TRecord, unknown, undefined> {
        let results: TRecord[] = []
        let resolve: () => void
        let promise = new Promise<void>(r => resolve = r)
        let done = false

        this.conn.queryStream(query.toSqlString())
            .on('error', err => {
                throw err
            })
            .on('data', row => {
                results.push(row)
                resolve()
            })
            .on('end', () => {
                done = true
                resolve()
            })

        for(; ;) {
            await promise
            yield* results
            if(done) break
            promise = new Promise(r => resolve = r)
            results = []
        }
        return
    }

    release() {
        return this.conn.release()
    }

    beginTransaction() {
        return this.conn.beginTransaction()
    }

    commit() {
        return this.conn.commit()
    }

    rollback() {
        return this.conn.rollback()
    }

    ping() {
        return this.conn.ping()
    }

    changeUser() {
        return this.conn.changeUser()
    }

    close() {
        return this.conn.end()
    }

    destroy() {
        return this.conn.destroy()
    }

    get serverVersion() {
        return this.conn.serverVersion()
    }

    get isValid() {
        return this.conn.isValid()
    }
}
