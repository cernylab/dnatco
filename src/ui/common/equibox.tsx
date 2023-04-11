import React from 'react';

export function EquiBox(props: { items: JSX.Element[], padding: number, orientation: 'row' | 'column' }) {
    const basis = `${(100 - props.padding) / props.items.length}%`;

    return (
        <div style={{ display: 'flex', flexDirection: props.orientation }}>
            <div style={{ flexBasis: `${props.padding / 2}%` }} />
            {props.items.map((item, idx) => <div style={{ flexBasis: basis }} key={idx}>{item}</div>)}
            <div style={{ flexBasis: `${props.padding / 2}%` }} />
        </div>
    )
}
