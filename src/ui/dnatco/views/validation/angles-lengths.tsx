import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Constants } from '../../constants';
import { InvalidChain, InvalidModelIndex } from '../../structure-selection';
import { ColorTuple, colorToRgb, colorToTuple } from '../../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Dnatcofication  } from '../../../../dnatco/dnatcofication';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { isShiftedName, unshiftName } from '../../../../dnatco/angles-lengths/atoms';
import { Triplet } from '../../../../dnatco/angles-lengths/angles';
import { Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { rgbToHex } from '../../../util';
import { M } from '../../../../util/math';

const DetailsCaptionStyle = {
    alignItems: 'center',
    display: 'flex',
    fontWeight: 'bold',
    justifyContent: 'center',
};
const StayAboveStyle = { position: 'absolute', zIndex: 1 } as StandardLonghandProperties;
const BarCaptionStyle = {
    color: 'white',
    fontWeight: 'bold',
    textShadow: '0px 0px 3px #000',
    ...StayAboveStyle,
};
const ResidueBarCaptionStyle = {
    height: '100%',
    width: '100%',
    textAlign: 'right',
    fontSize: 'var(--font-small)',
    top: 0,
    right: 'calc(var(--h-gap) / 2)',
    ...BarCaptionStyle,
    ...StayAboveStyle,
} as StandardLonghandProperties;

const DetailsTableStyle = {
    display: 'grid',
    gridTemplateColumns: '1em auto auto 1fr',
    columnGap: '1em'
};
const OutlierColor = [0, 0, 0] as ColorTuple;

function bondName(bond: Pair | Triplet) {
    const toks = bond.map(x => isShiftedName(x) ? <span>{unshiftName(x)}<span className='rdo-sup'>(-1)</span></span> : <span>{x}</span>);
    let idx = 1;
    while (idx < toks.length) {
        const tail = toks.splice(idx, toks.length - idx, <span>-</span>);
        toks.push(...tail);
        idx += 2;
    }

    return <span>{toks}</span>;
}

function colorStyle(clr: [r: number, g: number, b: number]) {
    return `rgb(${clr.join(',')})`;
}

type CountInInterval = { threshold: number | 'outlier', count: number };
function countsInIntervals(stats: number[], thresholds: number[]): CountInInterval[] {
    return stats.map((v, idx) => {
        const thr = thresholds[idx];
        return { threshold: thr ?? 'outlier', count: v };
    });
}

function renderSubstructureStats(caption: string | JSX.Element, summaryStats: number[], counts: CountInInterval[]) {
    return (
        <AnglesLengthsBar
            caption={
                <div style={{ ...StayAboveStyle, top: 0, width: '100%' }}>
                    <Tooltip
                        tag={caption}
                        delayMsec={Constants.TooltipDelayMSec}
                        display='block'
                    >
                        <SubstructureSummary stats={counts} />
                    </Tooltip>
                </div>
            }
            stats={summaryStats}
        />
    );
}

class AnglesLengthsBar extends React.Component<{ caption?: string | React.ReactNode, stats: number[] }> {
    private readonly Width = 300;
    private barRef = React.createRef<HTMLCanvasElement>();


    private drawBar(canvas: HTMLCanvasElement, stats: number[]) {
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;

        const sum = stats.reduce((p, c) => p + c, 0);
        const nIntervals = DAnglesLengths.intervalCount();

        const tw = canvas.width;
        const th = canvas.height;
        let x = 0;
        for (let idx = 0; idx < nIntervals; idx++) {
            const n = stats[idx];
            const w = Math.round(tw * n / sum);

            const clr = DAnglesLengths.intervalColor(idx);
            ctx.fillStyle = rgbToHex(colorToRgb(clr));
            ctx.fillRect(x, 0, w, th);

            x += w;
        }
        ctx.fillStyle = rgbToHex(OutlierColor);
        ctx.fillRect(x, 0, tw - x, th);
    }

    private renderCaption() {
        if (!this.props.caption)
            return void 0;

        if (typeof this.props.caption === 'string') {
            return <div style={{ top: 0, left: 'var(--h-gap)', ...StayAboveStyle, ...BarCaptionStyle }}>{this.props.caption}</div>
        } else {
            return this.props.caption;
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
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <canvas
                    width={this.Width}
                    height={1}
                    style={{ width: '100%', height: '100%' }}
                    ref={this.barRef}
                />
                {this.renderCaption()}
            </div>
        );
    }
}

class IntervalSummary extends React.Component<{
    caption: string | JSX.Element,
    ranges: { from: string, to: string, probability: number }[],
    unit: string
}> {
    render() {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 'var(--h-gap)' }}>
                <div className='rdo-strong' style={{ gridColumnStart: 'span 3', textAlign: 'center' }}>{this.props.caption}</div>
                <div className='rdo-strong'>From</div><div className='rdo-strong'>To</div><div className='rdo-strong'>Probability (%)</div>
                {this.props.ranges.map(x => (
                    <>
                        <div className='rdo-monospace rdo-talgn-right'>{`${x.from}\u00A0${this.props.unit}`}</div>
                        <div className='rdo-monospace rdo-talgn-right'>{`${x.to}\u00A0${this.props.unit}`}</div>
                        <div className='rdo-monospace rdo-talgn-right'>{x.probability.toFixed(4)}</div>
                    </>
                ))}
            </div>
        )
    }
}

