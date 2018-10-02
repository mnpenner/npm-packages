import React from 'react';
import corgi from '@/images/corgi.jpg';
import ExternalLink from '../ExternalLink';
import styled from 'react-emotion';

const Img = styled.img`
    max-width: 100%;
`

export default function Home() {
    return <>
        <Img src={corgi}/>
        <p>This version brought to your by corgis. <ExternalLink href="https://pixabay.com/en/welsh-corgi-dog-pet-doggy-animal-1581119/">Image</ExternalLink> by Michel van der Vegt.</p>
    </>
}