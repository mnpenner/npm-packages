import * as React from 'react';

export default function ActionButton(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
    return <button type="button" {...props}/>
}