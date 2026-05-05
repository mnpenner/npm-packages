export * from './imp/index'

export {
  arrayPush as fpArrayPush,
  arrayPop as fpArrayPop,
  arrayInsert as fpArrayInsert,
  arrayInsertSorted as fpArrayInsertSorted,
  arrayUnshift as fpArrayUnshift,
  arrayDeleteIndex as fpArrayDeleteIndex,
  arrayDeleteOneValue as fpArrayDeleteOneValue,
  arrayDeleteValue as fpArrayDeleteValue,
  arraySelect as fpArraySelect,
  arrayReject as fpArrayReject,
  arraySplice as fpArraySplice,
  arrayFindAndReplace as fpArrayFindAndReplace,
} from './fp/array'

export {
  mapSet as fpMapSet,
  mapUpdate as fpMapUpdate,
  mergeMap as fpMergeMap,
  mapDelete as fpMapDelete,
} from './fp/map'

export { add as fpAdd, sub as fpSub, mult as fpMult, div as fpDiv } from './fp/number'

export {
  shallowMerge as fpShallowMerge,
  relaxedMerge as fpRelaxedMerge,
  objSet as fpObjSet,
} from './fp/object'

export { setCheck as fpSetCheck, setAdd as fpSetAdd, setRemove as fpSetRemove } from './fp/set'
