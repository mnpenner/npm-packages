import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface Props {
    children: React.ReactNode
}

export default class BodyEnd extends React.Component<Props> {
    el: HTMLElement

    constructor(props) {
        super(props);
        this.el = document.createElement('div');
        this.el.style.display = 'contents';
    }

    componentDidMount() {
        document.body.appendChild(this.el);
    }

    componentWillUnmount() {
        document.body.removeChild(this.el);
    }

    render() {
        return ReactDOM.createPortal(
            this.props.children,
            this.el,
        );
    }
}