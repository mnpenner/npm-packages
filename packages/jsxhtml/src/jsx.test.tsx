import {expect, it} from 'bun:test'
import {C, DocType} from './custom-components'
import {InputMode} from './htmlspec/attributes/GlobalAttributes'
import {expectType, TypeEqual} from './internal/type-assert'
import {JsxNode} from './jsx-node'

it('is typed', () => {
    const div = <div />
    expectType<TypeEqual<typeof div, JsxNode>>(true)
})

it('handles basic inputs', () => {
    expect(String(<div />)).toEqual('<div></div>')
    expect(String(<input />)).toEqual('<input>')
})

it('supports custom types', () => {
    expect(String(<C>some comment</C>)).toEqual(process.env.NODE_ENV === 'production' ? '' : '<!-- some comment -->')
    expect(String(<DocType html />)).toEqual('<!DOCTYPE html>')
})

it('builds class strings', () => {
    expect(String(<span class="cls">x</span>)).toEqual('<span class=cls>x</span>')
    expect(String(<span class={['a', 'b']}>x</span>)).toEqual('<span class="a b">x</span>')
    expect(String(<span class={{a: true, b: false}}>x</span>)).toEqual('<span class=a>x</span>')
    expect(String(<span class={['a', 'a']}>x</span>)).toEqual('<span class="a a">x</span>')
    expect(String(<span class={[false]}>x</span>)).toEqual('<span class="">x</span>')
    expect(String(<span class={[true]}>x</span>)).toEqual('<span class="">x</span>')
    expect(String(<span class={[null, 'c']}>x</span>)).toEqual('<span class=c>x</span>')
})

it('builds style strings', () => {
    expect(String(<span style={{
        borderRight: '2px',
        borderLeft: 0,
        'border-bottom-color': 'red'
    }}>x</span>)).toEqual('<span style=border-right:2px;border-left:0;border-bottom-color:red;>x</span>')
})

it('input mode', () => {
    expect(String(<input inputmode={InputMode.Numeric} />)).toEqual('<input inputmode=numeric>')
})

it('tab index', () => {
    expect(String(<input tabindex={"7"} />)).toEqual('<input tabindex=7>')
    expect(String(<input tabindex={7} />)).toEqual('<input tabindex=7>')
    expect(String(<input tabindex={7n} />)).toEqual('<input tabindex=7>')
})

it('anchor', () => {
    expect(String(<a>with children</a>)).toEqual('<a>with children</a>')
    expect(String(<a href={"/foo"} target={'_blank'} />)).toEqual('<a href=/foo target=_blank></a>')
})

it('renders exotic attributes', () => {
    expect(String(<input type="color" colorspace="display-p3" />)).toEqual('<input type=color colorspace=display-p3>')
    expect(String(<input type="number" step={1n} min={0n} max={42n} />)).toEqual('<input type=number step=1 min=0 max=42>')
    expect(String(<input type="text" disabled />)).toEqual('<input type=text disabled>')
    expect(String(<details open />)).toEqual('<details open></details>')
    expect(String(<img src="/hero.jpg" width={640} height={"360"} loading="lazy" />)).toEqual('<img src=/hero.jpg width=640 height=360 loading=lazy>')
})
