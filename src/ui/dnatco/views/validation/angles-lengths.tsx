import type { StandardLonghandProperties } from 'csstype';
import Plot from 'react-plotly.js';
import React from 'react';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Constants } from '../../constants';
import { InvalidChain, InvalidModelIndex } from '../../structure-selection';
import { Common } from '../../common';
import { colorToRgb, colorToTuple } from '../../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Icon } from '../../../common/icon';
import { ToggleButton } from '../../../common/push-button';
import { Tooltip } from '../../../common/tooltip';
import { Dnatcofication  } from '../../../../dnatco/dnatcofication';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { isShiftedName, unshiftName } from '../../../../dnatco/angles-lengths/atoms';
import { Triplet } from '../../../../dnatco/angles-lengths/angles';
import { Bins, isWithin } from '../../../../dnatco/angles-lengths/bin';
import { Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Serialize } from '../../../../dnatco/angles-lengths/serialize';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { rgbToHex } from '../../../util';
import { GlobalConfig } from '../../../../global-config';
import { htmlColorAsNumber, sequence } from '../../../../util';
import { M } from '../../../../util/math';
import { Net } from '../../../../util/net';
import 'assets/imgs/data-transfer-download.svg';

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

type Downloader = {
    caption: string;
    download: (fileName: string, residues: Measurements.Residue[], counts: { angles: Summarize.CountInGroup[], lengths: Summarize.CountInGroup[] }) => void;
    suffix: string,
};
const Downloaders = [
    {
        caption: 'CSV',
        download: (fileName, residues, counts) => {
            const text = Serialize.toCsv(counts.angles, counts.lengths, residues);
            Net.serveFile('text/csv', text, `${fileName}.csv`);
        },
    },
    {
        caption: 'JSON',
        download: (fileName, residues, counts) => {
            const text = Serialize.toJson(counts.angles, counts.lengths, residues);
            Net.serveFile('application/json', text, `${fileName}.json`);
        },
    }
] as Downloader[];

function bondName(bond: Pair | Triplet) {
    const toks = bond.map(x => isShiftedName(x) ? <span>{unshiftName(x)}<span className='rdo-sup'>(-1)</span></span> : <span>{x}</span>);
    let idx = 1;
    while (idx < toks.length) {
        const tail = toks.splice(idx, toks.length - idx, <span>-</span>);
        toks.push(...tail);
        idx += 2;
    }

    return <span>{...toks}</span>;
}

function colorStyle(clr: [r: number, g: number, b: number]) {
    return `rgb(${clr.join(',')})`;
}

function countsInGroups(stats: number[], thresholds: number[]): Summarize.CountInGroup[] {
    return stats.map((v, idx) => {
        const thr = thresholds[idx];
        return { threshold: thr ?? 'outlier', count: v, group: idx };
    });
}

