

/**
 * Same as a string type but allows autocompletion of literal values
 */
export type AnyString = string & {};

export type Override<Base, Extension, DeleteKeys extends PropertyKey = never> =
    Omit<Base, keyof Extension | DeleteKeys>
    & Extension
