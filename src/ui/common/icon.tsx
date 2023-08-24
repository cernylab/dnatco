import React from 'react';

export function Icon(props: { img: string, size: 'text' | '1.5x-text' | string }) {
    const size = props.size === 'text'
        ? '1em'
        : props.size === '1.5x-text'
            ? '1.5em'
            : props.size;

    return (
        <div className='rdo-icon-tainer' style={{ width: size, height: size }}>
            <img
                className='rdo-icon'
                src={props.img}
            />
        </div>
    );
}
