import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { valueToSemaphore } from './util';
import { IconTextButton } from '../common/push-button';
import { GlobalConfig } from '../../global-config';
import { rgbToHex } from '../util';
import { clamp } from '../../util';
import { StepRmsdStats as DnatcoStepRmsdStats } from '../../dnatco/dnatcofication';
import { Step } from '../../dnatco/step';

export namespace Common {
    export const NA = 'N/A';

    export const BarHeightEm = 0.75;
    export const VScrollElement = { overflow: 'hidden', flex: 1 } as StandardLonghandProperties;
    export const VScrollJail = { overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' } as StandardLonghandProperties;
    export const StyleScoreBar = { width: '100%', height: `${BarHeightEm}em` };
    export const StyleTableSameColumnWidth = { tableLayout: 'fixed', width: '100%' } as StandardLonghandProperties;
}

export function niceStepName(step: Step, showModelNum = false) {
    return (
        <span>
            {showModelNum
                ? <><span className='rdo-nice-step-model'>M{step.model}</span><div className='rdo-nice-step-msep'>{'\u00A0'}</div></>
                : undefined
            }
            <span className='rdo-nice-step-base'>{step.base1}</span>
            <span className='rdo-nice-step-brsep'>{'\u00A0'}</span>
            <span className='rdo-nice-step-residue'>{step.resNo1Auth}{step.insCode1}</span>
            {step.altPos1 !== '' ? <span className='rdo-nice-step-altpos'>(alt {step.altPos1})</span> : void 0}

            <div className='rdo-nice-step-fssep'>{'\u00A0'}</div>

            <span className='rdo-nice-step-base'>{step.base2}</span>
            <span className='rdo-nice-step-brsep'>{'\u00A0'}</span>
            <span className='rdo-nice-step-residue'>{step.resNo2Auth}{step.insCode2}</span>
            {step.altPos2 !== '' ? <span className='rdo-nice-step-altpos'>(alt {step.altPos2})</span> : void 0}
        </span>
    );
}

export function niceStepNameText(step: Step, showModelNum = false) {
    const SP = '\u00A0';

    const nice =
        step.base1 + SP +
        step.resNo1 + step.insCode1 +
        (step.altPos1 !== '' ? `(alt ${step.altPos1})` : '') +
        SP +
        step.base2 + SP +
        step.resNo2 + step.insCode2 +
        (step.altPos2 !== '' ? `(alt ${step.altPos2})` : '');

    return (showModelNum ? `M${step.model} ` : '') + nice;
}

// NO NO NO: This is just a very interim solution to check that we're correct
function percentile(confal: number) {
    // TODO: Better function
    const x = clamp(confal, 0.0, 100.0);
    const Coeffs = [
        -8.43983519489781E-13, 2.99903652081687E-10, -4.04702262570393E-08, 2.54732719424787E-06, -7.55126681196185E-05, 0.00111573721670155, -0.00220044745406717, 0.0259204823080706
    ];
    const N = Coeffs.length - 1;

    let y = 0;
    for (let idx = 0; idx < Coeffs.length; idx++)
        y += Coeffs[idx] * Math.pow(x, N - idx);

    return y * 100.0;
}
export class ConfalPercentileStats extends React.Component<{ avgConfal: number, modelNum: number, showModelNum: boolean }> {
    private readonly MarkerWidthRatio = 0.005;
    private readonly MarkerOverdrawRatio = 0.8; // How much smaller is the background gradient than the marker.
    private barRef = React.createRef<HTMLCanvasElement>();

    private drawBar(canvas: HTMLCanvasElement, perc: number) {
        let ctx = canvas.getContext('2d');
        if (!ctx)
            return;

        const tw = canvas.width;
        const th = canvas.height;

        ctx.clearRect(0, 0, tw, th);

        const gh = Math.round(0.8 * th);
        const grad = ctx.createLinearGradient(0, 0, tw, 0);
        grad.addColorStop(0.0, 'rgba(255,   0,   0, 1.0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(1.0, 'rgba(0,     0, 255, 1.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, (th - gh) / 2.0, tw, gh);

        const mx = tw * perc / 100.0;
        const mwx = Math.round(this.MarkerWidthRatio * tw);
        const fx = Math.round(mx - this.MarkerWidthRatio / 2.0);

        /* Firefox refuses to change fillStyle from CanvasGradient to rgba color
         * specified by rgba() string. Encode the color differently. */
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx, 0, mwx, th);
    }

    private renderAverageConfal(avgConfal: number, modelNum: number, showModelNum: boolean) {
        const avg = avgConfal.toFixed(0);
        if (!showModelNum)
            return `${avg}`;
        else
            return `${avg} (model ${modelNum})`;
    }

    private tryDrawBar() {
        const ref = this.barRef.current;
        if (ref)
            this.drawBar(ref, percentile(this.props.avgConfal));
    }

    componentDidMount() {
        this.tryDrawBar();
    }

    componentDidUpdate() {
        this.tryDrawBar();
    }

