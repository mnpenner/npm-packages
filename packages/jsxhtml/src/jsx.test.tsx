import {expect, it} from 'bun:test'
import {C, DocType} from './custom-components'
import {InputMode} from './htmlspec/GlobalAttributes'

it('handles basic inputs', () => {
    expect(String(<div />)).toEqual('<div></div>')
    expect(String(<input />)).toEqual('<input>')
})

it('supports custom types', () => {
    expect(String(<C>some comment</C>)).toEqual('<!-- some comment -->')
    expect(String(<DocType html />)).toEqual('<!DOCTYPE html>')
})

it('builds class strings', () => {
    expect(String(<span class="cls">x</span>)).toEqual('<span class="cls">x</span>')
    expect(String(<span class={['a', 'b']}>x</span>)).toEqual('<span class="a b">x</span>')
    expect(String(<span class={{a: true, b: false}}>x</span>)).toEqual('<span class="a">x</span>')
    expect(String(<span class={['a', 'a']}>x</span>)).toEqual('<span class="a a">x</span>')
    expect(String(<span class={[false]}>x</span>)).toEqual('<span class="">x</span>')
    expect(String(<span class={[true]}>x</span>)).toEqual('<span class="">x</span>')
    expect(String(<span class={[null, 'c']}>x</span>)).toEqual('<span class="c">x</span>')
})

it('builds style strings', () => {
    expect(String(<span style={{
        borderRight: '2px',
        borderLeft: 0,
        'border-bottom-color': 'red'
    }}>x</span>)).toEqual('<span style="border-right:2px;border-left:0;border-bottom-color:red;">x</span>')
})

it('input mode', () => {
    expect(String(<input inputmode={InputMode.Numeric} />)).toEqual('<input inputmode="numeric">')
})

it('tab index', () => {
    const idx = "7"
    expect(String(<input tabindex={idx} />)).toEqual('<input tabindex="7">')
})

it('anchor', () => {
    expect(String(<a>with children</a>)).toEqual('<a>with children</a>')
    expect(String(<a href={"/foo"} target={'_blank'} />)).toEqual('<a href="/foo" target="_blank"></a>')
})
