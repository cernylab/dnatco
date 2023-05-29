import Plot from 'react-plotly.js';
import React from 'react';
import { Subject } from 'rxjs';
import type { StandardLonghandProperties } from 'csstype';
import { View } from '../view';
import {
    InvalidAtom, InvalidChain, InvalidModelIndex,
    CifAtom, CifResidue,
    SelectedPieces,
    StructureSelection,
} from '../../structure-selection';
import { Colors } from '../../colors';
import { StatsBar } from '../../stats-bar';
import { Constants } from '../../constants';
import { Icon } from '../../../common/icon';
import { ToggleButton } from '../../../common/push-button';
import { Tooltip } from '../../../common/tooltip';
import { colorStyle, colorToTuple } from '../../../util';
import { ALM } from '../../../../dnatco/alm';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { shiftedName } from '../../../../dnatco/angles-lengths/atoms';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { tripletTag, Triplet } from '../../../../dnatco/angles-lengths/angles';
import { isShiftedName, unshiftName } from '../../../../dnatco/angles-lengths/atoms';
import { Bins } from '../../../../dnatco/angles-lengths/bin';
import { pairTag, Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Naval } from '../../../../dnatco/naval';
import { Validation } from '../../../../dnatco/naval/validation';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { Residues } from '../../../../dnatco/residues';
import { GlobalConfig } from '../../../../global-config';
import { htmlColorAsNumber, isWithin, replaceAll } from '../../../../util';
import { doDownload, Downloader, FileTypes } from '../../../../util/downloader';
import { M } from '../../../../util/math';
import { Serialization } from '../../../../util/serialization';
import { ViewerApi, ViewerInterop } from '../../../../viewer/viewer-interop';

const PairBondNameCache: Map<string, React.ReactElement> = new Map();
const TripletBondNameCache: Map<string, React.ReactElement> = new Map();

const BackboneAnglesOrder = [
    tripletTag([shiftedName("C3'", -1), shiftedName("O3'", -1), "P"]),
    tripletTag([shiftedName("O3'", -1), "P", "OP1"]),
    tripletTag([shiftedName("O3'", -1), "P", "OP2"]),
    tripletTag(["OP1", "P", "OP2"]),
    tripletTag([shiftedName("O3'", -1), "P", "O5'"]),
    tripletTag(["P", "O5'", "C5'"]),
    tripletTag(["O5'", "C5'", "C4'"]),
    tripletTag(["C5'", "C4'", "C3'"]),
    tripletTag(["C4'", "C3'", "O3'"]),
];

const RiboseRingAnglesOrder = [
    tripletTag(["C4'", "O4'", "C1'"]),
    tripletTag(["O4'", "C1'", "C2'"]),
    tripletTag(["C1'", "C2'", "C3'"]),
    tripletTag(["C2'", "C3'", "C4'"]),
    tripletTag(["C3'", "C4'", "O4'"]),
];

const AdenineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    tripletTag(["O4'", "C1'", "N9"]),
    tripletTag(["C1'", "N9", "C8"]),
    tripletTag(["N7", "C8", "N9"]),
    tripletTag(["C5", "N7", "C8"]),
    tripletTag(["C4", "C5", "N7"]),
    tripletTag(["N1", "C6", "C5"]),
    tripletTag(["N1", "C6", "N6"]),
    tripletTag(["N6", "C6", "C5"]),
    tripletTag(["C2", "N1", "C6"]),
    tripletTag(["N3", "C2", "N1"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["N9", "C4", "C5"]),
    tripletTag(["C8", "N9", "C4"]),
    tripletTag(["C1'", "N9", "C4"]),
    tripletTag(["C2'", "C1'", "N9"]),
];

const CytidineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    tripletTag(["O4'", "C1'", "N1"]),
    tripletTag(["C1'", "N1", "C6"]),
    tripletTag(["C5", "C6", "N1"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["N4", "C4", "C5"]),
    tripletTag(["N3", "C4", "N4"]),
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["N1", "C2", "N3"]),
    tripletTag(["O2", "C2", "N3"]),
    tripletTag(["N1", "C2", "O2"]),
    tripletTag(["C1'", "N1", "C2"]),
    tripletTag(["C2'", "C1'", "N1"]),
];

const GuanosineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    tripletTag(["O4'", "C1'", "N9"]),
    tripletTag(["C1'", "N9", "C8"]),
    tripletTag(["N7", "C8", "N9"]),
    tripletTag(["C5", "N7", "C8"]),
    tripletTag(["C4", "C5", "N7"]),
    tripletTag(["N1", "C6", "C5"]),
    tripletTag(["O6", "C6", "C5"]),
    tripletTag(["N1", "C6", "O6"]),
    tripletTag(["C2", "N1", "C6"]),
    tripletTag(["N3", "C2", "N1"]),
    tripletTag(["N2", "C2", "N1"]),
    tripletTag(["N3", "C2", "N2"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["N9", "C4", "C5"]),
    tripletTag(["C8", "N9", "C4"]),
    tripletTag(["C1'", "N9", "C4"]),
    tripletTag(["C2'", "C1'", "N9"]),
];

const ThymineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    tripletTag(["O4'", "C1'", "N1"]),
    tripletTag(["C1'", "N1", "C6"]),
    tripletTag(["C5", "C6", "N1"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["C7", "C5", "C6"]),
    tripletTag(["C4", "C5", "C7"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["O4", "C4", "C5"]),
    tripletTag(["N3", "C4", "O4"]),
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["N1", "C2", "N3"]),
    tripletTag(["O2", "C2", "N3"]),
    tripletTag(["N1", "C2", "O2"]),
    tripletTag(["C1'", "N1", "C2"]),
    tripletTag(["C2'", "C1'", "N1"]),

];

const UracilAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    tripletTag(["O4'", "C1'", "N1"]),
    tripletTag(["C1'", "N1", "C6"]),
    tripletTag(["C5", "C6", "N1"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["O4", "C4", "C5"]),
    tripletTag(["N3", "C4", "O4"]),
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["N1", "C2", "N3"]),
    tripletTag(["O2", "C2", "N3"]),
    tripletTag(["N1", "C2", "O2"]),
    tripletTag(["C1'", "N1", "C2"]),
    tripletTag(["C2'", "C1'", "N1"]),
];

const BackboneLengthsOrder = [
    pairTag([shiftedName("O3'", -1), "P"]),
    pairTag(["P", "OP1"]),
    pairTag(["P", "OP2"]),
    pairTag(["P", "O5'"]),
    pairTag(["O5'", "C5'"]),
    pairTag(["C5'", "C4'"]),
    pairTag(["C4'", "C3'"]),
    pairTag(["C3'", "O3'"]),
];

const RiboseRingLengthsOrder = [
    pairTag(["C4'", "O4'"]),
    pairTag(["O4'", "C1'"]),
    pairTag(["C1'", "C2'"]),
    pairTag(["C2'", "C3'"]),
];

const AdenineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N9"]),
    pairTag(["C8", "N9"]),
    pairTag(["N7", "C8"]),
    pairTag(["C5", "N7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C6", "C5"]),
    pairTag(["C6", "N6"]),
    pairTag(["N1", "C6"]),
    pairTag(["C2", "N1"]),
    pairTag(["N3", "C2"]),
    pairTag(["C4", "N3"]),
];

const CytidineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "N4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const GuanosineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N9"]),
    pairTag(["C8", "N9"]),
    pairTag(["N7", "C8"]),
    pairTag(["C5", "N7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C6", "C5"]),
    pairTag(["C6", "O6"]),
    pairTag(["N1", "C6"]),
    pairTag(["C2", "N1"]),
    pairTag(["C2", "N2"]),
    pairTag(["N3", "C2"]),
    pairTag(["C4", "N3"]),
];

const UracilLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "O4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const ThymineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C5", "C7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "O4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const EmptyPlotPoints = new Array<number>();

