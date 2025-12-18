import {describe, expect, test} from 'bun:test'
import {runChain} from './run-chain'
import type {
    AddContext,
    TerminalFn,
    TransformInputFn,
    TransformInputImplicitReturnFn,
    TransformOutputFn
} from './run-chain-types'



describe(runChain.name,  () => {
    const doubleItAndPassItOn: TransformInputFn<number,number> = (ctx,next) => next(ctx*2)
    const doubleItAndImplicitlyPassItOn: TransformInputImplicitReturnFn<number> = async(ctx,next) => {await next(ctx*2)}
    const addThreeAndTakeIt: TerminalFn<number,number> = ctx => ctx+3
    const doubleCat: TerminalFn<any,string> = ctx => `${ctx}${ctx}`
    const stringifyInput: TransformInputFn<number,string> = (ctx,next) => next(String(ctx))
    const stringifyOutput: TransformOutputFn<number,string> = async(ctx,next) => String(await next(ctx))
    const modifyContext = (num: number): AddContext<{ data: number }> => ctx => {
        ctx.data = num
    }
    const readContext: TerminalFn<{ data:number },number> = ctx => ctx.data

    test('single fn', async () => {
        expect(await runChain(1, [addThreeAndTakeIt])).toBe(4)
    })

    test('empty chain', async () => {
        expect(await runChain(1, [])).toBeUndefined()
    })

    test('2 fn chain', async () => {
        expect(await runChain(1, [
            doubleItAndPassItOn,
            addThreeAndTakeIt,
        ])).toBe(5)
    })

    test('implicit pass', async () => {
        expect(await runChain(1, [
            doubleItAndImplicitlyPassItOn,
            addThreeAndTakeIt,
        ])).toBe(5)
    })

    test('combo pass', async () => {
        expect(await runChain(1, [
            doubleItAndPassItOn,
            doubleItAndImplicitlyPassItOn,
            addThreeAndTakeIt,
        ])).toBe(7)
    })

    test('short circuit', async () => {
        expect(await runChain(1, [
            addThreeAndTakeIt,
            doubleItAndPassItOn,
        ])).toBe(4)
    })

    test('first fn determines output type', async () => {
        expect(await runChain<number,string>(1, [
            stringifyOutput,
            doubleItAndPassItOn,
            addThreeAndTakeIt,
        ])).toBe("5")
    })

    test('transform input', async () => {
        expect(await runChain(1, [
            doubleItAndPassItOn,
            stringifyInput,
            doubleCat,
        ])).toBe("22")
    })

    test('modify context', async () => {
        expect(await runChain({}, [
            modifyContext(123),
            readContext,
        ])).toBe(123)
    })
})
