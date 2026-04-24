import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {Link, Router, useUrlPath} from '../src'
import routes from './routes'
import * as routesGen from './routes.gen'

function CurrentPath() {
    const path = useUrlPath()
    return (
        <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'}}>
                <div>
                    <div style={{fontSize: 12, opacity: 0.8}}>Current pathname</div>
                    <div>
                        <code>{path}</code>
                    </div>
                </div>
                <div className="nav">
                    <Link className="pill" to={routesGen.home()}>
                        Home
                    </Link>
                    <Link className="pill" to={routesGen.login()}>
                        Login
                    </Link>
                    <Link className="pill" to={routesGen.match({id: '123'})}>
                        Match 123
                    </Link>
                    <Link className="pill" to={routesGen.match({id: 'a/b'})}>
                        Match a/b (encoded)
                    </Link>
                    <Link
                        className="pill"
                        to={routesGen.kitchenSink({
                            foo: 'a/b',
                            baz: 'c',
                            splat: ['x', 'y'],
                        })}
                    >
                        KitchenSink
                    </Link>
                </div>
            </div>
        </div>
    )
}

function Layout() {
    return (
        <div className="app">
            <div className="card">
                <h1 style={{margin: 0}}>react-router examples</h1>
                <div style={{opacity: 0.8, marginTop: 8}}>
                    Client-only dev server using <code>bun --hot examples/index.html</code>.
                </div>
            </div>

            <CurrentPath />

            <div className="card">
                <Router routes={routes} />
            </div>
        </div>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Layout />
    </StrictMode>,
)
