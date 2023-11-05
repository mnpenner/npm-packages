# JsxHtml

JSX to HTML. No hydration.

## Example

```tsx
console.log(<div class={["foo","bar"]} style={{color:'blue',border:1}}>Hello JsxHtml</div>.toString())
// <div class="foo bar" style="color:blue;border:1px;">Hello JsxHtml</div>
```

## Intro

JsxHtml is a jsx-runtime that converts your compiled JSX into static HTML. That means no virtual DOM, no hydration, no excess markup, no client-side JavaScript needed.

Unlike [other libraries](https://github.com/kitajs/html#the-safe-attribute), JsxHtml is *safe by default*. That means all your variables, whether they're used in attribute values or content, will be escaped.

```tsx
const userGeneratedContent = `I'm "going" to <script>alert('hack')</script> you!`
const breakQuote = `break"quote`
console.log(<div class={breakQuote}>{userGeneratedContent}</div>.toString())
// <div class="break&quot;quote">I'm "going" to &lt;script>alert('hack')&lt;/script> you!</div>
```

JsxHtml returns `JsxNode` objects with a `.toString()` method instead of returning a string directly. This has the benefit that it allows us to know which bits are safe or unsafe. For example, we can rewrite the above snippet to use JSX in the variable instead of a string:

```tsx
const serverContent = <>I'm "going" to <script>alert('hack')</script> myself!</>
console.log(<div>{serverContent}</div>.toString())
// <div>I'm "going" to <script>alert('hack')</script> myself!</div>
```

Notice how the output is *not* escaped now, because the `serverContent` is JSX and can't have been written by a user. There is no need to annotate which pieces are "safe" or "unsafe" which is prone to human error.

## Escape Hatch

If you really want to allow unescaped HTML to be rendered out as-is, you can use the `<RawHtml>` component:

```tsx
const html = "HTML <b>generated</b> from some WYSIWYG."
console.log('SAFE: ' + <div>{html}</div>)
console.log('NOT SAFE: ' + <RawHtml>{html}</RawHtml>)
```

```txt
SAFE: <div>HTML &lt;b>generated&lt;/b> from some WYSIWYG.</div>
NOT SAFE: HTML <b>generated</b> from some WYSIWYG.
```

## Setup

Add these options to your `tsconfig.json` or Babel config.

```json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "@mpen/jsxhtml"
    }
}
```

## Elysia Integration

JsxHtml is primarily designed for server-side rendering. It pairs nicely with frameworks such as [Elysia](https://elysiajs.com/), so you can return a block of HTML with no fuss:

```tsx
import {elysiaJsx} from '@mpen/jsxhtml'

new Elysia()
    .use(elysiaJsx())
    .get('/', () => {
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
    .listen(3000)
```
```txt
<!DOCTYPE html><html lang="en"><head><title>Hello JsxHtml</title></head><body>Hi there!</body></html>
```

It should be just as easy to integrate with [Express](https://expressjs.com/) or any other JavaScript server, because JsxHtml compiles to an object with a `.toString()` method -- so if your framework allows you to send a string in the response body, you're good to go.

For reference, so you can see how easy this is, the entire Elysia plugin is this:

```ts
import {isJsxNode} from './jsx-nodes'

export function elysiaJsx() {
    const {Elysia} = require('elysia') as typeof import('elysia')
    return new Elysia()
        .onAfterHandle(({response}) => {
            if(isJsxNode(response)) {
                return new Response(String(response), {
                    headers: {
                        'content-type': 'text/html; charset=utf8'
                    }
                })
            }
        })
}
```

i.e., it's just checking if you're returning a JsxHtml node and then converts the return value to a string and adds the `Content-Type` header.

## Client-side

If you *really* want, you can ship the compiled JSX to the client. It looks like this:

```js
_jsx("div", { children: "hello" });
```

But then you will need to send the `@mpen/jsxhtml/jsx-runtime` to the client too. But then you can render out the HTML in the browser, which will allow for more dynamic behavior, but you won't get reactive elements, hooks, or state management or anything of the sort. If you want that, try [React](https://react.dev/).

## jsx-dev-runtime

JsxHtml includes `jsx-dev-runtime`. There is no equivalent [React Dev Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi), because again, there is no client-side JS included here, it's just HTML, *but*, we can add some good old-fashioned HTML comments to the output, so you can see which bits of HTML were generated from custom components:

```tsx
function BlueBox(props: CommonProps) {
    return (
        <div class="cr-blue-box">
            {props.children}
        </div>
    )
}

new Elysia()
    .use(elysiaJsx())
    .get('/dev', () => {
        return <BlueBox>box</BlueBox>
    })
```

When using `{"jsx": "react-jsxdev"}`, this will output:

```html
<!--<BlueBox>--><div class="cr-blue-box">box</div><!--</BlueBox>-->
```

When using `{"jsx": "react-jsx"}`, this will output:

```html
<div class="cr-blue-box">box</div>
```