function renderSubstructureStats(caption: string | JSX.Element, summaryStats: number[], counts: Summarize.CountInGroup[]) {
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
        const nGroups = DAnglesLengths.pGroupCount();

        const tw = canvas.width;
        const th = canvas.height;
        let x = 0;
        for (let idx = 0; idx < nGroups; idx++) {
            const n = stats[idx];
            if (n === 0)
                continue;

            const w = Math.round(tw * n / sum);

            const clr = DAnglesLengths.pGroupColor(idx);
            ctx.fillStyle = rgbToHex(colorToRgb(clr));
            ctx.fillRect(x, 0, w, th);

            x += w;
        }

        if (stats[nGroups] > 0)
            ctx.fillStyle = rgbToHex(colorToRgb(DAnglesLengths.outlierColor()));
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

class AveragesChart extends React.Component<{
    bins: Bins,
    pGroupDatas: DAnglesLengths.PGroupData[],
    mark: number,
    xTitle: string,
    yTitle: string,
    xTransform?: (x: number) => number;
    yTransform?: (y: number) => number;
}> {
    render() {
        const markerColorTup = colorToTuple(htmlColorAsNumber(GlobalConfig.data().anglesLengths.chartMarkerColor) ?? 0);
        const outlierColor = DAnglesLengths.outlierColor();

        const allGroupedBins = this.props.pGroupDatas.flatMap(
            (x, idx) => x.groupedBins.map(
                bin => ({ bin: bin, pGroupIdx: idx })
            )
        );
        const color = this.props.bins.map(b => {
            const mid = b.from + (b.to - b.from) / 2;

            let clr = outlierColor;
            for (const gb of allGroupedBins) {
                if (isWithin(mid, gb.bin)) {
                    clr = DAnglesLengths.pGroupColor(gb.pGroupIdx);
                    break;
                }
            }

            const tup = colorToTuple(clr);
            return `$rgb(${tup[0]}, ${tup[1]}, ${tup[2]})`;
        });

        const yt = this.props.bins.map(b => this.props.yTransform ? this.props.yTransform(b.probability) : b.probability);
        const yMax = Math.max(...yt);;

        return (
            <Plot
                data={[
                    {
                        x: this.props.bins.map(b => this.props.xTransform ? this.props.xTransform(b.from) : b.from),
                        y: yt,
                        marker: { color: color },
                        type: 'bar',
                        showlegend: false,
                    },
                    {
                        x: [this.props.mark, this.props.mark],
                        y: [0, yMax],
                        type: 'scattergl',
                        mode: 'lines',
                        line: {
                            color: `rgb(${markerColorTup[0]}, ${markerColorTup[1]}, ${markerColorTup[2]})`,
                            width: 2,
                        },
                        hoverinfo: 'none',
                        showlegend: false,
                    },
                ]}
                layout={{
                    autosize: true,
                    bargap: 0,
                    dragmode: 'pan',
                    hovermode: 'closest',
                    margin: { t: 0, l: 45, b: 45, r: 0 },
                    xaxis: { title: this.props.xTitle },
                    yaxis: { title: this.props.yTitle },
                    plot_bgcolor: 'white',
                    paper_bgcolor: 'white',
                }}
                config={{
                    displayModeBar: false,
                    scrollZoom: true,
                }}
                style={{
                    width: '30em',
                    height: '30em',
                    margin: 0
                }}
            />
        );
    }
}

class DownloadButtons extends React.Component<{
    counts: { angles: Summarize.CountInGroup[], lengths: Summarize.CountInGroup[] },
    downloaders: Downloader[],
    fileName: string,
    residues: Measurements.Residue[],
}> {
    render() {
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {this.props.downloaders.map((dl, idx) => (
                    <div
                        key={idx}
                        className='rdo-dynamic-table-download-button'
                        style={{ flex: 1 }}
                        onClick={e => {
                            e.stopPropagation();
                            dl.download(this.props.fileName, this.props.residues, this.props.counts);
                    }}>
                        <Icon img={`${prefix}/imgs/data-transfer-download.svg`} size='text' />
                        {dl.caption}
                    </div>
                ))}
            </div>
        );
    }
}

class OverallStatsBar extends React.Component<{
    children: React.ReactNode,
    counts: { angles: Summarize.CountInGroup[], lengths: Summarize.CountInGroup[] },
    downloaders: Downloader[],
    name: string,
    residues: Measurements.Residue[],
    style?: StandardLonghandProperties
}> {
    render() {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 'calc(var(--v-gap) / 2)', ...this.props.style }}>
                {this.props.children}
                <DownloadButtons
                    counts={this.props.counts}
                    downloaders={this.props.downloaders}
                    fileName={`${this.props.name}angles_lenghts`}
                    residues={this.props.residues}
                />
            </div>
        );
    }
}

type PGroupSummaryProps = {
    bins: Bins,
    caption: string | JSX.Element,
    pGroup: DAnglesLengths.PGroup,
    pGroupDatas: DAnglesLengths.PGroupData[],
    ranges: { from: string, to: string, probability: number }[],
    residueName: JSX.Element,
    value: number,
    xTitle: string,
    yTitle: string,
    suffix?: string,
    xTransform?: (x: number) => number,
    yTransform?: (y: number) => number,
};
class PGroupSummary extends React.Component<PGroupSummaryProps, { mode: 'chart'|'list' }> {
    constructor(props: PGroupSummaryProps) {
        super(props);

        this.state = {
            mode: 'chart',
        };
    }

