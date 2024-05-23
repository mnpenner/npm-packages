import {ComponentProps, ElementType} from 'react'

export function assumeType<T>(_val: any): asserts _val is T { /* no implementation */ }
export function assumeProps<C extends ElementType>(_val: any): asserts _val is ComponentProps<C> {}
