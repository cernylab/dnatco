import React, { useEffect, useState } from 'react';
import * as RDC from 'react-dom/client';
import { GridThreeUpImg } from '../../assets/images';

const MinimumWidthForStandardPanel = 1024;

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
                className={`rdo-side-switching-panel-item rdo-side-switching-panel-item-standard ${selectedItemId === id ? 'bg-secondary-second selected' : 'hover:bg-secondary-second-hover deselected'} ${!last ? 'rdo-side-switching-panel-item-not-last' : ''}`}
                onClick={(ev) =>{
                    ev.preventDefault();
                    ev.stopPropagation();

                    onSwitched(id);
                }}
            >
                <div className='rdo-side-switching-panel-item-text'>{view[1].caption}</div>
            </div>
        );
    }

    return list;
}

function makeMenu<K extends string>(items: readonly (readonly [id: K, item: Item])[], selectedItemId: K, onSwitched: (id: K) => void, x: number, y: number, onDismissed: () => void) {
    const tainer = document.createElement('div');
    document.body.appendChild(tainer);

    const reactRoot = RDC.createRoot(tainer!);
    reactRoot.render(
        <Menu
            items={items}
            selectedItemId={selectedItemId}
            onSwitched={onSwitched}
            onDismissed={onDismissed}
            x={x} y={y}
            parentElement={tainer}
        />
    );
}

export function Menu<K extends string>(props: {
    items: readonly (readonly [id: K, item: Item])[],
    selectedItemId: K,
    onSwitched: (id: K) => void,
    onDismissed: () => void,
    x: number,
    y: number,
    parentElement: HTMLElement,
}) {
    const dismisser = () => {
        document.body.removeChild(props.parentElement);
        document.body.removeEventListener('click', dismisser);
        props.onDismissed();
    };

    useEffect(() => {
        document.body.addEventListener('click', dismisser);
        return () => document.body.removeEventListener('click', dismisser);
    });

    return (
        <div className='bg-white absolute' style={{
            border: 'var(--thickness-border) solid var(--color-a)',
            left: `${props.x}px`,
            top: `${props.y}px`,
            zIndex: 100,
        }}>
            {makeList(props.items, props.selectedItemId, (id) => {
                props.onSwitched(id);
                dismisser();
            })}
        </div>
    );
}

export function SideSwitchingPanel<K extends string>(props: {
    items: readonly (readonly [id: K, item: Item])[],
    selectedItemId: K,
    onSwitched: (id: K) => void,
}) {
    const [compact, setCompact] = useState(window.innerWidth < MinimumWidthForStandardPanel);
    const [permaCompact, setPermaCompact] = useState(false);
    const [hamburgerHovered, setHamburberHovered] = useState(false);
    const [hamburgerOpen, setHamburberOpen] = useState(false);

    useEffect(() => {
        const compactToggler = () => {
            setCompact(window.innerWidth < MinimumWidthForStandardPanel);
        };

        addEventListener('resize', compactToggler);

        return () => {
            removeEventListener('resize', compactToggler);
        };
    });

    useEffect(() => {
        if (props.selectedItemId === 'hide' && permaCompact) {
            setPermaCompact(false);
        }else if (props.selectedItemId == 'hide'){
            setPermaCompact(true);
        }
    }, [props.selectedItemId]);

    if (compact || permaCompact) {
        return (
            <div className='rdo-side-switching-panel'>
                <div
                    className='rdo-side-switching-panel-hamburger-icon-container'
                    onMouseEnter={() => setHamburberHovered(true)}
                    onMouseLeave={() => setHamburberHovered(false)}
                    onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();

                        if (hamburgerOpen)
                            return;

                        makeMenu(
                            props.items,
                            props.selectedItemId,
                            props.onSwitched,
                            ev.clientX,
                            ev.clientY,
                            () => setHamburberOpen(false),
                        );
                        setHamburberOpen(true);
                    }}
                >
                    <img
                        className={`rdo-side-switching-panel-hamburger-icon rdo-side-switching-panel-hamburger-icon-${hamburgerHovered ? 'active' : 'inactive'}`}
                        src={GridThreeUpImg}
                    />
                </div>
                {!compact &&(
                    <button
                        className={`rdo-side-switching-panel-hamburger-icon rdo-side-switching-panel-hamburger-icon-${hamburgerHovered ? 'active' : 'inactive'}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPermaCompact(prev => !prev);
                        }}
                        title={permaCompact ? 'Show panel' : 'Hide panel'}
                    >
                        {permaCompact ? '⮞' : '⮜'}
                    </button>
                )}


                <div className='rdo-side-switching-panel-item rdo-side-switching-panel-item-compact selected bg-secondary-second'>
                    <div className='rdo-side-switching-panel-item-text rdo-side-switching-panel-item-text-compact'>
                        {props.items.find((item) => item[0] === props.selectedItemId)![1].caption}
                    </div>
                </div>
                <div key='padder' className='rdo-side-switching-panel-padder' />
            </div>
        );
    } else {
        return (
            <div className='rdo-side-switching-panel'>
                {makeList(props.items, props.selectedItemId, props.onSwitched)}
                    <button
                        className={`rdo-side-switching-panel-item rdo-side-switching-panel-item-standard hover:bg-secondary-second-hover deselected`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPermaCompact(prev => !prev);
                        }}
                        title={permaCompact ? 'Show panel' : 'Hide panel'}
                    >
                        <div className={'rdo-side-switching-panel-item-text'}>
                            {permaCompact ? '⮞' : '⮜ Hide'}
                        </div>
                    </button>
                <div key='padder' className='rdo-side-switching-panel-padder' />
            </div>
        );
    }
}
