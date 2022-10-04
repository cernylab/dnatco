import React from 'react';

const MinimumWidth = 0.05;

const StyleFullFirstHorizontal = { display: 'grid', gridTemplateColumns: `100% 20px 0%` };
const StyleFullSecondHorizontal = { display: 'grid', gridTemplateColumns: `0% 20px 100%` };
const StyleFullFirstVertical = { display: 'grid', gridTemplateRows: `100% 20px 0%` };
const StyleFullSecondVertical = { display: 'grid', gridTemplateRows: `0% 20px 100%` };

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

        if (x < 1.0 - MinimumWidth && x > MinimumWidth)
            this.setState({ ...this.state, splitPosition: x });
    }

    adjustHeight = (evt: MouseEvent) => {
        evt.stopPropagation();
        const tainer = this.tainerRef.current!;
        const y = (evt.clientY - tainer.getBoundingClientRect().top) / tainer.clientHeight;

        if (y < 1.0 - MinimumWidth && y > MinimumWidth)
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

    private getBlockStyle() {
        if (this.props.orientation === 'horizontal') {
            return {
                display: 'grid',
                gridTemplateColumns: `${this.state.splitPosition * 100.0}% 20px ${(1.0 - this.state.splitPosition) * 100.0}%`,
            };
        } else {
            return {
                display: 'grid',
                gridTemplateRows: `${this.state.splitPosition * 100.0}% 20px ${(1.0 - this.state.splitPosition) * 100.0}%`,
            };
        }
    }

    private renderOne() {
        return (
            <div
                ref={this.tainerRef}
                className={this.props.containerClass}
                style={
                    this.props.orientation === 'horizontal'
                        ? this.props.visible === 'first' ? StyleFullFirstHorizontal : StyleFullSecondHorizontal
                        : this.props.visible === 'first' ? StyleFullFirstVertical : StyleFullSecondVertical
                }
            >
                {this.props.first}
                <div
                    style={{ visibility: 'hidden' }}
                >
                </div>
                {this.props.second}
            </div>
        );
    }

    private renderBoth() {
        const splitterStyle = this.props.orientation === 'horizontal'
            ? { width: '10px', height: '100%', cursor: 'ew-resize' }
            : { height: '10px', width: '100%', cursor: 'ns-resize' };
        const splitterBarStyle = this.props.orientation === 'horizontal'
            ? { width: '50%', height: '100%', backgroundColor: 'var(--color-b)', marginLeft: 'auto', marginRight: 'auto' }
            : { height: '100%', width: '50%', backgroundColor: 'var(--color-b)', marginLeft: 'auto', marginRight: 'auto' };

        const blockStyle = this.getBlockStyle();

        return (
            <div
                ref={this.tainerRef}
                className={this.props.containerClass}
                style={blockStyle}
                onMouseUp={() => this.finalizeAdjust()}
                onMouseLeave={() => this.finalizeAdjust()}
            >
                {this.props.first}

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

                {this.props.second}
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
