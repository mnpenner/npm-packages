import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NavLink, Router, useUrlPath } from '../src'
import routes from './routes'
import * as routesGen from './routes.gen'

function CurrentPath() {
    const path = useUrlPath()
    return (
        <div className="card">
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Current pathname</div>
                    <div>
                        <code>{path}</code>
                    </div>
                </div>
                <div className="nav">
                    <NavLink activeClass="active" className="pill" to={routesGen.home()}>
                        Home
                    </NavLink>
                    <NavLink activeClass="active" className="pill" to={routesGen.login()}>
                        Login
                    </NavLink>
                    <NavLink
                        activeClass="active"
                        className="pill"
                        to={routesGen.match({ id: '123' })}
                    >
                        Match 123
                    </NavLink>
                    <NavLink
                        activeClass="active"
                        className="pill"
                        to={routesGen.match({ id: 'a/b' })}
                    >
                        Match a/b (encoded)
                    </NavLink>
                    <NavLink
                        activeClass="active"
                        className="pill"
                        to={routesGen.blogPost({ id: 123 })}
                    >
                        Blog 123
                    </NavLink>
                    <NavLink
                        activeClass="active"
                        className="pill"
                        to={routesGen.blogPost({ id: 123, title: 'hello world' })}
                    >
                        Blog 123 Title
                    </NavLink>
                    <NavLink activeClass="active" className="pill" to={routesGen.slowLoading()}>
                        Slow Loading
                    </NavLink>
                    <NavLink
                        activeClass="active"
                        className="pill"
                        match="prefix"
                        to={routesGen.fetchLoading()}
                    >
                        Fetch Loading
                    </NavLink>
                    <NavLink
                        activeClass="active"
                        className="pill"
                        to={routesGen.kitchenSink({
                            foo: 'a/b',
                            baz: 'c',
                            splat: ['x', 'y'],
                        })}
                    >
                        KitchenSink
                    </NavLink>
                </div>
            </div>
        </div>
    )
}

function Layout() {
    return (
        <div className="app">
            <div className="card">
                <h1 style={{ margin: 0 }}>rerouter examples</h1>
                <div style={{ opacity: 0.8, marginTop: 8 }}>
                    Client-only dev server using <code>bun --hot examples/index.html</code>.
                </div>
            </div>

            <CurrentPath />

            <div className="card">
                <Router routes={routes} loading={<div>Loading route...</div>} />
            </div>
        </div>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Layout />
    </StrictMode>,
)
