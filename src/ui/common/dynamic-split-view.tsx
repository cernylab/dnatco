import React from 'react';

const Steps = 2000;
const Margin = 0.05;

const StyleFull = { flex: 1000, visibility: 'visible' as 'visible'|'hidden' };
const StyleHidden = { flex: 0, visibility: 'hidden' as 'visible'|'hidden', width: 0 };

interface State {
    splitPosition: number;
}
export class DynamicSplitView extends React.Component<DynamicSplitView.Props, State> {
    static defaultProps = {
        visible: 'both',
    };
    private tainerRef = React.createRef<HTMLDivElement>();
    private defaultSelectStart: (typeof HTMLBodyElement.prototype.onselectstart) = null;

    adjustWidth = (evt: MouseEvent) => {
        evt.stopPropagation();
        const tainer = this.tainerRef.current!;
        const x = (evt.clientX - tainer.getBoundingClientRect().left) / tainer.clientWidth;

        if (x < 1.0 - Margin && x > Margin)
            this.setState({ ...this.state, splitPosition: x });
    }

    adjustHeight = (evt: MouseEvent) => {
        evt.stopPropagation();
        const tainer = this.tainerRef.current!;
        const y = (evt.clientY - tainer.getBoundingClientRect().top) / tainer.clientHeight;

        if (y < 1.0 - Margin && y > Margin)
            this.setState({ ...this.state, splitPosition: y });
    }

    private adjustFunc() {
        return this.props.orientation === 'horizontal' ? this.adjustWidth : this.adjustHeight;
    }

    private cursorStyle() {
        return this.props.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize';
    }

    private finalizeAdjust() {
        document.body.onselectstart = this.defaultSelectStart;
        document.body.style.cursor = 'auto';

        this.tainerRef.current!.removeEventListener('mousemove', this.adjustFunc());
        if (this.props.onAdjustDone)
            this.props.onAdjustDone();
    }

    private renderOne() {
        const styleFirst = this.props.visible === 'first' ? StyleFull : StyleHidden;
        const styleSecond = this.props.visible === 'second' ? StyleFull : StyleHidden;

        return (
            <div
                ref={this.tainerRef}
                className={this.props.containerClass}
                style={{ display: 'flex', flexDirection: this.props.orientation === 'horizontal' ? 'row' : 'column' }}
            >
                <div style={styleFirst}>
                    {this.props.first}
                </div>
                <div
                    style={{ visibility: 'hidden' }}
                >
                </div>
                <div style={styleSecond}>
                    {this.props.second}
                </div>
            </div>
        );
    }

    private renderBoth() {
        const r = Math.round(this.state.splitPosition * Steps)
        const sizeFirst = r;
        const sizeSecond = Steps - r;

        const splitterStyle = this.props.orientation === 'horizontal'
            ? { width: '10px', height: '100%', cursor: 'ew-resize' }
            : { height: '10px', width: '100%', cursor: 'ns-resize' };
        const splitterBarStyle = this.props.orientation === 'horizontal'
            ? { width: '50%', height: '100%', backgroundColor: 'var(--color-b)', marginLeft: 'auto', marginRight: 'auto' }
            : { height: '100%', width: '50%', backgroundColor: 'var(--color-b)', marginLeft: 'auto', marginRight: 'auto' };

        return (
            <div
                ref={this.tainerRef}
                className={this.props.containerClass}
                style={{ display: 'flex', flexDirection: this.props.orientation === 'horizontal' ? 'row' : 'column' }}
                onMouseUp={() => this.finalizeAdjust()}
                onMouseLeave={() => this.finalizeAdjust()}
            >
                <div style={{ flex: sizeFirst }}>
                    {this.props.first}
                </div>

                <div
                    style={splitterStyle}
                    onMouseDown={() => {
                        const elem = this.tainerRef.current!;
                        elem.addEventListener('mousemove', this.adjustFunc());

                        document.body.style.cursor = this.cursorStyle();
                        document.body.onselectstart = () => false;
                    }}
                    onMouseUp={() => this.finalizeAdjust()}
                >
                    <div style={splitterBarStyle}></div>
                </div>

                <div style={{ flex: sizeSecond }}>
                    {this.props.second}
                </div>
            </div>
        );

    }

    constructor(props: DynamicSplitView.Props) {
        super(props);

        this.state = {
            splitPosition: props.initialSplit ?? 0.5,
        };
    }

    render() {
        return this.props.visible === 'both' ? this.renderBoth() : this.renderOne();
    }
}
export namespace DynamicSplitView {
    export interface Props {
        first: React.ReactNode;
        second: React.ReactNode;
        orientation: 'horizontal' | 'vertical';
        visible: 'both' | 'first' | 'second';
        containerClass?: string;
        initialSplit?: number;
        onAdjustDone?: () => void;
    }
}