class ResidueHeader extends React.Component<{ caption: string, summary: Summarize.Summary, countsAngles: CountInInterval[], countsLengths: CountInInterval[] }> {
    private tainerRef = React.createRef<HTMLDivElement>();

    render() {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }} ref={this.tainerRef}>
                <div style={{
                        ...StayAboveStyle,
                        top: 0,
                        left: 'calc(var(--h-gap) / 2)',
                        ...BarCaptionStyle
                    }}
                >
                    {this.props.caption}
                </div>

                <div style={{ height: '1em' }}>
                    {renderSubstructureStats(<div style={ResidueBarCaptionStyle}>L</div>, this.props.summary.lengths, this.props.countsLengths)}
                </div>
                <div style={{ height: '1em' }}>
                    {renderSubstructureStats(<div style={ResidueBarCaptionStyle}>A</div>, this.props.summary.angles, this.props.countsAngles)}
                </div>
            </div>
        );
    }
}

class SubstructureSummary extends React.Component<{ stats: { threshold: number|'outlier', count: number }[] }> {
    render() {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 'var(--h-gap)' }}>
                <div className='rdo-strong'>Probability (%)</div><div className='rdo-strong'>Count</div>
                {this.props.stats.map(x => {
                    const thr = x.threshold === 'outlier' ? 'Outlier' : x.threshold.toFixed(4);
                    return (
                        <>
                            <div className='rdo-monospace rdo-talgn-right'>{thr}</div>
                            <div className='rdo-monospace rdo-talgn-right' style={{ textAlign: 'right' }}>{x.count}</div>
                        </>
                    );
                })}
            </div>
        );
    }
}

