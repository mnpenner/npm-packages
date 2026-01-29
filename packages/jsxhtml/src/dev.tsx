/// <reference lib="dom" />
import type {AnyAttributes} from './jsx-types'
import {C, HtmlDocument, RawHtml} from './custom-components'
import {css, js} from './template-strings'
import Path from 'path'


let inject = '<b>  i\'nj\ne"ct   </b>'
let hack = '</script>'
let safe = js`"not escaped"`
let obj = {bar: 'baz', quux: [1, 2]}

let list = ['foo', 'bar', 'baz']
const one = 1
const two = 2
const three = 3

function BlueBox(props: AnyAttributes) {
    return (
        <div class="cr-blue-box">
            {props.children}
        </div>
    )
}

function externalFunc(this: HTMLButtonElement) {
    console.log(this)
}


// @ts-ignore
// @ts-ignore
const jsxNode = <HtmlDocument lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Hello JsxHtml</title>
    </head>
    {/*<style> {'a'}</style>*/}
    <style>{css`
        .cr-blue-box {
            border: 5px solid blue;
            border-radius: 8px;
            corner-shape: bevel;
            padding: 6px;
            background-color: #edfbff;
        }
    `}</style>
    <style children={css`
        .numbers {
            color: blue;
        }

        #${inject} {
            background-color: yellow;
            color: brown;
        }
    `}/>
    <body >
        <C children="hello comment" />
        <C>
            Hello &lt; secret comment
            Multi-line {'-->'}
        </C>
        <div>
            <ol class={[{foo: true}, 'bar']}>
                <li>{one}</li>
                <li>{two}</li>
                <li>{three}</li>
                <li>{inject}</li>
            </ol>
            <input disabled={true} value="Disabled input" style={"foo"} class="whatever" />
            {/* @ts-expect-error Unrecognized attr */}
            <input id="fooput" type="text" data-foo={obj} bar={obj} />
            <input type="checkbox" checked data-target={true} />
            <p style={{
                'color': 'red',
                'border': '1px solid blue',
                'paddingTop': '5px',
                'padding-bottom': '10px',
                'paddingLeft': 0,
            }}>bacon {'&'} cheese</p>
            <BlueBox>hello world</BlueBox>

            <ul>
                {list.map(li => (
                    <li>{li}</li>
                ))}
            </ul>
        </div>
        <div class="numbers">
            {3.14159265358979323846264338327950288419716}<br />
            {7 / 3}<br />
            {NaN}<br />
            {1 / -0}<br />
            {3e50}<br />
        </div>
        <RawHtml children="Hello <b>bold</b> world" />
        <div id={inject}>I should be styled</div>
        <div>
            <button onclick={(ev: MouseEvent) => console.log(`You clicked ${ev.offsetX}, ${ev.offsetY}`)}>Event XY
            </button>
            {/* @ts-expect-error TS18048: event is possibly undefined */}
            <button onclick={() => console.log(`You clicked ${event.offsetX}, ${event.offsetY}`)}>Global Event
            </button>
            <button onclick={externalFunc}>External1</button>
            <button onclick={externalFunc}>External2</button>
            <button onclick={() => console.log("hello")}>Hello quotes</button>
        </div>
        <script>{js`
                    console.log('</script>');
                    console.log(document.getElementById('fooput').dataset.foo)
                `}</script>

        <script>{js`
                    const inject = ${inject};
                    const hack = ${hack};
                    const safe = ${safe};
                    const list = ${list};
                    const obj = ${obj};
                `}</script>


        <script children={js`
                    console.log("this should work")
                `}/>
    </body>
</HtmlDocument>

const html = jsxNode.toString()

console.log(`================\n${html}\n================\n`)

const outputFile = Path.normalize(`${__dirname}/../dist/dev.html`)
await Bun.write(outputFile, html)
console.log(`Wrote ${outputFile}`)
