import React from 'react';

export function Link(props: { url: string, children: React.ReactNode, newTab?: boolean}) {
    return <a className='rdo-link' target={props.newTab ? '_blank' : '_self'} href={props.url}>{props.children}</a>
}
