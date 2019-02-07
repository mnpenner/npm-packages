import * as React from 'react';
import styled from '@emotion/styled';
import ActionButton from "./ActionButton";
import Boundary from "./Boundary";

const Backdrop = styled.div`
     position: fixed;
     top: 0;
     right: 0;
     bottom: 0;
     left: 0;
     backdrop-filter: blur(10px);
     background-color: rgba(0,0,0,.50);
     overflow: auto;
`

const Wrap1 = styled.div`
    display: table;
    width: 100%;
    height: 100%;
    text-align: center;
`

const Wrap2 = styled.div`
    vertical-align: middle;
    display: table-cell;
`

const Wrap3 = styled.div`
    margin: 10px;
`

const Dialog = styled.div`
    background-color: white;
    display: inline-block;
    max-width: 300px;
    box-shadow: 2px 2px 5px rgba(0,0,0,.33);
    text-align: initial;
`

const Title = styled.div`
    padding: 5px;
    background-color: #F1F1F1;
`

const Content = styled.div`
    max-height: 200px;
    overflow: auto;
    padding: 5px;
`

const Footer = styled.div`
    padding: 5px;
    background-color: #F1F1F1;
`

export interface Props {
    children: React.ReactNode,
    title: React.ReactNode,
    close: ()=>void,
}

export default function ModalDialog({children,title,close}: Props) {
    return (
        <Backdrop>
            <Wrap1>
                <Wrap2>
                    <Wrap3>
                        <Dialog>
                            <Title>{title}</Title>
                            <Content>
                                <Boundary>
                                    {children}
                                </Boundary>
                            </Content>
                            <Footer>
                                <ActionButton onClick={close}>OK</ActionButton>
                            </Footer>
                        </Dialog>
                    </Wrap3>
                </Wrap2>
            </Wrap1>
        </Backdrop>
    )
}