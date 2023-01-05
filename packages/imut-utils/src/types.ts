// Functions
export type Fn<TArgs extends ReadonlyArray<unknown>=unknown[], TRet=unknown> = (...args: TArgs[]) => TRet
export type AnyFn = (...args: any[]) => any
export type EventCallback<T=never> = (ev: T) => void
export type VoidFn = () => void
export type FP<T> = (a:T) => T

// Objects
export type EmptyObject = Record<PropertyKey, never>
export type AnyObject = Record<PropertyKey, unknown>
export type nil = null|undefined
export type ValueOf<T> = T[keyof T];

export type NonNil<T> = Exclude<T,nil>  // N.B. This is slightly different than NonNullable<T>

export type Override<Base, Extension, DeleteKeys extends PropertyKey=never> = Omit<Base, keyof Extension|DeleteKeys> & Extension
export type RequiredKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Required<Pick<Type, Key>>
export type OptionalKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>

// https://stackoverflow.com/a/74881032/65387
export type MapKeyType<M> = M extends Map<infer K, any> ? K : never;
export type MapValueType<M> = M extends Map<any, infer V> ? V : never;

