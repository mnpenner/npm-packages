import * as React from 'react';
import * as ReactDOM from 'react-dom';

export default class EndOfBody extends React.Component {

    private readonly container: HTMLElement;

    constructor(props: any) {
        super(props);
        this.container = document.createElement('div');
        this.container.style.display = 'contents';
    }
    
    componentDidMount() {
        document.body.appendChild(this.container);
    }

    componentWillUnmount() {
        document.body.removeChild(this.container);
    }

    render() {
        return ReactDOM.createPortal(
            this.props.children,
            this.container,
        );
    }
}