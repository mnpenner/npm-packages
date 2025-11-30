// Helpers for testing. Do not export from index.ts.

import {err, ok, type SyncResult} from '../sync-result.ts'
import {expectType, type TypeEqual} from './type-assert.ts'

export function mayFail1(): SyncResult<number,string> { return Math.random() < 1/Math.sqrt(2) ? ok(1) : err('oh no')}
export function mayFail2() { return Math.random() < 1/Math.sqrt(2) ? ok(2) : err('err0r')}

expectType<TypeEqual<typeof mayFail1, typeof mayFail2>>(true)

export function alwaysThrows(): never { throw new Error('boom') }
