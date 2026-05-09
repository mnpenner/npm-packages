import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NavLink, type NavLinkProps, Router, useUrlPath } from '../src'
import routes from './routes'
import * as routesGen from './routes.gen'

function PillNavLink(props: Omit<NavLinkProps, 'activeClass' | 'className' | 'match'>) {
    return <NavLink activeClass="active" className="pill" match="prefix" {...props} />
}

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
                    <PillNavLink to={routesGen.home()}>Home</PillNavLink>
                    <PillNavLink to={routesGen.login()}>Login</PillNavLink>
                    <PillNavLink to={routesGen.match({ id: '123' })}>Match 123</PillNavLink>
                    <PillNavLink to={routesGen.match({ id: 'a/b' })}>
                        Match a/b (encoded)
                    </PillNavLink>
                    <PillNavLink to={routesGen.blogPost({ id: 123 })}>Blog 123</PillNavLink>
                    <PillNavLink to={routesGen.blogPost({ id: 123, title: 'hello world' })}>
                        Blog 123 Title
                    </PillNavLink>
                    <PillNavLink to={routesGen.slowLoading()}>Slow Loading</PillNavLink>
                    <PillNavLink to={routesGen.fetchLoading()}>Fetch Loading</PillNavLink>
                    <PillNavLink
                        to={routesGen.kitchenSink({
                            foo: 'a/b',
                            baz: 'c',
                            splat: ['x', 'y'],
                        })}
                    >
                        KitchenSink
                    </PillNavLink>
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
                    Client-only production build served from <code>examples/dist</code>.
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
