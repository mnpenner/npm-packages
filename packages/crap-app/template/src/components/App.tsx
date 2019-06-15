import {lazy, ReactNode} from 'react'
import {hot} from 'react-hot-loader/root'
import styled, {css} from 'styled-components';
// import {BrowserRouter, Switch, Route, Link, RouteProps, RouteComponentProps} from 'react-router-dom';
import {Router, Link, Match, MatchRenderFn, MatchRenderProps, RouteComponentProps} from "@reach/router";
import Container from './Container';
import ErrorBoundary from './ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import Boundary from "./Boundary";
// import ScrollTop from './helpers/scrollTop';


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
    component: React.ComponentType<any>;
}

const routes: IRoute[] = [
    {
        title: "Home",
        path: '/',
        component: lazy(() => import(/* webpackPrefetch: true */ './pages/Home')),
    },
    {
        title: "About",
        path: '/about',
        component: lazy(() => import(/* webpackPrefetch: true */ './pages/About')),
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

// https://github.com/reach/router/issues/141#issuecomment-457872496
type RouteProps = {component: React.ComponentType<any>} & RouteComponentProps;

const Route: React.FunctionComponent<RouteProps> = ({ component: Component, ...rest }) => <Boundary><Component {...rest} /></Boundary>

const App = () => (
    <Boundary>

            {/*<ScrollTop>*/}
                <Container>
                    <h1>Hello World</h1>

                    <p>Welcome to your <Crap>crappy</Crap> app.</p>

                    <TabList>
                        {routes.map(({path, exact, title}, idx) => (
                            <Match key={idx} path={path}>
                                {(routeProps: MatchRenderProps<any>) => (
                                    <TabItem>
                                        {routeProps.match ? <ActiveTab>{title}</ActiveTab> : <TabLink to={path}>{title}</TabLink>}
                                    </TabItem>
                                )}
                            </Match>
                        ))}
                    </TabList>

                    <TabContent>
                        <Router>
                            {routes.map(({path, component}) => (
                                <Route key={path} path={path} component={component}/>
                            ))}
                        </Router>
                    </TabContent>
                </Container>
            {/*</ScrollTop>*/}

    </Boundary>

)

export default hot(App)