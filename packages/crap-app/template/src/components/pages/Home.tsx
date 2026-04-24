import React, {lazy, useState} from 'react';
import imgSrc from '@/images/dog-2617517_640.jpg';
import ExternalLink from '../ExternalLink';
import styled from 'styled-components';
// import ModalDialog from "../ModalDialog";
import CorgiDialog from "./home/CorgiDialog";
import BodyEnd from "../BodyEnd";
import ActionButton from "../ActionButton";
import {appendComponent, openDialog} from "../../react-util";

const Img = styled.img`
    max-width: 100%;
`

export default function Home() {
    const [showDialog, setShowDialog] = useState(false);

    return <>
        <Img src={imgSrc}/>
        <p>This version brought to you by Christmas dog. <ExternalLink href="https://pixabay.com/photos/dog-puppy-pet-animals-christmas-2617517/">Image</ExternalLink> by <ExternalLink href="https://pixabay.com/users/stocksnap-894430/">StockSnap</ExternalLink>.</p>
        <ActionButton onClick={() => setShowDialog(true)}>Open Modal 1</ActionButton>
        <ActionButton onClick={openCorgiDialog}>Open Modal 2</ActionButton>
        <ActionButton onClick={() => openDialog(CorgiDialog)}>Open Modal 3</ActionButton>
        {showDialog && <BodyEnd><CorgiDialog close={() => setShowDialog(false)}/></BodyEnd>}
    </>
}

function openCorgiDialog() {
    const unmount = appendComponent(<CorgiDialog close={() => unmount()}/>)
}
