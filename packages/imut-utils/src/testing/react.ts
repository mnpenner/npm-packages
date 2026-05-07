/**
 * @internal
 */
export type Dispatch<A> = (value: A) => void

/**
 * @internal
 */
export type SetStateAction<S> = S | ((prevState: S) => S)

/**
 * @internal
 */
export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
export function useState<S>(initialState: S | (() => S)) {
  let state = typeof initialState === 'function' ? (initialState as () => S)() : initialState
  const dispatch: Dispatch<SetStateAction<S>> = (value) => {
    state = typeof value === 'function' ? (value as (prevState: S) => S)(state) : value
  }

  return [state, dispatch]
}
