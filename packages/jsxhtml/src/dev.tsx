/// <reference lib="dom" />
import type {AnyAttributes} from './jsx-types'
import {Elysia} from 'elysia'
import {C, HtmlDocument, RawHtml} from './custom-components'
import {isJsxNode} from './jsx-node'

function BlueBox(props: AnyAttributes) {
    return (
        <div class="cr-blue-box">
            {props.children}
        </div>
    )
}


const PORT = 3000

new Elysia()
    .onAfterHandle(({response, set}) => {
        if(isJsxNode(response)) {
            // logFull(response)

            return new Response(String(response), {
                headers: {
                    'content-type': 'text/html; charset=utf-8'
                }
            })
        }
    })
    .get('/', () => {
        let inject = '<b>  i\'nj\ne"ct   </b>'
        let obj = {bar: 'baz', quux: [1, 2]}

        let list = ['foo', 'bar', 'baz']
        const one = 1
        const two = 2
        const three = 3

        return <HtmlDocument lang="en">
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
                <script>
                    console.log('{'<'}/script{'>'}');
                    console.log(document.getElementById('fooput').dataset.foo)
                </script>
                <script>{/* not supported */}
                    {/*<div>Div inside script.</div>*/}
                    const serverData = "{'server string'}";
                    const serverData2 = {{server:'object'}};
                </script>
                <script>"one"</script>
                <script children={String.raw`
                    console.log("this should work")
                `}/>
            </body>
        </HtmlDocument>
    })
    .get('/two', () => {
        return (
            <HtmlDocument lang="en">
                <head>
                    <title>Hello JsxHtml</title>
                </head>
                <body>
                    Hi there!
                </body>
            </HtmlDocument>
        )
    })
    .get('/hack', () => {
        const userGeneratedContent = `I'm "going" to <script>alert('hack')</script> you!`
        const breakQuote = `break"quote`
        return <div class={breakQuote}>{userGeneratedContent}</div>
    })
    .get('/dev', () => {
        return <BlueBox>box</BlueBox>
    })
    .listen(PORT)
console.log(`Listening on http://localhost:${PORT}`)

function externalFunc(this: HTMLButtonElement) {
    console.log(this)
}

// console.log(<div class={["foo","bar"]} style={{color:'blue',border:1}}>Hello JsxHtml</div>.toString())

// const serverContent = <>I'm "going" to <script>alert('hack')</script> myself!</>
// console.log(<div>{serverContent}</div>.toString())

// const html = "HTML <b>generated</b> from some WYSIWYG."
// console.log('SAFE: ' + <div>{html}</div>)
// console.log('NOT SAFE: ' + <RawHtml>{html}</RawHtml>)
