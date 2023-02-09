import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidChain, InvalidModelIndex } from '../../structure-selection';
import { ColorTuple, colorToRgb, colorToTuple } from '../../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Dnatcofication  } from '../../../../dnatco/dnatcofication';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { rgbToHex } from '../../../util';
import { M } from '../../../../util/math';

const BarCaptionStyle = {
    color: 'white',
    fontWeight: 'bold',
    textShadow: '0px 0px 3px #000'
};
const DetailsCaptionStyle = {
    alignItems: 'center',
    display: 'flex',
    fontWeight: 'bold',
    justifyContent: 'center',
};
const StayAboveStyle = { position: 'absolute', zIndex: 1 } as StandardLonghandProperties;
const ResidueBarCaptionStyle = {
    height: '100%',
    width: '100%',
    textAlign: 'right',
    fontSize: 'var(--font-small)',
    top: 0,
    right: 'var(--v-gap)',
    ...BarCaptionStyle,
    ...StayAboveStyle,
} as StandardLonghandProperties;

const DetailsTableStyle = { display: 'grid', gridTemplateColumns: '1em auto 1fr', columnGap: '1em' };
const OutlierColor = [0, 0, 0] as ColorTuple;

function colorStyle(clr: [r: number, g: number, b: number]) {
    return `rgb(${clr.join(',')})`;
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

class ResidueHeader extends React.Component<{ caption: string, summary: Summarize.Summary }> {
    private tainerRef = React.createRef<HTMLDivElement>();

    render() {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }} ref={this.tainerRef}>
                <div style={{
                        position: 'absolute',
                        zIndex: 1,
                        top: 0,
                        left: 'var(--h-gap)',
                        ...BarCaptionStyle
                    }}
                >
                    {this.props.caption}
                </div>

                <div style={{ height: '1em' }}>
                    <AnglesLengthsBar
                        caption=<div style={ResidueBarCaptionStyle}>L</div>
                        stats={this.props.summary.lengths}
                    />
                </div>
                <div style={{ height: '1em' }}>
                    <AnglesLengthsBar
                        caption=<div style={ResidueBarCaptionStyle}>A</div>
                        stats={this.props.summary.angles}
                    />
                </div>
            </div>
        );
    }
}

export class AnglesLengths extends View {
    private renderResidue(residue: Measurements.Residue, multipleModels: boolean) {
        let residueName = multipleModels
            ? `${residue.modelNum} ${residue.authChain}${residue.authSeqId}`
            : `${residue.authChain}${residue.authSeqId}`;
        residueName += residue.altId ? ` (alt. ${residue.altId})` : '';

        const summary = Summarize.residue(residue);

        return (
            <>
                <CollapsibleVertical
                    header=<ResidueHeader caption={residueName} summary={summary} />
                >
                    <div style={DetailsTableStyle}>
                        <div style={{ gridColumnStart: 'span 3', ...DetailsCaptionStyle }}>Bond lengths</div>
                        {residue.bondLengths.map(x => {
                            const interval = DAnglesLengths.lengthInterval(residue.compound, x);
                            const clr = interval ? colorToTuple(interval.color) : OutlierColor;
                            return (
                                <>
                                    <div style={{ backgroundColor: colorStyle(clr) }} />
                                    <div className='rdo-monospace'>{x.pair[0]} - {x.pair[1]}</div>
                                    <div>{x.length.toFixed(2)}{'\u00A0'}{'\u212B'}</div>
                                </>
                            );
                        })}
                    </div>

                    <div style={DetailsTableStyle}>
                        <div style={{ gridColumnStart: 'span 3', ...DetailsCaptionStyle }}>Bond angles</div>
                        {residue.bondAngles.map(x => {
                            const interval = DAnglesLengths.angleInterval(residue.compound, x);
                            const clr = interval ? colorToTuple(interval.color) : OutlierColor;
                            return (
                                <>
                                    <div style={{ backgroundColor: colorStyle(clr) }} />
                                    <div className='rdo-monospace'>{x.triplet[0]} - {x.triplet[1]} - {x.triplet[2]}</div>
                                    <div>{M.r2d(x.angle).toFixed(1)}{'\u00B0'}</div>
                                </>
                            );
                        })}
                    </div>
                </CollapsibleVertical>
                <div style={{ height: 'calc(var(--v-gap) / 2)' }} />
            </>
        );
    }

    private renderModel(modelIdx: number, chain: string, multipleModels: boolean) {
        const residues = this.selectionToResidues(modelIdx, chain);
        return residues.map(x => this.renderResidue(x, multipleModels));
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
                    <AnglesLengthsBar caption='Lengths' stats={summary.lengths} />
                </div>
                <div style={{ height: '2em' }}>
                    <AnglesLengthsBar caption='Angles' stats={summary.angles} />
                </div>

                <div className='rdo-secondary-caption'>Residues</div>
                {this.renderModel(modelIdx, chain, multipleModels)}
            </div>
        );
    }
}