export type NavalItem = {
    value: number;
    quality: Naval.Quality | 'none';
}
export function NavalItem(item: Validation.ReportItem<Validation.AngleAtoms | Validation.BondAtoms>): NavalItem {
    return { value: item.target_value, quality: Naval.quality(item) };
}
const EmptyNavalItem: NavalItem = { value: 0, quality: 'none' };


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

function fmtDecimal(n: number, decimals: number) {
    const fvdd = M.firstValidDecimalDigit(n);
    return fvdd > decimals ? n.toExponential(decimals - 1) : n.toFixed(decimals);
}

export function AnglesLengthsBar(props: { caption?: string | React.ReactNode, counts: Summarize.Counts, colors: string[] }){
    const renderCaption = () => {
        if (!props.caption)
            return void 0;

        if (typeof props.caption === 'string') {
            return <div style={{ top: 0, left: 'var(--h-gap)', ...AnglesLengthsCommon.StayAboveStyle, ...AnglesLengthsCommon.BarCaptionStyle }}>{props.caption}</div>
        } else {
            return props.caption;
        }
    }

    return (
        <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'row' }}>
            <StatsBar counts={props.counts.exclusive} colors={props.colors} />
            {renderCaption()}
        </div>
    );
}

export class AveragesChart extends React.Component<{
    bins: Bins,
    pGroupDatas: DAnglesLengths.PGroupData[],
    mark: number,
    naval: NavalItem,
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
        const navalColorTup = colorToTuple(htmlColorAsNumber(GlobalConfig.data().anglesLengths.navalMarkerColor) ?? 16744576);
        const outlierColor = DAnglesLengths.outlierColor();
        const pGroupIndices = this.binsToPGroupIndices(this.props.bins, this.props.pGroupDatas);

        const color = pGroupIndices.map(pgIdx => {
            const tup = colorToTuple(pgIdx === -1 ? outlierColor : DAnglesLengths.pGroupColor(pgIdx));
            return `$rgb(${tup[0]}, ${tup[1]}, ${tup[2]})`;
        });

        const tm = this.props.xTransform ? this.props.xTransform(this.props.mark) : this.props.mark;
        const xt = this.props.bins.map(b => this.props.xTransform ? this.props.xTransform(b.from) : b.from);
        const yt = this.props.bins.map(b => this.props.yTransform ? this.props.yTransform(b.probability) : b.probability);
        const yMax = Math.max(...yt);

