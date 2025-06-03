/// <reference lib="dom" />
import type {AnyAttributes} from './jsx-types'
import {C, HtmlDocument, RawHtml} from './custom-components'
import {js} from './template-strings'

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


console.log((<HtmlDocument lang="en">
    <head>
        <title>Hello JsxHtml</title>
    </head>
    {/*<style> {'a'}</style>*/}
    <style>
        .cr-blue-box {'{'}
        border: 5px solid blue;
        border-radius: 5px;
        {'}'}
    </style>
    <style children={String.raw`
                .numbers {
                    color: blue;
                }
            `} />
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
                <li id={inject}>{three}</li>
                <li>{inject}</li>
            </ol>
            <input disabled={true} value="Disabled input" style={"foo"} class="whatever" />
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
        <div>
            <button onClick={() => console.log(`You clicked ${event.offsetX}, ${event.offsetY}`)}>Event XY
            </button>
            <button onClick={externalFunc}>External1</button>
            <button onClick={externalFunc}>External2</button>
            <button onClick={() => console.log("hello")}>Hello quotes</button>
        </div>
        <script>{js`
                    console.log('</script>'}');
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
</HtmlDocument>).toString())
