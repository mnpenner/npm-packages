import React, {ErrorInfo, ReactNode} from 'react';

export interface Props {
    children: ReactNode
}
export interface State {
    error: null|Error
    errorInfo: null|ErrorInfo
}

export default class ErrorBoundary extends React.Component<Props,State> {

    state = {error: null, errorInfo: null};

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
    }

    render() {
        if (this.state.errorInfo) {
            return (
                <div>
                    <h2>Something went wrong.</h2>
                    <pre>
                        <code>
                            {String(this.state.error)}
                            // @ts-ignore
                            {this.state.errorInfo.componentStack}
                        </code>
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}