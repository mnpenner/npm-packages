import React,{lazy} from 'react';
import corgi from '@/images/corgi.jpg';
import ExternalLink from '../ExternalLink';
import styled from '@emotion/styled';
// import ModalDialog from "../ModalDialog";
import CorgiDialog from "./home/CorgiDialog";
import BodyEnd from "../BodyEnd";
import ActionButton from "../ActionButton";
import {appendComponent, openDialog} from "../../react-util";

const Img = styled.img`
    max-width: 100%;
`

export default class Home extends React.Component {

    state = {
        showDialog: false,
    }

    render() {
        return <>
            <Img src={corgi}/>
            <p>This version brought to you by corgis. <ExternalLink href="https://pixabay.com/en/welsh-corgi-dog-pet-doggy-animal-1581119/">Image</ExternalLink> by Michel van der Vegt.</p>
            <ActionButton onClick={() => this.setState({showDialog: true})}>Open Modal 1</ActionButton>
            <ActionButton onClick={openCorgiDialog}>Open Modal 2</ActionButton>
            <ActionButton onClick={() => openDialog(CorgiDialog)}>Open Modal 3</ActionButton>
            {this.state.showDialog && <BodyEnd><CorgiDialog close={() => this.setState({showDialog: false})}/></BodyEnd>}
        </>
    }
}

function openCorgiDialog() {
    const unmount = appendComponent(<CorgiDialog close={() => unmount()}/>)
}