export class AnglesLengths extends View {
    private renderResidue(residue: Measurements.Residue, multipleModels: boolean, thresholds: number[]) {
        let residueName = multipleModels
            ? `${residue.modelNum} ${residue.authChain}${residue.authSeqId}`
            : `${residue.authChain}${residue.authSeqId}`;
        residueName += residue.altId ? ` (alt. ${residue.altId})` : '';

        const summary = Summarize.residue(residue);
        const countsAngles = countsInIntervals(summary.angles, thresholds);
        const countsLenghts = countsInIntervals(summary.lengths, thresholds);

        return (
            <>
                <CollapsibleVertical
                    header=<ResidueHeader
                        caption={residueName}
                        summary={summary}
                        countsAngles={countsAngles}
                        countsLengths={countsLenghts}
                    />
                >
                    <div style={DetailsTableStyle}>
                        <div style={{ gridColumnStart: 'span 4', ...DetailsCaptionStyle }}>Bond lengths</div>
                        {residue.bondLengths.map(x => {
                            const pgrp = DAnglesLengths.lengthPGroup(residue.compound, x);
                            const clr = pgrp ? colorToTuple(pgrp.color) : OutlierColor;
                            return (
                                <>
                                    <Tooltip
                                        tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                                        delayMsec={Constants.TooltipDelayMSec}
                                        display='block'
                                    >
                                        {pgrp
                                            ? <IntervalSummary
                                                caption={bondName(x.pair)}
                                                ranges={pgrp.groupedBins.map(x => ({
                                                    from: x.from.toFixed(3),
                                                    to: x.to.toFixed(3),
                                                    probability: x.probability,
                                                }))}
                                                unit={'\u212B'} />
                                            : 'Outlier'
                                        }
                                    </Tooltip>
                                    {bondName(x.pair)}
                                    <div className='rdo-monospace'>{x.length.toFixed(3)}{'\u00A0\u212B'}</div>
                                    <div />
                                </>
                            );
                        })}

                        <div style={{ gridColumnStart: 'span 4', ...DetailsCaptionStyle }}>Bond angles</div>
                        {residue.bondAngles.map(x => {
                            const pgrp = DAnglesLengths.anglePGroup(residue.compound, x);
                            const clr = pgrp ? colorToTuple(pgrp.color) : OutlierColor;
                            return (
                                <>
                                    <Tooltip
                                        tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                                        delayMsec={Constants.TooltipDelayMSec}
                                        display='block'
                                    >
                                        {pgrp
                                            ? <IntervalSummary
                                                caption={bondName(x.triplet)}
                                                ranges={pgrp.groupedBins.map(x => ({
                                                    from: M.r2d(x.from).toFixed(2),
                                                    to: M.r2d(x.to).toFixed(2),
                                                    probability: x.probability,
                                                }))}
                                                unit={'\u00B0'} />
                                            : 'Outlier'
                                        }
                                    </Tooltip>
                                    {bondName(x.triplet)}
                                    <div className='rdo-monospace rdo-talgn-right'>{M.r2d(x.angle).toFixed(2)}{'\u00B0'}</div>
                                    <div />
                                </>
                            );
                        })}
                    </div>
                </CollapsibleVertical>
                <div style={{ height: 'calc(var(--v-gap) / 2)' }} />
            </>
        );
    }

    private renderModel(modelIdx: number, chain: string, multipleModels: boolean, thresholds: number[]) {
        const residues = this.selectionToResidues(modelIdx, chain);
        return residues.map(x => this.renderResidue(x, multipleModels, thresholds));
    }

    private selectionToResidues(modelIdx: number, chain: string) {
        const alm = this.props.dnatcofication.data.alm;
        if (modelIdx === InvalidModelIndex) {
            return alm.residues;
        } else {
            const modelNum = this.props.dnatcofication.data.structures[0].models[modelIdx].num;

            if (chain) {
                const cm = alm.chains.get(modelNum)?.get(chain) ?? [];
                return cm.map(x => alm.residues[x]);
            } else {
                const mm = alm.models.get(modelNum) ?? [];
                return mm.map(x => alm.residues[x]);
            }
        }

    }

    render() {
        const multipleModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
        const modelIdx = this.props.structureSelection.modelIndex;
        const chain = this.props.structureSelection.chain === InvalidChain ? '' : this.props.structureSelection.chain;

        const summary = Summarize.substructure(this.selectionToResidues(modelIdx, chain));
        const thresholds = DAnglesLengths.intervalThresholds();

        return (
            <div>
                <NamedList sizing='min-content' rowSpacing='half'>
                {
                    multipleModels
                        ? <NamedListItem name='Model'>
                                <ModelSelect
                                    dnatcofication={this.props.dnatcofication}
                                    structureSelection={this.props.structureSelection}
                                    onChange={this.props.switching.switchModel}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchChain}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='rdo-secondary-caption'>Structure/Selection</div>
                <div style={{ height: '2em' }}>
                    {renderSubstructureStats(<div style={{ ...BarCaptionStyle, left: 'calc(var(--h-gap) / 2)' }}>Lengths</div>, summary.lengths, countsInIntervals(summary.lengths, thresholds))}
                </div>
                <div style={{ height: '2em' }}>
                    {renderSubstructureStats(<div style={{ ...BarCaptionStyle, left: 'calc(var(--h-gap) / 2)' }}>Angles</div>, summary.angles, countsInIntervals(summary.angles, thresholds))}
                </div>

                <div className='rdo-secondary-caption'>Residues</div>
                {this.renderModel(modelIdx, chain, multipleModels, thresholds)}
            </div>
        );
    }
}