    render() {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v-gap)' }}>
                <div style={{ display: 'flex', gap: 'var(--h-gap)' }}>
                    <div>
                        <span className='rdo-named-list-name'>Avg. confal: </span>{this.renderAverageConfal(this.props.avgConfal, this.props.modelNum, this.props.showModelNum)}
                    </div>
                    <div>
                        <span className='rdo-named-list-name'>Percentile: </span>{percentile(this.props.avgConfal).toFixed(0)}
                    </div>
                </div>
                <canvas width={300} height={30} style={{ ...Common.StyleScoreBar, height: `${Common.BarHeightEm / this.MarkerOverdrawRatio}em` }} ref={this.barRef} />
            </div>
        );
    }
}

export class DownloadButton extends React.Component<DownloadButton.Props> {
    render() {
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <IconTextButton
                caption={this.props.caption}
                src={`${prefix}/imgs/data-transfer-download.svg`}
                onClick={this.props.onClick}
            />
        );
    }
}
export namespace DownloadButton {
    export interface Props {
        caption: string;
        onClick: (e: React.MouseEvent) => void;
    }
}

export class StepsClassificationStats extends React.Component<{ assigned: number, close: number, unassigned: number }> {
    render() {
        return (
            <table className='rdo-data-table-small' style={ Common.StyleTableSameColumnWidth }>
                <thead>
                    <tr>
                        <th className='rdo-data-table-small'>
                            Assigned
                        </th>
                        <th className='rdo-data-table-small'>
                            Close
                        </th>
                        <th className='rdo-data-table-small'>
                            Unassigned
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className='rdo-numeric-table-small'>
                            {this.props.assigned}
                        </td>
                        <td className='rdo-numeric-table-small'>
                            {this.props.close}
                        </td>
                        <td className='rdo-numeric-table-small'>
                            {this.props.unassigned}
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

export class StepRmsdStats extends React.Component<{ stats: DnatcoStepRmsdStats[] }> {
    private barRef = React.createRef<HTMLCanvasElement>();

    private drawBar(canvas: HTMLCanvasElement, stats: DnatcoStepRmsdStats[]) {
        const ctx = canvas.getContext('2d');
        if (!ctx || stats.length < 3)
            return;

        const tw = canvas.width;
        const th = canvas.height;
        const green = stats[0].rmsdThreshold;
        const red = stats[stats.length - 2].rmsdThreshold;

        const total = stats.reduce((p, c) => p + c.count, 0);

        let fx = 0;
        for (let idx = 0; idx < stats.length; idx++) {
            const s = stats[idx];
            const thrPrev = stats[idx - 1]?.rmsdThreshold ?? 0;
            const v = s.rmsdThreshold === -1 ? red + 0.1 : thrPrev + (s.rmsdThreshold - thrPrev) / 2.0;

            const w = Math.round(tw * s.count / total);
            const rgb = valueToSemaphore(v, green ,red);

            ctx.fillStyle = rgbToHex(rgb);
            ctx.fillRect(fx, 0, w, th);
            if (w >= tw)
                return;

            fx += w;
        }
    }

    private tryDrawBar() {
        const ref = this.barRef.current;
        if (ref)
            this.drawBar(ref, this.props.stats);
    }

    componentDidMount() {
        this.tryDrawBar();
    }

    componentDidUpdate() {
        this.tryDrawBar();
    }

    render() {
        const stats = this.props.stats;

        if (stats.length < 2)
            return void 0;

        const green = stats[0].rmsdThreshold;
        const red = stats[stats.length - 2].rmsdThreshold;
        const headers = [<th key={-1} className='rdo-data-table-small'>RMSD{'\u00A0\u212B'}</th>];
        let idx = 0;
        for (;idx < stats.length - 1; idx++) {
            const s = stats[idx];
            const thrPrev = stats[idx - 1]?.rmsdThreshold ?? 0;
            const v = s.rmsdThreshold === -1 ? red + 0.1 : thrPrev + (s.rmsdThreshold - thrPrev) / 2.0;
            headers.push(
                <th
                    key={idx}
                    className='rdo-data-table-small'
                    style={{ color: rgbToHex(valueToSemaphore(v, green, red)) }}
                >
                    {`<\u00A0${s.rmsdThreshold.toFixed(1)}`}
                </th>
            );
        }
        headers.push(<th key={stats.length - 1} className='rdo-data-table-small' style={{ color: rgbToHex({ r: 255, g: 0, b: 0}) }}>{`>\u00A0${stats[stats.length - 2].rmsdThreshold.toFixed(1)}`}</th>);

        const nums = [
            <td key={-1} className='rdo-numeric-table-small'></td>,
            ...stats.map((x, idx) => <td key={idx} className='rdo-numeric-table-small'>{x.count}</td>)
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v-gap)' }}>
                <table className='rdo-data-table-small' style={ Common.StyleTableSameColumnWidth }>
                    <thead>
                        <tr>{headers}</tr>
                    </thead>
                    <tbody>
                        <tr>{nums}</tr>
                    </tbody>
                </table>
                <canvas width={300} height={1} style={ Common.StyleScoreBar } ref={this.barRef} />
            </div>
        );
    }
}
