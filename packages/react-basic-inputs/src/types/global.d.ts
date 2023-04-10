// Functions
type Fn<TArgs extends ReadonlyArray<unknown> = unknown[], TRet = unknown> = (...args: TArgs[]) => TRet
type AnyFn = (...args: any[]) => any
type EventCallback<T = never> = (ev: T) => void
type VoidFn = () => void

// Objects
type EmptyObject = Record<PropertyKey, never>
type UnknownObject = Record<PropertyKey, unknown>

type Override<Base, Extension, DeleteKeys extends PropertyKey = never> =
    Omit<Base, keyof Extension | DeleteKeys>
    & Extension
type RequiredKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Required<Pick<Type, Key>>
type OptionalKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>

type nil = null | undefined
type NonNil<T> = NonNullable<T>

type OverrideProps<Base, Extension, DeleteKeys extends PropertyKey = never> = Override<import('react').ComponentPropsWithoutRef<Base>, Extension, DeleteKeys>

// https://stackoverflow.com/a/74881032/65387
type MapKeyType<M> = M extends Map<infer K, any> ? K : never;
type MapValueType<M> = M extends Map<any, infer V> ? V : never;

type ArrayType<T extends any[]> = T[number]


// https://stackoverflow.com/a/69062575/65387 ->
// https://stackoverflow.com/questions/65805600/type-union-not-checking-for-excess-properties#answer-65805753 ->
// https://stackoverflow.com/questions/52677576/typescript-discriminated-union-allows-invalid-state/52678379#52678379
type _UnionKeys<T> = T extends T ? keyof T : never;

type _StrictUnionHelper<T, TAll> =
    T extends any
        ? T & Partial<Record<Exclude<_UnionKeys<TAll>, keyof T>, never>> : never;

// See also: https://github.com/ts-essentials/ts-essentials#xor
type XOR<T> = _StrictUnionHelper<T, T>
