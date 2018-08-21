import * as React from 'react'
import {hot} from 'react-hot-loader'
import Counter from './Counter'
import ComboBox from './ComboBox';

const App = () => (
    <>
        <h1>
            Hello, world.<br/>

        </h1>
        <p>
            <ComboBox/>
        </p>
    </>
)

export default hot(module)(App)