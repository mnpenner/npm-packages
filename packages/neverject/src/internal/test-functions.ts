// Helpers for testing. Do not export from index.ts.

import {err, ok, type SyncResult} from '../sync-result.ts'

export function mayFail1(): SyncResult<number,string> { return Math.random() < 1/Math.sqrt(2) ? ok(1) : err('oh no')}
export function mayFail2(): SyncResult<number,string> { return Math.random() < 1/Math.sqrt(2) ? ok(2) : err('err0r')}
