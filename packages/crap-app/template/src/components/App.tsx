import * as React from 'react'
import {hot} from 'react-hot-loader'
import styled from '@emotion/styled';
import {css} from '@emotion/core';
import {BrowserRouter, Switch, Route, Link, RouteProps, RouteComponentProps} from 'react-router-dom';
import Container from './Container';
import ErrorBoundary from './ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import ScrollTop from './helpers/scrollTop';

const Crap = styled.span`
    font-style: italic;
    color: red;
`

const TabContent = styled.div`
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-top: none;
    padding: .5rem;
`

interface IRoute {
    title: string
    path: string
    exact?: boolean
    replace?: boolean
    component?: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
}

const routes: IRoute[] = [
    {
        title: "Home",
        path: '/',
        exact: true,
        component: Home,
    },
    {
        title: "About",
        path: '/about',
        component: About,
    },
]

const TabList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    border-bottom: 1px solid #dee2e6;
`

const TabItem = styled.li`
    display: inline-block;
    margin-bottom: -1px;
`

const tab = css`
    padding: .5rem 1rem;
    border: 1px solid transparent;
    display: block;
`

const ActiveTab = styled.span`
    ${tab}
    background-color: #fff;
    border-color: #dee2e6 #dee2e6 #fff;
    color: #495057;
    border-top-left-radius: .25rem;
    border-top-right-radius: .25rem;
`

const TabLink = styled(Link)`
    ${tab}
    color: #007bff;
    text-decoration: none;
`

const App = () => (
    <ErrorBoundary>
        <BrowserRouter>
            <ScrollTop>
                <Container>
                    <h1>Hello World</h1>

                    <p>Welcome to your <Crap>crappy</Crap> app.</p>

                    <TabList>
                        {routes.map(({path, exact, title}, idx) => (
                            <Route key={idx} path={path} exact={exact}>
                                {(routeProps: RouteComponentProps) => (
                                    <TabItem>
                                        {routeProps.match ? <ActiveTab>{title}</ActiveTab> : <TabLink to={path}>{title}</TabLink>}
                                    </TabItem>
                                )}
                            </Route>
                        ))}
                    </TabList>

                    <TabContent>
                        <Switch>
                            {routes.map(({path, component: Page}, idx) => (
                                <Route key={idx} exact path={path}>
                                    {(routeProps: RouteComponentProps) => <ErrorBoundary><Page/></ErrorBoundary>}
                                </Route>
                            ))}
                        </Switch>
                    </TabContent>
                </Container>
            </ScrollTop>
        </BrowserRouter>
    </ErrorBoundary>

)

export default hot(module)(App)