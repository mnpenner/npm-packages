import * as React from 'react';

export default function ActionButton({onClick,...props}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
    if(onClick) {
        props.onClick = function onClickEvent(ev) {
            ev.preventDefault();
            return onClick(ev);
        }
    }
    return <button {...props}/>
}