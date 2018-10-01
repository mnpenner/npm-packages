import * as React from 'react'
import {hot} from 'react-hot-loader'
import styled, {css, injectGlobal} from 'react-emotion';
import {BrowserRouter, Switch, Route, Link, RouteProps, RouteComponentProps} from 'react-router-dom';
import Container from './Container';
import ErrorBoundary from './ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';

injectGlobal`
    body {
        background-color: #F6F8FA;
    }
`

const Crap = styled.span`
    font-style: italic;
    color: red;
`

const TabContent = styled.div`
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-top: none;
    padding: .25rem;
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

const CurrentTab = styled.span`
    background-color: #fff;
    border: 1px solid transparent;
    border-color: #dee2e6 #dee2e6 #fff;
    color: #495057;
    padding: .5rem 1rem;
    border-top-left-radius: .25rem;
    border-top-right-radius: .25rem;
    display: block;
`

const NavLink = styled(Link)`
    color: #007bff;
    text-decoration: none;
    padding: .5rem 1rem;
    border: 1px solid transparent;
    display: block;
`


const App = () => (
    <BrowserRouter>
        <ErrorBoundary>
            <Container>
                <h1>Hello World</h1>

                <p>Welcome to your <Crap>crappy</Crap> app.</p>
                
                <TabList>
                    {routes.map(({path, exact, title}, idx) => (
                        <Route key={idx} path={path} exact={exact}>
                            {({match}: RouteComponentProps<any>) => (
                                <TabItem>
                                    {match ? <CurrentTab>{title}</CurrentTab> : <NavLink to={path}>{title}</NavLink>}
                                </TabItem>
                            )}
                        </Route>
                    ))}
                </TabList>

                <TabContent>
                    <Switch>
                        {routes.map(({path, component}, idx) => (
                            <Route key={idx} exact path={path} component={component}/>
                        ))}
                    </Switch>
                </TabContent>
            </Container>
        </ErrorBoundary>
    </BrowserRouter>
)

export default hot(module)(App)