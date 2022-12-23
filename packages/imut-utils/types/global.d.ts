// Functions
type Fn<TArgs extends ReadonlyArray<unknown>=unknown[], TRet=unknown> = (...args: TArgs[]) => TRet
type AnyFn = (...args: any[]) => any
type EventCallback<T=never> = (ev: T) => void
type VoidFn = () => void

// Objects
type EmptyObject = Record<PropertyKey, never>
type AnyObject = Record<PropertyKey, unknown>

type Override<Base, Extension, DeleteKeys extends PropertyKey=never> = Omit<Base, keyof Extension|DeleteKeys> & Extension
type RequiredKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Required<Pick<Type, Key>>
type OptionalKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>

type OverrideProps<Base, Extension, DeleteKeys extends PropertyKey=never> = Override<import('react').ComponentPropsWithoutRef<Base>,Extension,DeleteKeys>

// https://stackoverflow.com/a/74881032/65387
type MapKeyType<M> = M extends Map<infer K, any> ? K : never;
type MapValueType<M> = M extends Map<any, infer V> ? V : never;