        const xtFrom = xt[0];
        const xtTo = xt[xt.length - 1];
        const xAxisMargin = (xtTo - xtFrom) * 0.05;
        const xRange = [
            (xtFrom > tm ? tm : xtFrom) - xAxisMargin,
            (xtTo < tm ? tm : xtTo) + xAxisMargin
        ];

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
                                            _xt.unshift(tm);
                                            _yt.unshift(0);
                                            _pGroupIndices.unshift(-1);
                                            actual.unshift(yMax);
                                        } else {
                                            _xt.push(tm);
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
                                <Icon img='imgs/data-transfer-download.svg' size='text' />
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
                            width: xt[1] - xt[0],
                            marker: { color: color },
                            hoverinfo: 'none',
                            type: 'bar',
                            showlegend: false,
                        },
                        {
                            x: [tm],
                            y: [yMax * 1.05],
                            type: 'bar',
                            width: 2 * (xt[1] - xt[0]),
                            marker: {
                                color: `rgb(${markerColorTup[0]}, ${markerColorTup[1]}, ${markerColorTup[2]})`,
                            },
                            hoverinfo: 'text',
                            hovertext: 'Actual value',
                            hoveron: 'fills',
                            showlegend: false,
                        },
                        {
                            x: this.props.naval.quality !== 'none' ? [this.props.naval.value] : EmptyPlotPoints,
                            y: this.props.naval.quality !== 'none' ? [yMax / 2] : EmptyPlotPoints,
                            type: 'bar',
                            width: 2 * (xt[1] - xt[0]),
                            marker: {
                                color: `rgb(${navalColorTup[0]}, ${navalColorTup[1]}, ${navalColorTup[2]})`,
                            },
                            hoverinfo: 'text',
                            hovertext: 'Naval target value',
                            hoveron: 'fills',
                            showlegend: false,
                        }
                    ]}
                    layout={{
                        autosize: true,
                        bargap: 0,
                        dragmode: 'pan',
                        hovermode: 'closest',
                        margin: { t: 0, l: 0, b: 45, r: 0 },
                        xaxis: { title: this.props.xTitle, range: xRange },
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

export function FloatingCue(props: {
    children: JSX.Element | JSX.Element[],
    yOffset: number,
    onClicked: () => void,
}) {
    if (props.yOffset > 0) {
        return (
            <div style={{
                backgroundColor: 'white',
                border: 'var(--thickness-border) solid var(--color-a)',
                position: 'absolute',
                padding: '0.25em',
                top: `${props.yOffset + 16}px`,
                right: '32px',
                zIndex: 1}}
                onClick={() => props.onClicked()}
            >
                {props.children}
            </div>
        )
    } else
        return <div style={{ visibility: 'hidden' }} />;
}

export type PGroupSummaryProps = {
    bins: Bins,
    caption: string | JSX.Element,
    pGroup: DAnglesLengths.PGroup,
    pGroupDatas: DAnglesLengths.PGroupData[],
    rangeFormatter: (v: number) => string,
    residueName: JSX.Element,
    value: number,
    valueFormatter: (v: number) => string,
    naval: NavalItem,
    xTitle: string,
    yTitle: string,
    suffix?: string,
    xTransform?: (x: number) => number,
    yTransform?: (y: number) => number,
    downloadFileName?: string,
    highlighter: () => void,
    vi: ViewerInterop,
};
export class PGroupSummary extends React.Component<PGroupSummaryProps, { mode: 'chart'|'details' }> {
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
            naval={this.props.naval}
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

    private renderNaval() {
        return <>
            <div className='rdo-strong' style={{ gridColumnStart: 'span 2' }} >Naval quality</div>
            <div>{this.props.naval.quality === 'none' ? 'N/A' : Naval.QualityName[this.props.naval.quality]}</div>
        </>
    }

    private renderPercentile() {
        if (!this.props.pGroup) {
            return (
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 'var(--h-gap)' }}>
                    <div style={{ gridColumnStart: 'span 2' }} />{this.renderPGroup()}
                    <div className='rdo-line-spacer' style={{ gridColumn: 'span 3' }} />
                    {this.renderNaval()}
                </div>
            )
        }

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
                <div className='rdo-line-spacer' style={{ gridColumn: 'span 3' }} />
                {this.renderNaval()}
            </div>
        );
    }

    private renderMain() {
        switch (this.state.mode) {
        case 'chart':
            return this.renderChart();
        case 'details':
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

    componentDidMount() {
        this.props.highlighter();
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
                            {this.makeToggleButton('Details', 'details')}
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

export function Prosco( props: { bin: ALM.MaybeBin } ) {
    const renderUnavailable = (belowAbove: 'below'|'above') => {
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

    const bin = props.bin;

    if (bin === 'no-data') {
        return <div className='rdo-monospace rdo-talgn-right'>No data</div>
    } else if (bin === 'below' || bin === 'above')
        return renderUnavailable(bin);
    else {
        return (
            <Tooltip
                tag=<div className='rdo-monospace rdo-talgn-right'>
                    {fmtDecimal(bin.prosco * 100, 1)}{'\u00A0'}%
                </div>
            >
                <div>
                    {props.bin
                        ? `Relative probability of bin [${bin.from}\u00A0-\u00A0${bin.to}] within its respective distribution.`
                        : 'Relative probability is unavailable because the value is outside the range of values observed in the reference dataset.'
                    }
                </div>
            </Tooltip>
        );
    }
}


export function ResidueName(props: { r: Measurements.Residue, multipleModels: boolean }) {
    let inner = [];

    if (props.multipleModels) {
        inner.push(<span className='rdo-nice-step-model'>M{props.r.modelNum}</span>);
        inner.push(<span>{'\u00A0'}</span>);
    }

    inner.push(<span>{props.r.authChain}</span>);
    inner.push(<span>{'\u00A0'}</span>);
    inner.push(<span className='rdo-nice-step-base' style={{ fontWeight: AnglesLengthsCommon.BarCaptionStyle.fontWeight }}>{props.r.compound}</span>);
    inner.push(<span>{props.r.authSeqId}</span>);
    if (props.r.insCode)
        inner.push(<span>{props.r.insCode}</span>);
    if (props.r.altId)
        inner.push(<span className='rdo-nice-step-altpos'>(alt. {props.r.altId})</span>);

    return <div>{...inner}</div>;
}

export function SubstructureSummary(props: { countsInGroups: Summarize.CountsInGroup[] }) {
    const maxDecimals = Math.max(...props.countsInGroups.map(x => {
        const s = x.threshold.toString();
        const dot = s.indexOf('.');
        return dot >= 0 ? s.substring(dot + 1).length : 0;
    }));
    const outlierColor = DAnglesLengths.outlierColor();
    const total = props.countsInGroups[props.countsInGroups.length - 1].cumulative;

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
            {props.countsInGroups.map((x, idx) => {
                const thr = x.pGroupIdx === 'outlier' ? 'Outliers' : x.threshold.toFixed(maxDecimals);
                const clr = DAnglesLengths.pGroupColor(idx) ?? outlierColor;
                const perc = 100 * (x.cumulative / total);
                return (
                    <React.Fragment key={idx}>
                        <div style={{ backgroundColor: colorStyle(colorToTuple(clr)) }} />
                        <div className='rdo-monospace rdo-talgn-right'>{thr}</div>
                        <div className='rdo-monospace rdo-talgn-right' style={{ textAlign: 'right' }}>{x.exclusive}</div>
                        <div className='rdo-monospace rdo-talgn-right' style={{ textAlign: 'right' }}>{`${x.cumulative}\u00A0(${perc.toFixed(2).padStart(6)}\u00A0%)`}</div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export namespace AnglesLengthsCommon {
    export type ResidueToggledEvent = Subject<{ residue: Measurements.Residue, transition: 'selected' | 'deselected' }>;

    export const AnglesDisplayOrder: Record<Residues.ElementaryResidue, string[]> = {
        'A': AdenineAnglesOrder,
        'C': CytidineAnglesOrder,
        'G': GuanosineAnglesOrder,
        'U': UracilAnglesOrder,
        'DA': AdenineAnglesOrder,
        'DC': CytidineAnglesOrder,
        'DG': GuanosineAnglesOrder,
        'DT': ThymineAnglesOrder,
    };

    export const LengthsDisplayOrder: Record<Residues.ElementaryResidue, string[]> = {
        'A': AdenineLengthsOrder,
        'C': CytidineLengthsOrder,
        'G': GuanosineLengthsOrder,
        'U': UracilLengthsOrder,
        'DA': AdenineLengthsOrder,
        'DC': CytidineLengthsOrder,
        'DG': GuanosineLengthsOrder,
        'DT': ThymineLengthsOrder,
    };

    export const BlockListStyle = { display: 'flex', flexDirection: 'column', gap: 'calc(var(--h2-gap) / 2)' } as StandardLonghandProperties;
    export const StayAboveStyle = { position: 'absolute', zIndex: 1 } as StandardLonghandProperties;
    export const BarCaptionStyle = {
        color: 'white',
        fontWeight: 'bold',
        textShadow: '0px 0px 3px #000',
        ...StayAboveStyle,
    };
    export const StatsBarCaptionStyle = {
        height: '100%',
        width: '100%',
        textAlign: 'right',
        fontSize: 'var(--font-small)',
        top: 0,
        right: 'calc(var(--h-gap) / 2)',
        ...AnglesLengthsCommon.BarCaptionStyle,
        ...AnglesLengthsCommon.StayAboveStyle,
    } as StandardLonghandProperties;

    function amendStructureSelection(selection: StructureSelection, residue: Measurements.Residue, strategy: 'add' | 'remove') {
        const cifRes = {
            modelNum: residue.modelNum,
            chain: residue.chain,
            seqId: residue.seqId,
            altId: residue.altId
        };

        let cifAtomPrevC3: CifAtom | undefined = void 0;
        let cifAtomPrevO3: CifAtom | undefined = void 0;
        if (Measurements.Residue.hasPrevious(residue)) {
            cifAtomPrevC3 = {
                modelNum: residue.modelNum,
                chain: residue.chain,
                seqId: residue.prevSeqId!,
                altId: residue.prevAltId!,
                atomId: "C3'",
            };
            cifAtomPrevO3 = {
                modelNum: residue.modelNum,
                chain: residue.chain,
                seqId: residue.prevSeqId!,
                altId: residue.prevAltId!,
                atomId: "O3'",
            };
        }

        if (strategy === 'add') {
            selection.residues = selection.residues.filter((x) => x.modelNum === cifRes.modelNum);
            selection.residues.push(cifRes);

            if (cifAtomPrevC3) {
                selection.atoms = selection.atoms.filter((x) => x.modelNum === cifAtomPrevC3!.modelNum);
                selection.atoms.push(cifAtomPrevC3);
            }
            if (cifAtomPrevO3) {
                selection.atoms = selection.atoms.filter((x) => x.modelNum === cifAtomPrevO3!.modelNum);
                selection.atoms.push(cifAtomPrevO3);
            }
        } else if (strategy === 'remove') {
            selection.residues = selection.residues.filter((x) => !cifResidueMatches(x, cifRes));
            if (cifAtomPrevC3)
                selection.atoms = selection.atoms.filter((x) => !cifAtomMatches(x, cifAtomPrevC3!));
            if (cifAtomPrevO3)
                selection.atoms = selection.atoms.filter((x) => !cifAtomMatches(x, cifAtomPrevO3!));
        }
    }

    function cifAtomMatches(a: CifAtom, b: CifAtom) {
        return (
            a.modelNum === b.modelNum &&
            a.chain === b.chain &&
            a.seqId === b.seqId &&
            a.altId === b.altId &&
            a.atomId === b.atomId
        );
    }

    function cifResidueMatches(a: CifResidue, b: CifResidue) {
        return (
            a.modelNum === b.modelNum &&
            a.chain === b.chain &&
            a.seqId === b.seqId &&
            a.altId === b.altId
        );
    }

    function compareNavalAtom(a: Validation.Atom, name: string, seqId: number, altId: string) {
        const altIdMatch = a.altloc === '' || altId === '' || a.altloc === altId;
        const isShifted = isShiftedName(name);
        const _name = isShifted ? unshiftName(name) : name;
        const _seqId = isShifted ? seqId - 1 : seqId;

        return a.name === _name && a.seqId === _seqId && altIdMatch;
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

    export async function SelectionDisplayer(pieces: SelectedPieces, d: Dnatcofication, vi: ViewerInterop) {
        if (pieces.reconstruct)
            await vi.api.command(ViewerApi.Commands.DeselectStructures());

        if (pieces.residues.length < 1)
            return;

        const selected = [];
        for (const r of pieces.residues) {
            const authRes = StructureSelection.cifToAuthResidue(d.data.structures[0], r);
            if (authRes) {
                const cmdRes = ViewerApi.Commands.ResidueSelection(r.modelNum, authRes.chain, authRes.cifChain, authRes.seqId, authRes.insCode, authRes.altId, Colors.CurrentStep());
                selected.push(cmdRes);
            }
        }
        for (const a of pieces.atoms) {
            const authAtom = StructureSelection.cifToAuthAtom(d.data.structures[0], a);
            if (authAtom) {
                const cmdAtom = ViewerApi.Commands.AtomSelection(authAtom.modelNum, authAtom.chain, authAtom.cifChain, authAtom.seqId, authAtom.insCode, authAtom.altId, authAtom.cifAtomId, 0);
                selected.push(cmdAtom);
            }
        }

        await vi.api.command(ViewerApi.Commands.SelectStructures(selected));
    }

    export function SelectionMaker(
        newStepId: SelectedPieces['steps'][0], newResidue: SelectedPieces['residues'][0], newAtom: SelectedPieces['atoms'][0],
        steps: number[], residues: SelectedPieces['residues'], atoms: SelectedPieces['atoms'],
        d: Dnatcofication
    ): SelectedPieces {
        let newResidues;
        if (residues.find((x) => StructureSelection.cifResiduesMatch(x, newResidue)))
            newResidues = residues;
        else
            newResidues = [...residues.filter((x) => x.modelNum === newResidue.modelNum), newResidue];

        let newAtoms = [];
        // If the selection event came from the viewer, the viewer does not know that we want to
        // select the residue AND the preceding C3' and O3' atoms - if there are any. We need to augment the input atom
        // accordingly by hand here.
        if (newAtom === InvalidAtom) {
            const alm = d.data.almByResidue;
            const chain = alm.chains.get(newResidue.modelNum)?.get(newResidue.chain);

            let newC3;
            let newO3;
            if (chain) {
                for (const idx of chain) {
                    const r = alm.residues[idx];
                    if (r.seqId === newResidue.seqId && r.altId === newResidue.altId) {
                        if (Measurements.Residue.hasPrevious(r)) {
                            newC3 = {
                                modelNum: r.modelNum,
                                chain: r.chain,
                                seqId: r.prevSeqId!,
                                altId: r.prevAltId!,
                                atomId: "C3'",
                            };
                            newO3 = {
                                modelNum: r.modelNum,
                                chain: r.chain,
                                seqId: r.prevSeqId!,
                                altId: r.prevAltId!,
                                atomId: "O3'",
                            }
                        }
                    }
                }
            }

            if (newC3 && newO3) {
                newAtoms.push(newC3, newO3);
            }
        } else {
            newAtoms = atoms.filter((x) => x.modelNum === newAtom.modelNum);
            newAtoms.push(newAtom);
        }

        return {
            steps: [],
            residues: newResidues,
            atoms: newAtoms,
            reconstruct: steps.length > 0
        };
    }

    export function deselectResidue(residue: Measurements.Residue, selection: StructureSelection, event: ResidueToggledEvent, d: Dnatcofication, vi: ViewerInterop) {
        amendStructureSelection(selection, residue, 'remove');
        SelectionDisplayer({ steps: [], residues: selection.residues, atoms: selection.atoms, reconstruct: true }, d, vi);
        event.next({ residue, transition: 'deselected' });
    }

    export function fileNameFriendlyTag(tag: string) {
        return replaceAll(
            replaceAll(tag, '^', '_'),
            "'",
            'p'
        );
    }

    export function getNavalAngle(d: Dnatcofication, r: Measurements.Residue, triplet: Triplet) {
        const [ na, nb, nc ] = triplet;
        const niIdx = d.data.naval.anglesMapping.get(r.modelNum)
            ?.get(r.chain)
            ?.get(r.seqId)
            ?.find(idx => {
                const { a, b, c } = d.data.naval.angles[idx].atoms;
                return (
                    (compareNavalAtom(a, na, r.seqId, r.altId) || compareNavalAtom(a, nc, r.seqId, r.altId)) &&
                    compareNavalAtom(b, nb, r.seqId, r.altId) &&
                    (compareNavalAtom(c, na, r.seqId, r.altId) || compareNavalAtom(c, nc, r.seqId, r.altId))
                );
            }) ?? -1;
        return niIdx === -1 ? EmptyNavalItem : NavalItem(d.data.naval.angles[niIdx]);
    }

    export function getNavalBond(d: Dnatcofication, r: Measurements.Residue, pair: Pair) {
        const [ na, nb ] = pair;
        const niIdx = d.data.naval.bondsMapping.get(r.modelNum)
            ?.get(r.chain)
            ?.get(r.seqId)
            ?.find(idx => {
                const rr = d.data.naval.bonds[idx];
                const { a, b } = rr.atoms;
                return (
                    (compareNavalAtom(a, na, r.seqId, r.altId) || compareNavalAtom(a, nb, r.seqId, r.altId)) &&
                    (compareNavalAtom(b, na, r.seqId, r.altId) || compareNavalAtom(b, nb, r.seqId, r.altId))
                );
            }) ?? -1;
        return niIdx === -1 ? EmptyNavalItem : NavalItem(d.data.naval.bonds[niIdx]);
    }

    export function getSelection(props: View.Props) {
        const modelIdx = props.structureSelection.modelIndex;
        const chain = props.structureSelection.chain === InvalidChain ? '' : props.structureSelection.chain;

        return { modelIdx, chain };
    }

    export function isResidueInSelection(r: Measurements.Residue, selection: StructureSelection) {
        const cifRes = {
            modelNum: r.modelNum,
            chain: r.chain,
            seqId: r.seqId,
            altId: r.altId
        };

        return !!selection.residues.find((x) => cifResidueMatches(x, cifRes));
    }

    export function makeAtomSelectionPayload(r: Measurements.Residue, atomName: string) {
        if (isShiftedName(atomName)) {
            if (Measurements.Residue.hasPrevious(r))
                return ViewerApi.Payloads.AtomSelection(r.modelNum, r.authChain, r.chain, r.prevAuthSeqId!, r.prevInsCode!, r.prevAltId!, unshiftName(atomName), 0);
            else
                return void 0;
        } else
            return ViewerApi.Payloads.AtomSelection(r.modelNum, r.authChain, r.chain, r.authSeqId, r.insCode, r.altId, atomName, 0);
    }

    export function makeCollapsibleHeader(collapsed: React.ReactNode, expanded?: React.ReactNode): { collapsed: React.ReactNode, expanded: React.ReactNode } {
        return { collapsed, expanded: expanded ? expanded : collapsed };
    }

    export function pairBondName(p: Pair, tag: string) {
        let name = PairBondNameCache.get(tag);
        if (!name) {
            name = makeBondName(p);
            PairBondNameCache.set(tag, name);
        }

        return name;
    }

    export function residueIdentifyingName(structureName: string, r: Measurements.Residue) {
        return `${structureName}-m${r.modelNum}-${r.authChain}-${r.authSeqId}${r.insCode ? `.${r.insCode}` : ''}${r.altId ? `_alt${r.altId}` : ''}_`;
    }

    export function selectResidue(residue: Measurements.Residue, selection: StructureSelection, event: ResidueToggledEvent, d: Dnatcofication, vi: ViewerInterop) {
        amendStructureSelection(selection, residue, 'add');
        SelectionDisplayer({ steps: [], residues: selection.residues, atoms: selection.atoms, reconstruct: false }, d, vi);
        event.next({ residue, transition: 'selected' });
    }

    export function tripletBondName(t: Triplet, tag: string) {
        let name = TripletBondNameCache.get(tag);
        if (!name) {
            name = makeBondName(t);
            TripletBondNameCache.set(tag, name);
        }

        return name;
    }

    export function renderSubstructureStats(caption: string | JSX.Element, summaryCounts: Summarize.Counts, countsInGroups: Summarize.CountsInGroup[], colorsForCounts: string[]) {
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
                colors={colorsForCounts}
            />
        );
    }

    export function selectionName(d: Dnatcofication, multipleModels: boolean, modelIdx: number, chain: string) {
        let name = multipleModels
            ? modelIdx === InvalidModelIndex
                ? '' : `m${d.data.structures[0].models[modelIdx].num}`
            : '';
        name += chain === InvalidChain
            ? ''
            : name ? `-${chain}` : chain;

        return `${structureIdentifyingName(d)}_${name ? `${name}_` : ''}`;
    }

    export function structureIdentifyingName(d: Dnatcofication) {
        return d.identifyingName ?? d.pdbId;
    }
}
