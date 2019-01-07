import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function appendComponent(component: React.ReactElement<any>) {
    const container = document.createElement('div');
    container.style.display = 'contents';
    ReactDOM.render(component, container);
    document.body.appendChild(container);
    return makeUnmount(container);
}

export function openDialog(Component: React.Factory<any>, propName = 'close') {
    const container = document.createElement('div');
    container.style.display = 'contents';
    ReactDOM.render(React.createElement(Component, {[propName]: makeUnmount(container)}), container);
    document.body.appendChild(container);
}

function makeUnmount(container: Element) {
    return function unmount() {
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
    }
}