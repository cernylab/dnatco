import * as React from 'react';
import * as RDC from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';

const CursorOffset = -20;

function inside(x: number, y: number, l: number, t: number, r: number, b: number) {
    return (x >= l && x <= r && y >= t && y <= b);
}

export class Tooltip extends React.Component<Tooltip.Props> {
    static defaultProps: Tooltip.Props = {
        delayMsec: 0,
        display: 'inline',
        overflow: 'visible',
    };

    private contentId;
    private inhibitDisplay = false;
    private ref: React.RefObject<HTMLSpanElement> = React.createRef();
    private pendingDisplay: number|null = null;

    constructor(props: Tooltip.Props) {
        super(props);

        this.contentId = uuidv4();
    }

    private display(pageX: number, pageY: number, fromTouchEvent: boolean) {
        this.pendingDisplay = null;

        if (this.inhibitDisplay) {
            /* At least Firefox and Chrome differ in behavior here.
               Firefox triggers onMouseEnter event when the Tooltip is dismissed
               and mouse cursor is still inside this element. Chrome does not do that.
            */
            this.inhibitDisplay = false;
            return;
        }

        if (document.getElementById(this.contentId))
            return;

        const posX = pageX + CursorOffset;
        const posY = pageY + CursorOffset;

        const tainer = document.createElement('div');
        tainer.id = this.contentId;
        tainer.className = 'rdo-tooltip-text rdo-tooltip-text-faded';
        tainer.style.left = `${posX}px`;
        tainer.style.top = `${posY}px`;

        const hideTooltip = () => {
            tainer.classList.add('rdo-tooltip-text-faded');
            setTimeout(() => {
                const t = document.getElementById(this.contentId);
                if (t)
                    document.body.removeChild(t);
            }, 200);
            if (!fromTouchEvent)
                removeEventListener('mousemove', hideFromOutside);
            else
                removeEventListener('touchstart', hideTooltip);
        };

        const hideFromOutside = (e: MouseEvent) => {
            const tainer = document.getElementById(this.contentId);
            if (tainer) {
                const x = e.pageX;
                const y = e.pageY;
                const rect = tainer.getBoundingClientRect();

                const l = rect.left;
                const t = rect.top;
                const r = rect.right;
                const b = rect.bottom;

                const isInside = inside(x, y, l, t, r, b);
                if (!isInside)
                    hideTooltip();
            }
        };

        if (this.props.children) {
            const root = RDC.createRoot(tainer);
            root.render(<>{this.props.children}</>);

            document.body.appendChild(tainer);

            if (!fromTouchEvent) {
                tainer.addEventListener('click', e => {
                    this.setInhibit(e.pageX, e.pageY);
                    hideTooltip();
                });
            }

            setTimeout(() => {
                const bw = document.body.clientWidth;
                const bh = document.body.clientHeight;
                const { right, bottom } = tainer.getBoundingClientRect();

                const overhangHoriz = right - bw;
                const overhangVert = bottom - bh;

                if (overhangHoriz > 0)
                    tainer.style.left = `${pageX + CursorOffset - overhangHoriz}px`;
                if (overhangVert > 0)
                    tainer.style.top = `${pageY + CursorOffset - overhangVert}px`;
            });
            setTimeout(() => {
                document.getElementById(this.contentId)?.classList.remove('rdo-tooltip-text-faded');
                if (!fromTouchEvent)
                    addEventListener('mousemove', hideFromOutside);
                else {
                    addEventListener('touchstart', hideTooltip);
                }
            }, 0);
        }
    }

    private scheduleDisplay(pageX: number, pageY: number, fromTouchEvent: boolean, delay: number) {
        if (this.pendingDisplay)
            window.clearTimeout(this.pendingDisplay);

        this.pendingDisplay = null;
        if (delay > 0)
            this.pendingDisplay = this.pendingDisplay = window.setTimeout(() => this.display(pageX, pageY, fromTouchEvent), delay);
        else
            this.display(pageX, pageY, fromTouchEvent);
    }

    private setInhibit(mouseX: number, mouseY: number) {
        const elem = this.ref.current!;
        const rect = elem.getBoundingClientRect();

        const l = rect.left;
        const t = rect.top;
        const r = rect.right;
        const b = rect.bottom;

        this.inhibitDisplay = inside(mouseX, mouseY, l, t, r, b);
    }

    private renderTag() {
        if (!this.props.tag)
            return undefined;

        if (typeof this.props.tag === 'string')
            return <span>{this.props.tag}</span>;
        return this.props.tag;
    }

    render() {
        return (
            <span className='rdo-tooltip'
                style={{ display: this.props.display, overflow: this.props.overflow }}
                ref={this.ref}
                onMouseEnter={e => this.scheduleDisplay(e.pageX, e.pageY, false, this.props.delayMsec)}
                onMouseLeave={() => {
                    if (this.pendingDisplay) {
                        window.clearTimeout(this.pendingDisplay);
                        this.pendingDisplay = null;
                    }

                    // Cater for Firefox vs. Chrome difference in onMouseEnter behavior
                    this.inhibitDisplay = false;
                }}
                onTouchStart={e => {
                    const touches = e.targetTouches;
                    if (touches.length !== 1)
                        return;
                    const t = touches[0];
                    this.display(t.pageX, t.pageY, true);
                }}
            >
                {this.renderTag()}
            </span>
        );
    }
}

export namespace Tooltip {
    export interface Props {
        children?: React.ReactNode;
        delayMsec: number;
        display: 'inline' | 'block';
        overflow: 'visible' | 'hidden';
        tag?: JSX.Element|string;
    }
}
