import {Props} from './types'

function BlueBox(props: Props) {
    return (
        <div class="cr-blue-box">
            {props.children}
        </div>
    )
}



import {Elysia} from 'elysia'
import {html} from './elysia-plugin'

new Elysia()
    .use(html())
    .get('/', () => {
        let inject = '<b>  i\'nj\ne"ct   </b>'
        let obj = {bar: 'baz', quux: [1, 2]}

        let list = ['foo', 'bar', 'baz']
        const one = 1
        const two = 2
        const three = 3

        return <>
            <style>
                .cr-blue-box {'{'}
                    border:  5px solid blue;
                    border-radius: 5px;
                }
            </style>
            <div>
                <ol class={[{foo: true}, 'bar']}>
                    <li>{one}</li>
                    <li>{two}</li>
                    <li id={inject}>{three}</li>
                    <li>{inject}</li>
                </ol>
                <input id="fooput" type="text" data-foo={obj} bar={obj} />
                <input type="checkbox" checked data-target={true} />
                <p style={{'color': 'red', 'border': '1px solid blue', 'paddingTop': 5, 'padding-bottom': '10px', 'paddingLeft': 0}}>bacon {'&'} cheese</p>
                <BlueBox>hello world</BlueBox>

                <ul>
                    {list.map(li => (
                        <li>{li}</li>
                    ))}
                </ul>

                {3.14159265358979323846264338327950288419716}
                {7 / 3}

            </div>
            <script>
                console.log(document.getElementById('fooput').dataset.foo)
            </script>
        </>
    })
    .listen(3000)
