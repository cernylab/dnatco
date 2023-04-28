import React from 'react';

export function EquiBox(props: {
    children: JSX.Element[] | JSX.Element,
    orientation: 'row' | 'column',
    padding?: number,
    gap?: string,
}) {
    const padding = props.padding ?? 0;
    const gap = props.gap ?? '0';
    const elems = Array.isArray(props.children) ? props.children : [props.children];
    const basis = `${(100 - padding) / elems.length}%`;

    return (
        <div style={{ display: 'flex', flexDirection: props.orientation, gap }}>
            {padding ? <div style={{ flexBasis: `${padding / 2}%` }} /> : void 0}
            {elems.map((item, idx) => <div style={{ flexBasis: basis }} key={idx}>{item}</div>)}
            {padding ? <div style={{ flexBasis: `${padding / 2}%` }} /> : void 0}
        </div>
    );
}
