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
import { ALMResidueStats, Dnatcofication } from '../../../../dnatco/dnatcofication';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { isShiftedName, unshiftName } from '../../../../dnatco/angles-lengths/atoms';
import { tripletTag, Triplet } from '../../../../dnatco/angles-lengths/angles';
import { isWithin, Bin, Bins } from '../../../../dnatco/angles-lengths/bin';
import { pairTag, Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Serialize } from '../../../../dnatco/angles-lengths/serialize';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { rgbToHex } from '../../../util';
import { GlobalConfig } from '../../../../global-config';
import { htmlColorAsNumber, replaceAll, sequence } from '../../../../util';
import { doDownload, Downloader, FileTypes } from '../../../../util/downloader';
import { Serialization } from '../../../../util/serialization';
import { M } from '../../../../util/math';
import 'assets/imgs/data-transfer-download.svg';

const PairBondNameCache: Map<string, React.ReactElement> = new Map();
const TripletBondNameCache: Map<string, React.ReactElement> = new Map();

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
    gridTemplateColumns: '1em auto auto auto 1fr',
    columnGap: '1em'
};

type AveragesChartDownloader = Downloader<Serialization.Serializable>;
const AveragesChartDownloaders = [
    {
        caption: 'CSV',
        download: function(fileNameStem, data) {
            const text = Serialization.toCsv(data);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.csv,
    },
    {
        caption: 'JSON',
        download: function(fileNameStem, data) {
            const text = Serialization.toJson(data);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.json,
    },
] as AveragesChartDownloader[];

type StatsDownloader = Downloader<{
    residues: Measurements.Residue[],
    counts: {
        angles: Summarize.CountsInGroup[],
        lengths: Summarize.CountsInGroup[]
    }
}>;
const StatsDownloaders = [
    {
        caption: 'CSV',
        download: function(fileNameStem, data) {
            const text = Serialize.toCsv(data.counts.angles, data.counts.lengths, data.residues);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.csv,
    },
    {
        caption: 'JSON',
        download: function(fileNameStem, data) {
            const text = Serialize.toJson(data.counts.angles, data.counts.lengths, data.residues);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.json,
    }
] as StatsDownloader[];

function colorStyle(clr: [r: number, g: number, b: number]) {
    return `rgb(${clr.join(',')})`;
}

function countsInGroups(counts: Summarize.Counts, thresholds: number[]): Summarize.CountsInGroup[] {
    const cig = [];

    for (let idx = 0; idx <= thresholds.length; idx++) {
        const thr = thresholds[idx];
        cig.push({
            threshold: thr ?? 100,
            exclusive: counts.exclusive[idx],
            cumulative: counts.cumulative[idx],
            pGroupIdx: (thr ? idx : 'outlier') as Summarize.CountsInGroup['pGroupIdx'],
        });
    }

    return cig;
}

function fmtDecimal(n: number, decimals: number) {
    const fvdd = M.firstValidDecimalDigit(n);
    return fvdd > decimals ? n.toExponential(decimals - 1) : n.toFixed(decimals);
}

function fileNameFriendlyTag(tag: string) {
    return replaceAll(
        replaceAll(tag, '^', '_'),
        "'",
        'p'
    );
}

function makeBondName(bond: Pair | Triplet) {
    const toks = bond.map(x => isShiftedName(x) ? <span>{unshiftName(x)}<span className='rdo-sup'>(-1)</span></span> : <span>{x}</span>);
    let idx = 1;
    while (idx < toks.length) {
        const tail = toks.splice(idx, toks.length - idx, <span>-</span>);
        toks.push(...tail);
        idx += 2;
    }

    return <span>{...toks}</span>;
}

function pairBondName(p: Pair, tag: string) {
    let name = PairBondNameCache.get(tag);
    if (!name) {
        name = makeBondName(p);
        PairBondNameCache.set(tag, name);
    }

    return name;
}

function renderSubstructureStats(caption: string | JSX.Element, summaryCounts: Summarize.Counts, countsInGroups: Summarize.CountsInGroup[]) {
    return (
        <AnglesLengthsBar
            caption={
                <div style={{ ...StayAboveStyle, top: 0, width: '100%' }}>
                    <Tooltip
                        tag={caption}
                        delayMsec={Constants.TooltipDelayMSec}
                        display='block'
                    >
                        <SubstructureSummary countsInGroups={countsInGroups} />
                    </Tooltip>
                </div>
            }
            counts={summaryCounts}
        />
    );
}

function residueIdentifyingName(structureName: string, r: Measurements.Residue) {
    return `${structureName}-m${r.modelNum}-${r.authChain}-${r.authSeqId}${r.insCode ? `.${r.insCode}` : ''}${r.altId ? `_alt${r.altId}` : ''}_`;
}

function tripletBondName(t: Triplet, tag: string) {
    let name = TripletBondNameCache.get(tag);
    if (!name) {
        name = makeBondName(t);
        TripletBondNameCache.set(tag, name);
    }

    return name;
}

class AnglesLengthsBar extends React.Component<{ caption?: string | React.ReactNode, counts: Summarize.Counts }> {
    private readonly Width = 300;
    private barRef = React.createRef<HTMLCanvasElement>();


    private drawBar(canvas: HTMLCanvasElement, counts: number[]) {
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;

        const sum = counts.reduce((p, c) => p + c, 0);
        const nGroups = DAnglesLengths.pGroupCount();

        const tw = canvas.width;
        const th = canvas.height;
        let x = 0;
        for (let idx = 0; idx < nGroups; idx++) {
            const n = counts[idx];
            if (n === 0)
                continue;

            const w = Math.round(tw * n / sum);

            const clr = DAnglesLengths.pGroupColor(idx);
            ctx.fillStyle = rgbToHex(colorToRgb(clr));
            ctx.fillRect(x, 0, w, th);

            x += w;
        }

        if (counts[nGroups] > 0)
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
            this.drawBar(ref, this.props.counts.exclusive);
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
    downloadFileName?: string,
}> {
    private binsToPGroupIndices(bins: Bins, pGroupDatas: DAnglesLengths.PGroupData[]) {
        const allGroupedBins = pGroupDatas.flatMap(
            (x, idx) => x.groupedBins.map(
                bin => ({ bin: bin, pGroupIdx: idx })
            )
        );

        const indices = [];
        for (const b of bins) {
            const mid = b.from + (b.to - b.from) / 2;

            let pgIdx = -1;
            for (const gb of allGroupedBins) {
                if (isWithin(mid, gb.bin)) {
                    pgIdx = gb.pGroupIdx;
                    break;
                }
            }

            indices.push(pgIdx);
        }

        return indices;
    }

    render() {
        const markerColorTup = colorToTuple(htmlColorAsNumber(GlobalConfig.data().anglesLengths.chartMarkerColor) ?? 0);
        const outlierColor = DAnglesLengths.outlierColor();
        const pGroupIndices = this.binsToPGroupIndices(this.props.bins, this.props.pGroupDatas);

        const color = pGroupIndices.map(pgIdx => {
            const tup = colorToTuple(pgIdx === -1 ? outlierColor : DAnglesLengths.pGroupColor(pgIdx));
            return `$rgb(${tup[0]}, ${tup[1]}, ${tup[2]})`;
        });

        const xt = this.props.bins.map(b => this.props.xTransform ? this.props.xTransform(b.from) : b.from);
        const yt = this.props.bins.map(b => this.props.yTransform ? this.props.yTransform(b.probability) : b.probability);
        const yMax = Math.max(...yt);

        return (
            <div>
                <div className='rdo-dynamic-table-download-bar'>
                    {AveragesChartDownloaders.map((dl, idx) => {
                        return (
                            <div
                                className='rdo-dynamic-table-download-button'
                                onClick={(e) => {
                                    e.nativeEvent.stopImmediatePropagation();
                                    e.stopPropagation();

                                    let markInRange = false;
                                    const actual = new Array<number>();
                                    this.props.bins.forEach(bin => {
                                        if (isWithin(this.props.mark, bin)) {
                                            actual.push(yMax);
                                            markInRange = true;
                                        } else
                                            actual.push(0);
                                    });

                                    const _xt = [...xt];
                                    const _yt = [...yt];
                                    const _pGroupIndices = [...pGroupIndices];

                                    if (!markInRange) {
                                        const bf = this.props.bins[0];

                                        if (this.props.mark < bf.from) {
                                            _xt.unshift(this.props.mark);
                                            _yt.unshift(0);
                                            _pGroupIndices.unshift(-1);
                                            actual.unshift(yMax);
                                        } else {
                                            _xt.push(this.props.mark);
                                            _yt.push(0);
                                            _pGroupIndices.push(-1);
                                            actual.push(yMax);
                                        }
                                    }

                                    const tags = ['x', 'y', 'pGroupIndex', 'actual'];
                                    const values = [
                                        _xt,
                                        _yt,
                                        _pGroupIndices,
                                        actual
                                    ];

                                    dl.download(this.props.downloadFileName ?? 'angle_length_prob_chart', { tags, values });
                                }}
                                key={idx}
                            >
                                <Icon img={`${GlobalConfig.data().pathPrefix}/imgs/data-transfer-download.svg`} size='text' />
                                {dl.caption}
                            </div>
                        );
                    })}
                    <div style={{ flex: 1 }} />
                </div>

                <Plot
                    data={[
                        {
                            x: xt,
                            y: yt,
                            marker: { color: color },
                            hoverinfo: 'none',
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
                        yaxis: { showticklabels: false },
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
            </div>
        );
    }
}

class DownloadButtons extends React.Component<{
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
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
                            dl.download(this.props.fileName, { residues: this.props.residues, counts: this.props.counts });
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
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
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
    rangeFormatter: (v: number) => string,
    residueName: JSX.Element,
    value: number,
    valueFormatter: (v: number) => string,
    xTitle: string,
    yTitle: string,
    suffix?: string,
    xTransform?: (x: number) => number,
    yTransform?: (y: number) => number,
    downloadFileName?: string,
};
class PGroupSummary extends React.Component<PGroupSummaryProps, { mode: 'chart'|'percentile' }> {
    constructor(props: PGroupSummaryProps) {
        super(props);

        this.state = {
            mode: 'chart',
        };
    }

    private makeToggleButton(caption: string, mode: typeof this.state.mode) {
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
            downloadFileName={this.props.downloadFileName}
        />;
    }

    private renderHeader() {
        return (
            <div className='rdo-strong' style={{ display: 'flex', flexDirection: 'row', gap: '0.25em', alignItems: 'center' }}>
                {this.props.residueName}
                <div>|</div>
                {this.props.caption}
                <div style={{ flex: 1 }} />
                <div className='rdo-monospace rdo-text-large'>
                    {this.props.valueFormatter(this.props.value)}{this.props.suffix}
                </div>
            </div>
        );
    }

    private renderPercentile() {
        if (!this.props.pGroup)
            return this.renderPGroup();

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 'var(--h-gap)' }}>
                <div className='rdo-strong'>From</div><div className='rdo-strong'>To</div><div className='rdo-strong'>Probability (%)</div>
                {this.props.pGroup.groupedBins.map((x, idx) => {
                    const strg = isWithin(this.props.value, x) ? 'rdo-strong' : '';
                    const from = this.props.rangeFormatter(x.from);
                    const to = this.props.rangeFormatter(x.to);

                    return (
                        <React.Fragment key={idx}>
                            <div className={`rdo-monospace rdo-talgn-right ${strg}`}>{`${from}${this.props.suffix ?? ''}`}</div>
                            <div className={`rdo-monospace rdo-talgn-right ${strg}`}>{`${to}${this.props.suffix ?? ''}`}</div>
                            <div className={`rdo-monospace rdo-talgn-right ${strg}`}>{(x.probability * 100).toFixed(2)}</div>
                        </React.Fragment>
                    );
                })}
                <div className='rdo-line-spacer' style={{ gridColumnStart: 'span 3' }} />
                <div className='rdo-strong' style={{ gridColumnStart: 'span 2' }}>Percentile</div>
                {this.renderPGroup()}
            </div>
        );
    }

    private renderMain() {
        switch (this.state.mode) {
        case 'chart':
            return this.renderChart();
        case 'percentile':
            return this.renderPercentile();
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
                            {this.makeToggleButton('Percentile', 'percentile')}
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

class Prosco extends React.Component<{ bin: Bin|'below'|'above'|'no-data' }> {
    private renderUnavailable(belowAbove: 'below'|'above') {
        return (
            <Tooltip
                tag=<div className='rdo-monospace rdo-talgn-right'>
                    {belowAbove === 'below' ? 'N/A (<)' : 'N/A (>)'}
                </div>
            >
                <div>
                    Relative probability is unavailable because the value is outside the range of values observed in the reference dataset.
                </div>
            </Tooltip>
        );
    }

    render() {
        const bin = this.props.bin;

        if (bin === 'no-data') {
            <div className='rdo-monospace rdo-talgn-right'>No data</div>
        } else if (bin === 'below' || bin === 'above')
            return this.renderUnavailable(bin);
        else {
            return (
                <Tooltip
                    tag=<div className='rdo-monospace rdo-talgn-right'>
                        {fmtDecimal(bin.prosco, 3)}
                    </div>
                >
                    <div>
                        {this.props.bin
                            ? `Relative probability of bin [${bin.from}\u00A0-\u00A0${bin.to}] within its respective distribution.`
                            : 'Relative probability is unavailable because the value is outside the range of values observed in the reference dataset.'
                        }
                    </div>
                </Tooltip>
            );
        }
    }
}

class ResidueHeader extends React.Component<{
    caption: string | JSX.Element,
    residue: Measurements.Residue,
    structureName: string,
    summary: Summarize.Summary,
    countsAngles: Summarize.CountsInGroup[],
    countsLengths: Summarize.CountsInGroup[]
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
                    downloaders={StatsDownloaders}
                    name={residueIdentifyingName(this.props.structureName, r)}
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

class SubstructureSummary extends React.Component<{ countsInGroups: Summarize.CountsInGroup[] }> {
    render() {
        const maxDecimals = Math.max(...this.props.countsInGroups.map(x => {
            const s = x.threshold.toString();
            const dot = s.indexOf('.');
            return dot >= 0 ? s.substring(dot + 1).length : 0;
        }));
        const outlierColor = DAnglesLengths.outlierColor();
        const total = this.props.countsInGroups[this.props.countsInGroups.length - 1].cumulative;

        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1em auto auto auto', columnGap: 'var(--h-gap)' }}>
                <div style={{ gridColumnStart: 'span 2' }} />
                <div className='rdo-strong' style={{ gridColumn: '3 / span 2', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>Counts</div>

                <div className='rdo-strong' style={{ gridColumnStart: 'span 2 '}}>
                    Percentile
                </div>
                <div className='rdo-strong'>
                    Exclusive
                </div>
                <div className='rdo-strong'>
                    Cumulative
                </div>
                {this.props.countsInGroups.map((x, idx) => {
                    const thr = x.pGroupIdx === 'outlier' ? 'Outliers' : x.threshold.toFixed(maxDecimals);
                    const clr = DAnglesLengths.pGroupColor(idx) ?? outlierColor;
                    const perc = 100 * (x.cumulative / total);
                    return (
                        <React.Fragment key={idx}>
                            <div style={{ backgroundColor: colorStyle(colorToTuple(clr)) }} />
                            <div className='rdo-monospace rdo-talgn-right'>{thr}</div>
                            <div className='rdo-monospace rdo-talgn-right' style={{ textAlign: 'right' }}>{x.exclusive}</div>
                            <div className='rdo-monospace rdo-talgn-right' style={{ textAlign: 'right' }}>{`${x.cumulative}\u00A0(${perc.toFixed(2)}\u00A0%)`}</div>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
}

export class AnglesLengths extends View {
    static readonly unscrollableContainer = true;

    private renderResidue(residue: Measurements.Residue, residueStats: ALMResidueStats, multipleModels: boolean, thresholds: number[]) {
        const countsAngles = countsInGroups(residueStats.summary.angles, thresholds);
        const countsLenghts = countsInGroups(residueStats.summary.lengths, thresholds);
        const residueName = this.renderResidueName(residue, multipleModels);
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);
        const structureName = this.props.dnatcofication.identifyingName ?? this.props.dnatcofication.pdbId;

        return (
            <>
                <CollapsibleVertical
                    header=<ResidueHeader
                        caption={residueName}
                        residue={residue}
                        summary={residueStats.summary}
                        structureName={structureName}
                        countsAngles={countsAngles}
                        countsLengths={countsLenghts}
                    />
                >
                    <div style={DetailsTableStyle}>
                        <div style={{ gridColumnStart: 'span 5', ...DetailsCaptionStyle }}>Bond lengths</div>
                        {residue.bondLengths.map((x, idx) => {
                            const bin = residueStats.lengths[idx].bin;
                            const pgrp = residueStats.lengths[idx].pGroup;
                            const clr = pgrp ? colorToTuple(pgrp.color) : outlierColor;
                            const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.lengthPGroupData(idx, residue.compound, x.pair)!);
                            const dlName = `${residueIdentifyingName(structureName, residue)}${fileNameFriendlyTag(pairTag(x.pair))}`;

                            return (
                                <React.Fragment key={idx}>
                                    <Tooltip
                                        tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                                        delayMsec={Constants.TooltipDelayMSec}
                                        display='block'
                                    >
                                        <PGroupSummary
                                            bins={DAnglesLengths.lengthAverages(residue.compound, x.pair)!}
                                            caption={pairBondName(x.pair, x.tag)}
                                            pGroup={pgrp}
                                            pGroupDatas={pgrpDatas}
                                            rangeFormatter={(v) => v.toFixed(3)}
                                            residueName={residueName}
                                            suffix={'\u00A0\u212B'}
                                            value={x.length}
                                            valueFormatter={(v) => v.toFixed(3)}
                                            xTitle={'Length (\u212B)'}
                                            yTitle='Prob. (%)'
                                            yTransform={(y) => y * 100}
                                            downloadFileName={dlName}
                                        />
                                    </Tooltip>
                                    {pairBondName(x.pair, x.tag)}
                                    <div className='rdo-monospace rdo-talgn-right'>
                                        {x.length.toFixed(3)}{'\u00A0\u212B'}
                                    </div>
                                    <Prosco bin={bin} />
                                    <div />
                                </React.Fragment>
                            );
                        })}

                        <div style={{ gridColumnStart: 'span 5', ...DetailsCaptionStyle }}>Bond angles</div>
                        {residue.bondAngles.map((x, idx) => {
                            const bin = residueStats.angles[idx].bin;
                            const pgrp = residueStats.angles[idx].pGroup;
                            const clr = pgrp ? colorToTuple(pgrp.color) : outlierColor;
                            const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.anglePGroupData(idx, residue.compound, x.triplet)!);
                            const dlName = `${residueIdentifyingName(structureName, residue)}_${fileNameFriendlyTag(tripletTag(x.triplet))}`;

                            return (
                                <React.Fragment key={idx}>
                                    <Tooltip
                                        tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                                        delayMsec={Constants.TooltipDelayMSec}
                                        display='block'
                                    >
                                        <PGroupSummary
                                            bins={DAnglesLengths.angleAverages(residue.compound, x.triplet)!}
                                            caption={tripletBondName(x.triplet, x.tag)}
                                            pGroup={pgrp}
                                            pGroupDatas={pgrpDatas}
                                            rangeFormatter={(v) => M.r2d(v).toFixed(2)}
                                            residueName={residueName}
                                            suffix={'\u00B0'}
                                            value={x.angle}
                                            valueFormatter={(v) => M.r2d(v).toFixed(2)}
                                            xTitle={'Angle (\u00B0)'}
                                            yTitle='Prob. (%)'
                                            xTransform={(x) => M.r2d(x)}
                                            yTransform={(y) => y * 100}
                                            downloadFileName={dlName}
                                        />
                                    </Tooltip>
                                    {tripletBondName(x.triplet, x.tag)}
                                    <div className='rdo-monospace rdo-talgn-right'>
                                        {M.r2d(x.angle).toFixed(2)}{'\u00B0'}
                                    </div>
                                    <Prosco bin={bin} />
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

    private renderModel(resSel: { residues: Measurements.Residue[], stats: ALMResidueStats[] }, multipleModels: boolean, thresholds: number[]) {
        const elems = [];
        for (let idx = 0; idx < resSel.residues.length; idx++) {
            const residue = resSel.residues[idx];
            const stats = resSel.stats[idx];

            const e = this.renderResidue(residue, stats, multipleModels, thresholds);
            elems.push(e);
        }

        return elems;
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

    private selectionToResidues(modelIdx: number, chain: string): { residues: Measurements.Residue[], stats: ALMResidueStats[] } {
        const alm = this.props.dnatcofication.data.alm;
        if (modelIdx === InvalidModelIndex) {
            return { residues: alm.residues, stats: alm.stats };
        } else {
            const modelNum = this.props.dnatcofication.data.structures[0].models[modelIdx].num;

            if (chain) {
                const cm = alm.chains.get(modelNum)?.get(chain) ?? [];

                const residues = [];
                const stats  = [];
                for (const x of cm) {
                    residues.push(alm.residues[x]);
                    stats.push(alm.stats[x]);
                }

                return { residues, stats };
            } else {
                const mm = alm.models.get(modelNum) ?? [];

                const residues = [];
                const stats  = [];
                for (const x of mm) {
                    residues.push(alm.residues[x]);
                    stats.push(alm.stats[x]);
                }

                return { residues, stats };
            }
        }
    }

    render() {
        const multipleModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
        const modelIdx = this.props.structureSelection.modelIndex;
        const chain = this.props.structureSelection.chain === InvalidChain ? '' : this.props.structureSelection.chain;

        const resSel = this.selectionToResidues(modelIdx, chain)
        const summary = Summarize.substructure(resSel.residues);
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
                    downloaders={StatsDownloaders}
                    name={this.selectionName(multipleModels, modelIdx, chain)}
                    residues={resSel.residues}
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

                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header=<div className='rdo-secondary-caption'>Residues</div>
                        style={ Common.VScrollJail }
                    >
                        <div style={ Common.VScrollElement }>
                            <div className='rdo-scroll-vertically'>
                                {...this.renderModel(resSel, multipleModels, thresholds)}
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>
            </div>
        );
    }
}
