import React from 'react';

export function EquiBox(props: {
    children: JSX.Element[] | JSX.Element,
    orientation: 'row' | 'column',
    padding?: number,
    gap?: string,
}) {
    const gap = props.gap ?? '0';
    const elems = Array.isArray(props.children) ? props.children : [props.children];

    return (
        <div style={{ display: 'flex', flexDirection: props.orientation, gap }}>
            {elems.map((item, idx) => <div key={idx}>{item}</div>)}
        </div>
    );
}
