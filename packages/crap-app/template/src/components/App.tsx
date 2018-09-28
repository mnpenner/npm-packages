import * as React from 'react'
import {hot} from 'react-hot-loader'
import styled from 'react-emotion';

const Crap = styled.span`
    font-style: italic;
    color: red;
`

const App = () => <>
    <h1>Hello World</h1>
    <p>Welcome to your <Crap>crappy</Crap> app.</p>
</>

export default hot(module)(App)