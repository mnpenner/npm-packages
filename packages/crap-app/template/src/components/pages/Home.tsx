import React, {lazy, useState} from 'react';
import corgi from '@/images/choweenie.jpg';
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
        <Img src={corgi}/>
        <p>This version brought to you by this choweenie. <ExternalLink href="https://pixabay.com/photos/chihuahua-choweenie-dog-canine-4334026/">Image</ExternalLink> by
            <ExternalLink href="https://pixabay.com/users/angela_yuriko_smith-6341455/">Angela_Yuriko_Smith</ExternalLink>.</p>
        <ActionButton onClick={() => setShowDialog(true)}>Open Modal 1</ActionButton>
        <ActionButton onClick={openCorgiDialog}>Open Modal 2</ActionButton>
        <ActionButton onClick={() => openDialog(CorgiDialog)}>Open Modal 3</ActionButton>
        {showDialog && <BodyEnd><CorgiDialog close={() => setShowDialog(false)}/></BodyEnd>}
    </>
}

function openCorgiDialog() {
    const unmount = appendComponent(<CorgiDialog close={() => unmount()}/>)
}