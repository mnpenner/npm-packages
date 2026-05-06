import { expectType, type Override, type Simplify, type TypeEqual } from './index'
import type { OverrideProps } from './react'

type Props = Override<
    { className?: string; href?: string; keep: number },
    { added: boolean; className?: number; href: never }
>

expectType<
    TypeEqual<Simplify<Props>, { added: boolean; className?: number | undefined; keep: number }>
>(true)

type ReactProps = OverrideProps<'a', { className?: number; href: never; to: string }>

expectType<TypeEqual<'href' extends keyof ReactProps ? true : false, false>>(true)
expectType<number | undefined>({} as ReactProps['className'])
expectType<string>({} as ReactProps['to'])