    private makeToggleButton(caption: string, mode: 'chart'|'list') {
        return (
            <ToggleButton
                    caption={caption}
                    onClick={e => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        if (mode !== this.state.mode)
                            this.setState({ ...this.state, mode });
                    }}
                    selected={this.state.mode === mode}
            />
        );
    }

    private renderChart() {
        return <AveragesChart
            bins={this.props.bins}
            mark={this.props.value}
            pGroupDatas={this.props.pGroupDatas}
            xTitle={this.props.xTitle}
            yTitle={this.props.yTitle}
            xTransform={this.props.xTransform}
            yTransform={this.props.yTransform}
        />;
    }

    private renderHeader() {
        return (
            <div className='rdo-strong' style={{ display: 'flex', flexDirection: 'row', gap: '0.25em', alignItems: 'center' }}>
                {this.props.residueName}
                <div>|</div>
                {this.props.caption}
                <div style={{ flex: 1 }} />
                <div className='rdo-monospace rdo-text-large'>{this.props.value.toFixed(3)}{this.props.suffix}</div>
            </div>
        );
    }

    private renderList() {
        if (!this.props.pGroup)
            return this.renderPGroup();

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 'var(--h-gap)' }}>
                <div className='rdo-strong'>From</div><div className='rdo-strong'>To</div><div className='rdo-strong'>Probability (%)</div>
                {this.props.ranges.map((x, idx) => (
                    <React.Fragment key={idx}>
                        <div className='rdo-monospace rdo-talgn-right'>{`${x.from}${this.props.suffix ?? ''}`}</div>
                        <div className='rdo-monospace rdo-talgn-right'>{`${x.to}${this.props.suffix ?? ''}`}</div>
                        <div className='rdo-monospace rdo-talgn-right'>{x.probability.toFixed(4)}</div>
                    </React.Fragment>
                ))}
                <div className='rdo-line-spacer' style={{ gridColumnStart: 'span 3' }} />
                <div className='rdo-strong' style={{ gridColumnStart: 'span 2' }}>Total prob. (%)</div>
                {this.renderPGroup()}
            </div>
        );
    }

    private renderMain() {
        switch (this.state.mode) {
        case 'chart':
            return this.renderChart();
        case 'list':
            return this.renderList();
        }
    }

    private renderPGroup() {
        const clr = colorToTuple(this.props.pGroup ? this.props.pGroup.color : DAnglesLengths.outlierColor());
        const text = this.props.pGroup ? this.props.pGroup.threshold.toFixed(4) : 'Outlier';

        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1em 1fr' }}>
                <div style={{ backgroundColor: colorStyle(clr) }} />
                <div className='rdo-monospace rdo-talgn-right'>{text}</div>
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.renderHeader()}
                <div style={{ height: 'calc(var(--h-gap) / 2)' }} />

                <div style={{ display: 'flex' }}>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
                            {this.makeToggleButton('Chart', 'chart')}
                        </div>
                        <div style={{ flex: 1 }}>
                            {this.makeToggleButton('List', 'list')}
                        </div>
                    </div>
                    <div style={{ flex: 1 }} />
                </div>

                <div style={{ height: 'calc(var(--h-gap) / 2)' }} />
                {this.renderMain()}
            </div>
        );
    }
}

class ResidueHeader extends React.Component<{
    caption: string | JSX.Element,
    residue: Measurements.Residue,
    structureName: string,
    summary: Summarize.Summary,
    countsAngles: Summarize.CountInGroup[],
    countsLengths: Summarize.CountInGroup[]
}> {
    private tainerRef = React.createRef<HTMLDivElement>();

    render() {
        const r = this.props.residue;

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

                <OverallStatsBar
                    counts={{ angles: this.props.countsAngles, lengths: this.props.countsLengths }}
                    downloaders={Downloaders}
                    name={`${this.props.structureName}-m${r.modelNum}-${r.authChain}-${r.authSeqId}${r.insCode ? `.${r.insCode}` : ''}${r.altId ? `_alt${r.altId}` : ''}_`}
                    residues={[this.props.residue]}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={ResidueBarCaptionStyle}>L</div>, this.props.summary.lengths, this.props.countsLengths)}
                        </div>
                        <div style={{ flex: '1' }}>
                            {renderSubstructureStats(<div style={ResidueBarCaptionStyle}>A</div>, this.props.summary.angles, this.props.countsAngles)}
                        </div>
                    </div>
                </OverallStatsBar>
            </div>
        );
    }
}

