import React from 'react';
import * as RDC from 'react-dom/client';
import { GlobalConfig } from '../../global-config';
import '../../../../assets/imgs/triangle-down.svg';
import '../../../../assets/imgs/x.svg';

class WindowStack {
    private readonly BottomZIndex = 100;
    private stack: { zIndex: number, elem: HTMLDivElement }[] = [];

    private restack() {
        for (let idx = this.stack.length - 1; idx >= 0; idx--) {
            const elem = this.stack[idx].elem;
            const actualZIndex = parseInt(elem.style.zIndex);
            const targetZIndex = this.BottomZIndex + idx;
            if (actualZIndex !== targetZIndex)
                elem.style.zIndex = `${targetZIndex}`;
        }
    }

    focus(w: HTMLDivElement) {
        const idx = this.stack.findIndex(item => item.elem === w);
        if (idx !== -1) {
            const item = this.stack.splice(idx, 1)[0];
            this.stack.push(item);

            this.restack();
        }
    }

    push(w: HTMLDivElement) {
        const previous = this.stack.length > 0 ? this.stack[this.stack.length - 1] : void 0;

        const zIndex = previous ? previous.zIndex + 1 : this.BottomZIndex;
        this.stack.push({ zIndex, elem: w });
        w.style.zIndex = `${zIndex}`;
    }

    remove(w: HTMLElement) {
        const idx = this.stack.findIndex(item => item.elem === w);
        if (idx !== -1) {
            this.stack.splice(idx, 1);
            this.restack();
        }
    }
}
const windowStack = new WindowStack();

function Header(props: {
    title: string | JSX.Element,
    onClosed: () => void,
    onCollapsedExpanded: (expanded: boolean) => void,
    onDragged: (x: number, y: number) => void,
}) {
    const pfx = GlobalConfig.data().pathPrefix;

    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div
            style={{
                alignItems: 'center',
                borderBottom: 'var(--thickness-border) solid black',
                display: 'flex',
                flexDirection: 'row',
                gap: 'var(--h2-gap)',
                justifyContent: 'center',
            }}
        >
            <div
                style={{ flex: 1, cursor: 'move', whiteSpace: 'nowrap' }}
                onMouseDown={(evt) => {
                    evt.preventDefault();

                    const sX = evt.nativeEvent.offsetX;
                    const sY = evt.nativeEvent.offsetY;

                    const onMove = (ev: MouseEvent) => {
                        const x = ev.pageX;
                        const y = ev.pageY;
                        props.onDragged(x - sX, y - sY);
                    };
                    const onUp = () => {
                        window.removeEventListener('mouseup', onUp);
                        window.removeEventListener('mousemove', onMove);
                    };
                    window.addEventListener('mouseup', onUp);
                    window.addEventListener('mousemove', onMove);
                }}
            >
                {props.title}
                <div style={{ width: '1em' }} />
            </div>
            <div onClick={() => {
                const ce = !isExpanded;
                setIsExpanded(ce);
                props.onCollapsedExpanded(ce);
            }}>
                <img
                    className='rdo-window-button'
                    src={`${pfx}/imgs/triangle-down.svg`}
                    style={{ transition: 'rotate var(--anim-speed)', rotate: isExpanded ? '0deg' : '180deg' }}
                />
            </div>
            <div onClick={() => props.onClosed()}>
                <img
                    className='rdo-window-button'
                    src={`${pfx}/imgs/x.svg`}
                />
            </div>
        </div>
    );
}

function TheWindow(props: {
    title: string | JSX.Element,
    content: JSX.Element,
    onClosed: () => void,
    initialPosition?: { x: number, y: number },
}) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [position, setPosition] = React.useState(props.initialPosition ?? { x: 0, y: 0 });
    const tRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const self = tRef.current!;

        const bRect = self.getBoundingClientRect();
        const overflowX = bRect.right - document.body.clientWidth;
        const overflowY = bRect.bottom - document.body.clientHeight;
        setPosition({
            x: overflowX > 0 ? position.x - overflowX : position.x,
            y: overflowY > 0 ? position.y - overflowY : position.y,
        });
    }, []);

    return (
        <div
            className='rdo-window'
            ref={tRef}
            style={{ display: 'flex', flexDirection: 'column', left: `${position.x}px`, top: `${position.y}px` }}
        >
            <div>
                <Header
                    title={props.title}
                    onClosed={() => props.onClosed()}
                    onCollapsedExpanded={(expanded) => setIsExpanded(expanded)}
                    onDragged={(x, y) => setPosition({ x, y })}
                />
            </div>
            <div style={{ flex: 1 }}>
                {isExpanded ? props.content : null}
            </div>
        </div>
    );
}

export namespace Window {
    export type Handle = {
        close: () => void,
    }

    export function create(
        content: JSX.Element,
        title: string | JSX.Element,
        initialPosition?: { x: number, y: number },
        onClosed?: (hwnd: Window.Handle) => void
    ): Window.Handle {
        const tainer = document.createElement('div');
        tainer.classList.add('rdo-window-tainer');
        document.body.appendChild(tainer);

        const mouseDown = () => {
            windowStack.focus(tainer);
        };

        const dismisser = () => {
            tainer.removeEventListener('mousedown', mouseDown);
            windowStack.remove(tainer);
            document.body.removeChild(tainer);

        };
        tainer.addEventListener('mousedown', mouseDown);
        windowStack.push(tainer);

        const hwnd = {
            close: dismisser,
        };

        const root = RDC.createRoot(tainer);
        root.render(
            <TheWindow
                content={content}
                title={title}
                initialPosition={initialPosition}
                onClosed={() => {
                    dismisser();
                    onClosed?.(hwnd);
                }}
            />
        );

        return hwnd;
    }
}
