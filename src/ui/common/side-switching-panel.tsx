import React from 'react';

interface Item {
    caption: string;
}

function makeList<K extends string>(items: readonly (readonly [id: K, item: Item])[], selectedItemId: K, onSwitched: (id: K) => void) {
    const list = new Array<JSX.Element>();

    for (let idx = 0; idx < items.length; idx++) {
        const view = items[idx];
        const id = view[0];
        const last = idx === items.length - 1;
        list.push(
            <div key={id}
                className={`rdo-side-switching-panel-item ${selectedItemId === id ? 'rdo-side-switching-panel-item-selected' : 'rdo-side-switching-panel-item-deselected'} ${!last ? 'rdo-side-switching-panel-item-not-last' : ''}`}
                onClick={() => onSwitched(id)}
            >
                <div className='rdo-side-switching-panel-item-text'>{view[1].caption}</div>
            </div>
        );
    }

    return list;
}

export function SideSwitchingPanel<K extends string>(props: {
    items: readonly (readonly [id: K, item: Item])[],
    selectedItemId: K,
    onSwitched: (id: K) => void,
}) {
    return (
        <div className='rdo-side-switching-panel'>
            {makeList(props.items, props.selectedItemId, props.onSwitched)}
            <div key='padder' className='rdo-side-switching-panel-padder' />
        </div>
    );
}