class SubstructureSummary extends React.Component<{ stats: { threshold: number|'outlier', count: number }[] }> {
    render() {
        const maxDecimals = Math.max(...this.props.stats.map(x => {
            const s = x.threshold.toString();
            const dot = s.indexOf('.');
            return dot >= 0 ? s.substring(dot + 1).length : 0;
        }));
        const outlierColor = DAnglesLengths.outlierColor();

        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1em auto auto', columnGap: 'var(--h-gap)' }}>
                <div className='rdo-strong' style={{ gridColumnStart: 'span 2 '}}>Probability (%)</div><div className='rdo-strong'>Count</div>
                {this.props.stats.map((x, idx) => {
                    const thr = x.threshold === 'outlier' ? 'Outlier' : x.threshold.toFixed(maxDecimals);
                    const clr = DAnglesLengths.pGroupColor(idx) ?? outlierColor;
                    return (
                        <React.Fragment key={idx}>
                            <div style={{ backgroundColor: colorStyle(colorToTuple(clr)) }} />
                            <div className='rdo-monospace rdo-talgn-right'>{thr}</div>
                            <div className='rdo-monospace rdo-talgn-right' style={{ textAlign: 'right' }}>{x.count}</div>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
}

export class AnglesLengths extends View {
    static readonly unscrollableContainer = true;

    private renderResidue(residue: Measurements.Residue, multipleModels: boolean, thresholds: number[]) {
        const summary = Summarize.residue(residue);
        const countsAngles = countsInGroups(summary.angles, thresholds);
        const countsLenghts = countsInGroups(summary.lengths, thresholds);
        const residueName = this.renderResidueName(residue, multipleModels);
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        return (
            <>
                <CollapsibleVertical
                    header=<ResidueHeader
                        caption={residueName}
                        residue={residue}
                        summary={summary}
                        structureName={this.props.dnatcofication.identifyingName ?? this.props.dnatcofication.pdbId}
                        countsAngles={countsAngles}
                        countsLengths={countsLenghts}
                    />
                >
                    <div style={DetailsTableStyle}>
                        <div style={{ gridColumnStart: 'span 4', ...DetailsCaptionStyle }}>Bond lengths</div>
                        {residue.bondLengths.map((x, idx) => {
                            const pgrp = DAnglesLengths.lengthPGroup(residue.compound, x);
                            const clr = pgrp ? colorToTuple(pgrp.color) : outlierColor;
                            const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.lengthPGroupData(idx, residue.compound, x.pair)!);

                            return (
                                <React.Fragment key={idx}>
                                    <Tooltip
                                        tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                                        delayMsec={Constants.TooltipDelayMSec}
                                        display='block'
                                    >
                                        <PGroupSummary
                                            bins={DAnglesLengths.lengthAverages(residue.compound, x.pair)!}
                                            caption={bondName(x.pair)}
                                            pGroup={pgrp}
                                            pGroupDatas={pgrpDatas}
                                            ranges={pgrp
                                                ? pgrp.groupedBins.map(x => ({
                                                    from: x.from.toFixed(3),
                                                    to: x.to.toFixed(3),
                                                    probability: x.probability,
                                                }))
                                                : []
                                            }
                                            residueName={residueName}
                                            suffix={'\u00A0\u212B'}
                                            value={x.length}
                                            xTitle={'Length (\u212B)'}
                                            yTitle='Prob. (%)'
                                            yTransform={(y) => y * 100}
                                        />
                                    </Tooltip>
                                    {bondName(x.pair)}
                                    <div className='rdo-monospace'>{x.length.toFixed(3)}{'\u00A0\u212B'}</div>
                                    <div />
                                </React.Fragment>
                            );
                        })}

                        <div style={{ gridColumnStart: 'span 4', ...DetailsCaptionStyle }}>Bond angles</div>
                        {residue.bondAngles.map((x, idx) => {
                            const pgrp = DAnglesLengths.anglePGroup(residue.compound, x);
                            const clr = pgrp ? colorToTuple(pgrp.color) : outlierColor;
                            const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.anglePGroupData(idx, residue.compound, x.triplet)!);

                            return (
                                <React.Fragment key={idx}>
                                    <Tooltip
                                        tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                                        delayMsec={Constants.TooltipDelayMSec}
                                        display='block'
                                    >
                                        <PGroupSummary
                                            bins={DAnglesLengths.angleAverages(residue.compound, x.triplet)!}
                                            caption={bondName(x.triplet)}
                                            pGroup={pgrp}
                                            pGroupDatas={pgrpDatas}
                                            ranges={pgrp
                                                ? pgrp.groupedBins.map(x => ({
                                                    from: M.r2d(x.from).toFixed(2),
                                                    to: M.r2d(x.to).toFixed(2),
                                                    probability: x.probability,
                                                }))
                                                : []
                                            }
                                            residueName={residueName}
                                            suffix={'\u00B0'}
                                            value={M.r2d(x.angle)}
                                            xTitle={'Angle (\u00B0)'}
                                            yTitle='Prob. (%)'
                                            xTransform={(x) => M.r2d(x)}
                                            yTransform={(y) => y * 100}
                                        />
                                    </Tooltip>
                                    {bondName(x.triplet)}
                                    <div className='rdo-monospace rdo-talgn-right'>{M.r2d(x.angle).toFixed(2)}{'\u00B0'}</div>
                                    <div />
                                </React.Fragment>
                            );
                        })}
                    </div>
                </CollapsibleVertical>
                <div style={{ height: 'calc(var(--v-gap) / 2)' }} />
            </>
        );
    }

    private renderResidueName(r: Measurements.Residue, multipleModels: boolean) {
        let inner = [];

        if (multipleModels) {
            inner.push(<span className='rdo-nice-step-model'>M{r.modelNum}</span>);
            inner.push(<span>{'\u00A0'}</span>);
        }

        inner.push(<span>{r.authChain}</span>);
        inner.push(<span>{'\u00A0'}</span>);
        inner.push(<span className='rdo-nice-step-base' style={{ fontWeight: BarCaptionStyle.fontWeight }}>{r.compound}</span>);
        inner.push(<span>{r.authSeqId}</span>);
        if (r.altId)
            inner.push(<span className='rdo-nice-step-altpos'>(alt. {r.altId})</span>);

        return <div>{...inner}</div>;
    }

    private renderModel(modelIdx: number, chain: string, multipleModels: boolean, thresholds: number[]) {
        const residues = this.selectionToResidues(modelIdx, chain);
        return residues.map(x => this.renderResidue(x, multipleModels, thresholds));
    }

    private selectionName(multipleModels: boolean, modelIdx: number, chain: string) {
        let name = multipleModels
            ? modelIdx === InvalidModelIndex
                ? '' : `m${this.props.dnatcofication.data.structures[0].models[modelIdx].num}`
            : '';
        name += chain === InvalidChain
            ? ''
            : name ? `-${chain}` : chain;

        return `${this.props.dnatcofication.identifyingName ?? this.props.dnatcofication.pdbId}_${name ? `${name}_` : ''}`;
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

        const residues = this.selectionToResidues(modelIdx, chain)
        const summary = Summarize.substructure(residues);
        const thresholds = DAnglesLengths.pGroupThresholds();

        const countsAngles = countsInGroups(summary.angles, thresholds);
        const countsLenghts = countsInGroups(summary.lengths, thresholds);

        return (
            <div style={ Common.VScrollJail }>
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
                <OverallStatsBar
                    counts={{ angles: countsAngles, lengths: countsLenghts }}
                    downloaders={Downloaders}
                    name={this.selectionName(multipleModels, modelIdx, chain)}
                    residues={residues}
                    style={{ height: '4em' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={{ ...BarCaptionStyle, left: 'calc(var(--h-gap) / 2)' }}>Lengths</div>, summary.lengths, countsLenghts)}
                        </div>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={{ ...BarCaptionStyle, left: 'calc(var(--h-gap) / 2)' }}>Angles</div>, summary.angles, countsAngles)}
                        </div>
                    </div>
                </OverallStatsBar>

                <div className='rdo-secondary-caption'>Residues</div>
                <div style={ Common.VScrollElement }>
                    <div className='rdo-scroll-vertically'>
                        {...this.renderModel(modelIdx, chain, multipleModels, thresholds)}
                    </div>
                </div>
            </div>
        );
    }
}
