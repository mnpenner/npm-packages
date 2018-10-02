import React, {ErrorInfo, ReactNode} from 'react';
import styled from 'react-emotion';

export interface Props {
    children: ReactNode
}

export interface State {
    error: null | Error
    errorInfo: null | ErrorInfo
}

const ErrorContainer = styled.div`
    font-family: Menlo, Consolas, monospace;
    background-color: #980000;
    color: white;
    padding: 2rem;
`

const ErrorMessage = styled.code`
    font-size: large;
    line-height: 1.2;
    white-space: pre-wrap;
`

const Title = styled.h2`
   font-size: x-large;
`

export default class ErrorBoundary extends React.Component<Props> {

    state: State = {error: null, errorInfo: null};

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
    }

    render() {
        if (this.state.errorInfo) {
            return (
                <ErrorContainer>
                    <Title>Runtime Error</Title>
                    <ErrorMessage>{String(this.state.error)}</ErrorMessage>
                </ErrorContainer>
            );
        }

        return this.props.children;
    }
}