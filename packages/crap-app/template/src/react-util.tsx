import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function openDialog(component: React.ReactElement<any>) {
    const container = document.createElement('div');
    container.style.display = 'contents';
    ReactDOM.render(component, container);
    document.body.appendChild(container);
    return function unmount() {
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
    }
}