// ASYNC:
export {allSettled, allSettledObj, allOk, allOkObj} from './all-settled.ts'
export {callAsync} from './call.ts'
export {wrapAsyncFn} from './wrap-fn.ts'

// SYNC:
export {call} from './call.ts'
export {wrapFn} from './wrap-fn.ts'
export {reject, rejectWithError} from './reject.ts'
export {resolve} from './resolve.ts'
import {isResult} from './type-check.ts'
