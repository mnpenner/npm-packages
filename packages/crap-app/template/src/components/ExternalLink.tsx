import React from 'react';

// https://mathiasbynens.github.io/rel-noopener/
export default function ExternalLink(props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) {
    return <a href="" rel="noopener noreferrer" target="_blank" {...props}/>
}