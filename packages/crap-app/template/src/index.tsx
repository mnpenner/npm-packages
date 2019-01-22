import React, {StrictMode} from 'react'
import { render } from 'react-dom'
import App from './components/App'
import './stylesheets/main.less';

render(<StrictMode><App/></StrictMode>, document.getElementById('react-root'));