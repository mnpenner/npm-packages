import * as React from 'react'
import {hot} from 'react-hot-loader'
import ComboBox from './ComboBox';

const App = () => <>
    <h1>ComboBox</h1>
    <select>
        <option value="1">Apple</option>
        <option value="2">Pear</option>
        <option value="3">Orange</option>
        <option value="4">Grape</option>
        <option value="5">Banana</option>
    </select>
    <ComboBox/>
    {Array(10).fill(null).map((_,i) => <p key={i}>sneaky paragraph below.</p>)}
</>

export default hot(module)(App)