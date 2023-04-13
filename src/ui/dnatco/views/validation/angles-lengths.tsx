import type { StandardLonghandProperties } from 'csstype';
import Plot from 'react-plotly.js';
import React from 'react';
import { Subject } from 'rxjs';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Colors } from '../../colors';
import { Constants } from '../../constants';
import { SearchBox } from '../../search-box';
import { StatsBar } from '../../stats-bar';
import {
    AuthResidue, CifAtom, CifResidue,
    InvalidAtom, InvalidChain, InvalidModelIndex,
    SelectedPieces,
    StructureSelection
} from '../../structure-selection';
import { Common } from '../../common';
import { colorToRgb, colorToTuple, ColorTuple, scrollIntoViewIfNeeded } from '../../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { ComboBox } from '../../../common/combo-box';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Icon } from '../../../common/icon';
import { IconButton, ToggleButton } from '../../../common/push-button';
import { SpinBox } from '../../../common/spin-box';
import { Tooltip } from '../../../common/tooltip';
import { ALMResidueStats, Dnatcofication, MaybeBin } from '../../../../dnatco/dnatcofication';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { isShiftedName, unshiftName } from '../../../../dnatco/angles-lengths/atoms';
import { tripletTag, Triplet } from '../../../../dnatco/angles-lengths/angles';
import { Bin, Bins } from '../../../../dnatco/angles-lengths/bin';
import { pairTag, Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Serialize } from '../../../../dnatco/angles-lengths/serialize';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { Naval } from '../../../../dnatco/naval';
import { Validation } from '../../../../dnatco/naval/validation';
import { rgbToHex } from '../../../util';
import { GlobalConfig } from '../../../../global-config';
import { htmlColorAsNumber, parseIntStrict, replaceAll, sequence } from '../../../../util';
import { doDownload, Downloader, FileTypes } from '../../../../util/downloader';
import { Serialization } from '../../../../util/serialization';
import { isWithin } from '../../../../util';
import { EventsKeeper } from '../../../../util/events-keeper';
import { M } from '../../../../util/math';
import { Net } from '../../../../util/net';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';
import 'assets/imgs/data-transfer-download.svg';
import 'assets/imgs/triangle-down.svg';
import 'assets/imgs/triangle-up.svg';

type EmptiableMaybeBin = MaybeBin|'no-data';

type NavalItem = {
    value: number;
    quality: Naval.Quality | 'none';
}
function NavalItem(item: Validation.ReportItem<Validation.AngleAtoms | Validation.BondAtoms>): NavalItem {
    return { value: item.target_value, quality: Naval.quality(item) };
}
const EmptyNavalItem: NavalItem = { value: 0, quality: 'none' };

const EmptyPlotPoints = new Array<number>();
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
    columnGap: '1em',
    position: 'relative',
} as StandardLonghandProperties;
const WorstValuesTableStyle = {
    display: 'grid',
    gridTemplateColumns: 'auto 1em auto auto auto 1fr',
    columnGap: '1em',
    position: 'relative',
} as StandardLonghandProperties;

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
    },
    stats: ALMResidueStats[],
}>;
const StatsDownloaders = [
    {
        caption: 'CSV',
        download: function(fileNameStem, data) {
            const text = Serialize.toCsv(data.counts.angles, data.counts.lengths, data.residues, data.stats);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.csv,
    },
    {
        caption: 'JSON',
        download: function(fileNameStem, data) {
            const text = Serialize.toJson(data.counts.angles, data.counts.lengths, data.residues, data.stats);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.json,
    }
] as StatsDownloader[];

function amendResidueSelection(selection: StructureSelection, residue: Measurements.Residue, strategy: 'add' | 'remove') {
    const cifRes = {
        modelNum: residue.modelNum,
        chain: residue.chain,
        seqId: residue.seqId,
        altId: residue.altId
    };

    let cifAtomPrev: CifAtom | undefined = void 0;
    if (Measurements.Residue.hasPrevious(residue)) {
        cifAtomPrev = {
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

        if (cifAtomPrev) {
            selection.atoms = selection.atoms.filter((x) => x.modelNum === cifAtomPrev!.modelNum);
            selection.atoms.push(cifAtomPrev);
        }
    } else if (strategy === 'remove') {
        selection.residues = selection.residues.filter((x) => !cifResidueMatches(x, cifRes));
        if (cifAtomPrev)
            selection.atoms = selection.atoms.filter((x) => x.modelNum === cifAtomPrev!.modelNum);
    }
}

function cifResidueMatches(a: CifResidue, b: CifResidue) {
    return (
        a.modelNum === b.modelNum &&
        a.chain === b.chain &&
        a.seqId === b.seqId &&
        a.altId === b.altId
    );
}

function colorStyle(clr: [r: number, g: number, b: number]) {
    return `rgb(${clr.join(',')})`;
}

function compareMaybeBins(a: EmptiableMaybeBin, b: EmptiableMaybeBin) {
    const aOut = a === 'above' || a === 'below' || a === 'no-data';
    const bOut = b === 'above' || b === 'below' || b === 'no-data';

    if (aOut) {
        if (bOut)
            return 0;
        else
            return -1;
    } else if (bOut) {
        return 1;
    } else
        return (a as Bin).prosco - (b as Bin).prosco;
}

function compareNavalAtom(a: Validation.Atom, name: string, seqId: number, altId: string) {
    const altIdMatch = a.altloc === '' || altId === '' || a.altloc === altId;
    const isShifted = isShiftedName(name);
    const _name = isShifted ? unshiftName(name) : name;
    const _seqId = isShifted ? seqId - 1 : seqId;

    return a.name === _name && a.seqId === _seqId && altIdMatch;
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

function getNavalAngle(d: Dnatcofication, r: Measurements.Residue, triplet: Triplet) {
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

function getNavalBond(d: Dnatcofication, r: Measurements.Residue, pair: Pair) {
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

function makeAtomSelectionPayload(r: Measurements.Residue, atomName: string) {
    if (isShiftedName(atomName)) {
        if (Measurements.Residue.hasPrevious(r))
            return ViewerApi.Payloads.AtomSelection(r.modelNum, r.authChain, r.chain, r.prevAuthSeqId!, r.prevInsCode!, r.prevAltId!, unshiftName(atomName), 0);
        else
            return void 0;
    } else
        return ViewerApi.Payloads.AtomSelection(r.modelNum, r.authChain, r.chain, r.authSeqId, r.insCode, r.altId, atomName, 0);
}

function makeCollapsibleHeader(collapsed: React.ReactNode, expanded?: React.ReactNode): { collapsed: React.ReactNode, expanded: React.ReactNode } {
    return { collapsed, expanded: expanded ? expanded : collapsed };
}

type GatherWorst = {
    angles: {
        bond: (r: Measurements.Residue) => Measurements.BondAngle[],
        stats: (s: ALMResidueStats, idx: number) => ALMResidueStats['angles'][number],
    },
    lengths: {
        bond: (r: Measurements.Residue) => Measurements.BondLength[],
        stats: (s: ALMResidueStats, idx: number) => ALMResidueStats['lengths'][number],
    },
};
const GatherWorst: GatherWorst = {
    angles: {
        bond: (r) => r.bondAngles,
        stats: (s, idx) => s.angles[idx],
    },
    lengths: {
        bond: (r) => r.bondLengths,
        stats: (s, idx) => s.lengths[idx],
    },

};
function gatherWorst<T extends keyof GatherWorst>(gather: T, residues: Measurements.Residue[], stats: ALMResidueStats[], threshold: number|'outlier', maxCount: number) {
    type PT = ReturnType<GatherWorst[T]['bond']>[number];
    const worst = new Array<{
        bond: PT,
        residue: Measurements.Residue,
        maybeBin: EmptiableMaybeBin,
        pGroup: DAnglesLengths.PGroup,
    }>();
    const getter = GatherWorst[gather];

    for (let idx = 0; idx < residues.length; idx++) {
        const r = residues[idx];
        const s = stats[idx];

        for (let jdx = 0; jdx < r.bondLengths.length; jdx++) {
            const x = getter.bond(r)[jdx];
            const ls = getter.stats(s, jdx);
            const thr = ls.pGroup?.threshold ?? 'outlier';

            if (thr === 'outlier' || thr >= threshold) {
                let kdx = 0;
                for (; kdx < worst.length; kdx++) {
                    if (compareMaybeBins(ls.bin, worst[kdx].maybeBin) <= 0)
                        break;
                }

                const tail = worst.splice(
                    kdx,
                    worst.length - kdx,
                    {
                        bond: x,
                        residue: r,
                        maybeBin: ls.bin,
                        pGroup: ls.pGroup
                    }
                );
                worst.push(...tail);
            }
        }
    }

    if (worst.length > maxCount)
        worst.length = maxCount;

    return worst;
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

function isResidueInSelection(r: Measurements.Residue, selection: StructureSelection) {
    const cifRes = {
        modelNum: r.modelNum,
        chain: r.chain,
        seqId: r.seqId,
        altId: r.altId
    };

    return !!selection.residues.find((x) => cifResidueMatches(x, cifRes));
}

function pairBondName(p: Pair, tag: string) {
    let name = PairBondNameCache.get(tag);
    if (!name) {
        name = makeBondName(p);
        PairBondNameCache.set(tag, name);
    }

    return name;
}

function renderBondAngleDetail(
    d: Dnatcofication,
    bondAngle: Measurements.BondAngle,
    maybeBin: EmptiableMaybeBin,
    pGroup: DAnglesLengths.PGroup,
    residue: Measurements.Residue,
    residueName: JSX.Element,
    structureName: string,
    outlierColor: [r: number, g: number, b: number],
    pgrpIndices: number[],
    vi: ViewerInterop,
    onAtomsClicked?: (r: Measurements.Residue, triplet: Triplet) => void
) {
    const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.anglePGroupData(idx, residue.compound, bondAngle.triplet)!);
    const dlName = `${residueIdentifyingName(structureName, residue)}_${fileNameFriendlyTag(tripletTag(bondAngle.triplet))}`;
    const ni = getNavalAngle(d, residue, bondAngle.triplet);

    return (
        <BondAngleDetails
            bondAngle={bondAngle}
            downloadName={dlName}
            maybeBin={maybeBin}
            navalItem={ni}
            outlierColor={outlierColor}
            pGroup={pGroup}
            pGroupDatas={pgrpDatas}
            residue={residue}
            residueName={residueName}
            vi={vi}
            onAtomsClicked={onAtomsClicked}
        />
    );
}

function renderBondLengthDetail(
    d: Dnatcofication,
    bondLength: Measurements.BondLength,
    maybeBin: EmptiableMaybeBin,
    pGroup: DAnglesLengths.PGroup,
    residue: Measurements.Residue,
    residueName: JSX.Element,
    structureName: string,
    outlierColor: [r: number, g: number, b: number],
    pgrpIndices: number[],
    vi: ViewerInterop,
    onAtomsClicked?: (r: Measurements.Residue, pair: Pair) => void,
) {
    const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.lengthPGroupData(idx, residue.compound, bondLength.pair)!);
    const dlName = `${residueIdentifyingName(structureName, residue)}${fileNameFriendlyTag(pairTag(bondLength.pair))}`;
    const ni = getNavalBond(d, residue, bondLength.pair);

    return (
        <BondLengthDetails
            bondLength={bondLength}
            downloadName={dlName}
            maybeBin={maybeBin}
            navalItem={ni}
            outlierColor={outlierColor}
            pGroup={pGroup}
            pGroupDatas={pgrpDatas}
            residue={residue}
            residueName={residueName}
            vi={vi}
            onAtomsClicked={onAtomsClicked}
        />
    );
}

function renderSubstructureStats(caption: string | JSX.Element, summaryCounts: Summarize.Counts, countsInGroups: Summarize.CountsInGroup[], colorsForCounts: string[]) {
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

function residueIdentifyingName(structureName: string, r: Measurements.Residue) {
    return `${structureName}-m${r.modelNum}-${r.authChain}-${r.authSeqId}${r.insCode ? `.${r.insCode}` : ''}${r.altId ? `_alt${r.altId}` : ''}_`;
}

function structureIdentifyingName(d: Dnatcofication) {
    return d.identifyingName ?? d.pdbId;
}

function tripletBondName(t: Triplet, tag: string) {
    let name = TripletBondNameCache.get(tag);
    if (!name) {
        name = makeBondName(t);
        TripletBondNameCache.set(tag, name);
    }

    return name;
}

class AnglesLengthsBar extends React.Component<{ caption?: string | React.ReactNode, counts: Summarize.Counts, colors: string[] }> {
    private renderCaption() {
        if (!this.props.caption)
            return void 0;

        if (typeof this.props.caption === 'string') {
            return <div style={{ top: 0, left: 'var(--h-gap)', ...StayAboveStyle, ...BarCaptionStyle }}>{this.props.caption}</div>
        } else {
            return this.props.caption;
        }
    }

    render() {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'row' }}>
                <StatsBar counts={this.props.counts.exclusive} colors={this.props.colors} />
                {this.renderCaption()}
            </div>
        );
    }
}

class AveragesChart extends React.Component<{
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
                            width: xt[1] - xt[0],
                            marker: { color: color },
                            hoverinfo: 'none',
                            type: 'bar',
                            showlegend: false,
                        },
                        {
                            x: [tm],
                            y: [yMax],
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
                            y: this.props.naval.quality !== 'none' ? [yMax] : EmptyPlotPoints,
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

class BondAngleDetails extends React.Component<{
    bondAngle: Measurements.BondAngle,
    downloadName: string,
    maybeBin: EmptiableMaybeBin,
    navalItem: NavalItem,
    outlierColor: [r: number, g: number, b: number],
    pGroup: DAnglesLengths.PGroup,
    pGroupDatas: DAnglesLengths.PGroupData[],
    residue: Measurements.Residue,
    residueName: JSX.Element,
    vi: ViewerInterop,
    onAtomsClicked?: (r: Measurements.Residue, triplet: Triplet) => void,
}> {
    render() {
        const ba = this.props.bondAngle;
        const clr = this.props.pGroup ? colorToTuple(this.props.pGroup.color) : this.props.outlierColor;

        const doHighlight = () => {
            const r = this.props.residue;
            const a = makeAtomSelectionPayload(r, this.props.bondAngle.triplet[0]);
            const b = makeAtomSelectionPayload(r, this.props.bondAngle.triplet[1]);
            const c = makeAtomSelectionPayload(r, this.props.bondAngle.triplet[2]);

            if (a && b && c)
                this.props.vi.api.command(ViewerApi.Commands.Highlight([a, b, c]));
        };
        const doUnhighlight = () => this.props.vi.api.command(ViewerApi.Commands.Unhighlight());

        return (
            <>
                <Tooltip
                    tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                    delayMsec={Constants.TooltipDelayMSec}
                    display='block'
                >
                    <span
                        onMouseLeave={doUnhighlight} // We need to do it like this because componentWillUnmount() won't fire on Tooltipped components
                    >
                        <PGroupSummary
                            bins={DAnglesLengths.angleAverages(this.props.residue.compound, ba.triplet)!}
                            caption={tripletBondName(ba.triplet, ba.tag)}
                            pGroup={this.props.pGroup}
                            pGroupDatas={this.props.pGroupDatas}
                            rangeFormatter={(v) => M.r2d(v).toFixed(2)}
                            residueName={this.props.residueName}
                            suffix={'\u00B0'}
                            value={ba.angle}
                            valueFormatter={(v) => M.r2d(v).toFixed(2)}
                            naval={this.props.navalItem} // Contained value is already in degrees
                            xTitle={'Angle (\u00B0)'}
                            yTitle='Prob. (%)'
                            xTransform={(x) => M.r2d(x)}
                            yTransform={(y) => y * 100}
                            downloadFileName={this.props.downloadName}
                            highlighter={doHighlight}
                            vi={this.props.vi}
                        />
                    </span>
                </Tooltip>
                <span
                    onClick={() => {
                        if (this.props.onAtomsClicked)
                            this.props.onAtomsClicked(this.props.residue, this.props.bondAngle.triplet);
                    }}
                    onMouseEnter={doHighlight}
                    onMouseLeave={doUnhighlight}
                >
                    {tripletBondName(ba.triplet, ba.tag)}
                </span>
                <div
                    onMouseEnter={doHighlight}
                    onMouseLeave={doUnhighlight}
                    className='rdo-monospace rdo-talgn-right'
                >
                    {M.r2d(ba.angle).toFixed(2)}{'\u00B0'}
                </div>
                <Prosco bin={this.props.maybeBin} />
            </>
        );
    }
}

class BondLengthDetails extends React.Component<{
    bondLength: Measurements.BondLength,
    downloadName: string,
    maybeBin: EmptiableMaybeBin,
    navalItem: NavalItem,
    outlierColor: [r: number, g: number, b: number],
    pGroup: DAnglesLengths.PGroup,
    pGroupDatas: DAnglesLengths.PGroupData[],
    residue: Measurements.Residue,
    residueName: JSX.Element,
    vi: ViewerInterop,
    onAtomsClicked?: (r: Measurements.Residue, pair: Pair) => void,
}> {
    render() {
        const bl = this.props.bondLength;
        const clr = this.props.pGroup ? colorToTuple(this.props.pGroup.color) : this.props.outlierColor;

        const doHighlight = () => {
            const r = this.props.residue;
            const a = makeAtomSelectionPayload(r, this.props.bondLength.pair[0]);
            const b = makeAtomSelectionPayload(r, this.props.bondLength.pair[1]);

            if (a && b)
                this.props.vi.api.command(ViewerApi.Commands.Highlight([a, b]));
        };
        const doUnhighlight = () => this.props.vi.api.command(ViewerApi.Commands.Unhighlight());

        return (
            <>
                <Tooltip
                    tag=<div style={{ width: '100%', height: '100%', backgroundColor: colorStyle(clr) }} />
                    delayMsec={Constants.TooltipDelayMSec}
                    display='block'
                >
                    <span
                        onMouseLeave={doUnhighlight} // We need to do it like this because componentWillUnmount() won't fire on Tooltipped components
                    >
                        <PGroupSummary
                            bins={DAnglesLengths.lengthAverages(this.props.residue.compound, bl.pair)!}
                            caption={pairBondName(bl.pair, bl.tag)}
                            pGroup={this.props.pGroup}
                            pGroupDatas={this.props.pGroupDatas}
                            rangeFormatter={(v) => v.toFixed(3)}
                            residueName={this.props.residueName}
                            suffix={'\u00A0\u212B'}
                            value={bl.length}
                            valueFormatter={(v) => v.toFixed(3)}
                            naval={this.props.navalItem}
                            xTitle={'Length (\u212B)'}
                            yTitle='Prob. (%)'
                            yTransform={(y) => y * 100}
                            downloadFileName={this.props.downloadName}
                            highlighter={doHighlight}
                            vi={this.props.vi}
                        />
                    </span>
                </Tooltip>
                <span
                    onClick={() => {
                        if (this.props.onAtomsClicked)
                            this.props.onAtomsClicked(this.props.residue, this.props.bondLength.pair);
                    }}
                    onMouseEnter={doHighlight}
                    onMouseLeave={doUnhighlight}
                >
                    {pairBondName(bl.pair, bl.tag)}
                </span>
                <div
                    className='rdo-monospace rdo-talgn-right'
                    onMouseEnter={doHighlight}
                    onMouseLeave={doUnhighlight}
                >
                    {bl.length.toFixed(3)}{'\u00A0\u212B'}
                </div>
                <Prosco bin={this.props.maybeBin} />
            </>
        );
    }
}

class DownloadButtons extends React.Component<{
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
    fileName: string,
    residues: Measurements.Residue[],
    stats: ALMResidueStats[],
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
                            dl.download(this.props.fileName, { residues: this.props.residues, counts: this.props.counts, stats: this.props.stats });
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
    stats: ALMResidueStats[],
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
                    stats={this.props.stats}
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
class PGroupSummary extends React.Component<PGroupSummaryProps, { mode: 'chart'|'details' }> {
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

interface ResidueElemProps {
    tainer: React.RefObject<HTMLDivElement>,
    d: Dnatcofication,
    colorsForStatsBar: string[],
    countsAngles: Summarize.CountsInGroup[],
    countsLenghts: Summarize.CountsInGroup[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    residue: Measurements.Residue,
    residueName: JSX.Element,
    residueIdentifyingName: string,
    stats: ALMResidueStats,
    structureName: string,
    vi: ViewerInterop,
}
interface ResidueDetailsProps extends ResidueElemProps {
    onHideRequested: () => void,
}

class ResidueDetails extends React.Component<ResidueDetailsProps, { floaterYOffset: number }> {
    private selfRef = React.createRef<HTMLDivElement>();

    constructor(props: ResidueDetailsProps) {
        super(props);

        this.state = {
            floaterYOffset: -1,
        };
    }

    onScroll = () => {
        const self = this.selfRef.current;
        const tainer = this.props.tainer.current;
        if (!self || !tainer)
            return;

        const tainerBRect = tainer.getBoundingClientRect();
        const selfBRect = self.getBoundingClientRect();

        let off = tainerBRect.top - selfBRect.top;
        off = off > selfBRect.height ? 0 : off;

        this.setState({ ...this.state, floaterYOffset: off });
    }

    componentDidMount() {
        this.props.tainer.current?.addEventListener('scroll', this.onScroll);
    }

    componentWillUnmount() {
        this.props.tainer.current?.removeEventListener('scroll', this.onScroll);
    }

    render() {
        return (
            <div style={DetailsTableStyle} ref={this.selfRef}>
                {this.state.floaterYOffset > 0
                    ? <div style={{
                        border: 'var(--thickness-border) solid var(--color-a)',
                        position: 'absolute',
                        padding: '0.25em',
                        top: `${this.state.floaterYOffset + 16}px`,
                        right: '32px'}}
                        onClick={() => this.props.onHideRequested()}
                    >
                        {this.props.residueName}
                    </div>
                    : undefined
                }

                <div style={{ gridColumnStart: 'span 5', ...DetailsCaptionStyle }}>Bond lengths</div>
                {this.props.residue.bondLengths.map((x, idx) => {
                    return (
                        <React.Fragment key={idx}>
                            {renderBondLengthDetail(
                                this.props.d,
                                x,
                                this.props.stats.lengths[idx].bin,
                                this.props.stats.lengths[idx].pGroup,
                                this.props.residue,
                                this.props.residueName,
                                this.props.structureName,
                                this.props.outlierColor,
                                this.props.pgrpIndices,
                                this.props.vi
                            )}
                            <div />
                        </React.Fragment>
                    );
                })}

                <div style={{ gridColumnStart: 'span 5', ...DetailsCaptionStyle }}>Bond angles</div>
                {this.props.residue.bondAngles.map((x, idx) => {
                    return (
                        <React.Fragment key={idx}>
                            {renderBondAngleDetail(
                                this.props.d,
                                x,
                                this.props.stats.angles[idx].bin,
                                this.props.stats.angles[idx].pGroup,
                                this.props.residue,
                                this.props.residueName,
                                this.props.structureName,
                                this.props.outlierColor,
                                this.props.pgrpIndices,
                                this.props.vi
                            )}
                            <div />
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
}

class ResidueHeader extends React.Component<{
    caption: string | JSX.Element,
    residue: Measurements.Residue,
    residueIdentifyingName: string,
    stats: ALMResidueStats,
    structureName: string,
    summary: Summarize.Summary,
    countsAngles: Summarize.CountsInGroup[],
    countsLengths: Summarize.CountsInGroup[],
    colorsForStatsBar: string[],
}> {
    private tainerRef = React.createRef<HTMLDivElement>();

    render() {
        const r = this.props.residue;

        return (
            <div
                style={{ position: 'relative', width: '100%', height: '100%' }}
                ref={this.tainerRef}
                id={this.props.residueIdentifyingName}
            >
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
                    stats={[this.props.stats]}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={ResidueBarCaptionStyle}>L</div>, this.props.summary.lengths, this.props.countsLengths, this.props.colorsForStatsBar)}
                        </div>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={ResidueBarCaptionStyle}>A</div>, this.props.summary.angles, this.props.countsAngles, this.props.colorsForStatsBar)}
                        </div>
                    </div>
                </OverallStatsBar>
            </div>
        );
    }
}

class Residue extends React.Component<ResidueElemProps & { structureSelection: StructureSelection, viewerInterop: ViewerInterop, scrollMyselfIntoView: () => void }> {
    private collapserRef = React.createRef<CollapsibleVertical>();

    collapseExpand = (change: 'collapse' | 'expand') => {
        this.collapserRef.current?.collapseExpand(change);
    }

    render() {
        return (
            <CollapsibleVertical
                ref={this.collapserRef}
                header={makeCollapsibleHeader(
                    <ResidueHeader
                        caption={this.props.residueName}
                        residue={this.props.residue}
                        residueIdentifyingName={this.props.residueIdentifyingName}
                        stats={this.props.stats}
                        summary={this.props.stats.summary}
                        structureName={this.props.structureName}
                        countsAngles={this.props.countsAngles}
                        countsLengths={this.props.countsLenghts}
                        colorsForStatsBar={this.props.colorsForStatsBar}
                    />
                )}
                onCollapsedExpanded={(change) => {
                    if (change === 'expanded') {
                        const cifRes = {
                            modelNum: this.props.residue.modelNum,
                            chain: this.props.residue.chain,
                            seqId: this.props.residue.seqId,
                            altId: this.props.residue.altId
                        };

                        if (this.props.structureSelection.residues.find((x) => cifResidueMatches(x, cifRes)))
                            return;

                        amendResidueSelection(this.props.structureSelection, this.props.residue, 'add');

                        selectionDisplayer({ steps: [], residues: this.props.structureSelection.residues, atoms: this.props.structureSelection.atoms, reconstruct: false }, this.props.d, this.props.viewerInterop);
                    } else {
                        amendResidueSelection(this.props.structureSelection, this.props.residue, 'remove');

                        selectionDisplayer({ steps: [], residues: this.props.structureSelection.residues, atoms: this.props.structureSelection.atoms, reconstruct: true }, this.props.d, this.props.viewerInterop);
                    }
                }}
                initiallyExpanded={isResidueInSelection(this.props.residue, this.props.structureSelection)}
            >
                <ResidueDetails
                    onHideRequested={() => this.collapserRef.current?.collapseExpand('collapse')}
                    { ...this.props }
                />
            </CollapsibleVertical>
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

function WorstValueResidueName(props: {
    name: React.ReactNode,
    residue: Measurements.Residue,
    selection: StructureSelection,
    d: Dnatcofication,
    vi: ViewerInterop,
    toggleEvent: Subject<{ residue: Measurements.Residue, transition: 'selected' | 'deselected' }>,
}) {
    const doHighlight = () => {
        const r = props.residue;
        const sel = ViewerApi.Payloads.ResidueSelection(r.modelNum, r.authChain, r.chain, r.authSeqId, r.insCode, r.altId, 0);

        props.vi.api.command(ViewerApi.Commands.Highlight([sel]));
    };
    const doUnhighlight = () => props.vi.api.command(ViewerApi.Commands.Unhighlight());

    return (
        <div
            onClick={() => {
                const isSelected = isResidueInSelection(props.residue, props.selection);
                if (!isSelected) {
                    amendResidueSelection(props.selection, props.residue, 'add');
                    selectionDisplayer({ steps: [], residues: props.selection.residues, atoms: props.selection.atoms, reconstruct: false }, props.d, props.vi);
                    props.toggleEvent.next({ residue: props.residue, transition: 'selected' });
                } else {
                    amendResidueSelection(props.selection, props.residue, 'remove');
                    selectionDisplayer({ steps: [], residues: props.selection.residues, atoms: props.selection.atoms, reconstruct: true }, props.d, props.vi);
                    props.toggleEvent.next({ residue: props.residue, transition: 'deselected' });
                }
            }}
            onMouseEnter={doHighlight}
            onMouseLeave={doUnhighlight}
        >
            {props.name}
        </div>
    );
}


const DefaultShownResiduesLimit = 100;
const ShownResiduesIncrement = 100;
const LoadNextElemId = 'rdo-angles-lenghts-load-next-elem';
export class AnglesLengths extends View<
    View.Props,
    {
        maxWorstAngles: number,
        worstAnglesThreshold: string,
        maxWorstLengths: number,
        worstLengthsThreshold: string,
        shownResiduesLimit: number,
    }
> {
    static readonly unscrollableContainer = true;
    private residuesTainerRef = React.createRef<HTMLDivElement>();
    private inhibitLoadNext = false;
    private searchBoxOpen = false;
    // This is set in the render function each time we re-render.
    // We use this mapping to get to all currently rendered Resdiue components
    // because the gotoResdue function needs to be able to do that. We need to keep
    // this in the component-scope because we must be able to jump to a Residue
    // that was not rendered when the jump was requested and gotoResidue needs
    // access to the current mapping of rendered Residues.
    private residueBlocksMapping = new Map<string, React.RefObject<Residue>>();

    private readonly ek = new EventsKeeper();
    readonly events = {
        residueToggled: this.ek.subject<{ residue: Measurements.Residue, transition: 'selected' | 'deselected' }>(),
    };

    private readonly Searching = {
        onSearch: (prompt: string) => {
            const toks = prompt.split(' ').slice(0, 2);
            const authSeqId = parseIntStrict(toks.length === 2 ? toks[1] : toks[0]);
            const authChain = toks.length === 2 ? toks[0] : void 0;

            if (isNaN(authSeqId))
                return [];

            const { modelIdx, chain } = this.getSelection();
            const alm = this.props.dnatcofication.data.alm;

            const selectedIndices = this.selectionToIndices(modelIdx, chain);
            const selectedResidues = selectedIndices.map(x => alm.residues[x]);

            const results = [];
            for (const r of selectedResidues) {
                if (r.authSeqId === authSeqId) {
                    if (authChain) {
                        if (authChain === r.authChain)
                            results.push(r);
                    } else
                        results.push(r);
                }
            }

            return results;
        },
    }

    private readonly SearchBoxProps = {
        anchor: 'bottom-right' as SearchBox.Props<Measurements.Residue>['anchor'],
        xOffset: 32,
        yOffset: 32,
        caption: 'Enter chain and residue no.',
        onClose: () => this.searchBoxOpen = false,
    };

    constructor(props: View.Props) {
        super(props);

        this.state = {
            maxWorstAngles: GlobalConfig.data().anglesLengths.maxWorst,
            worstAnglesThreshold: '',
            maxWorstLengths: GlobalConfig.data().anglesLengths.maxWorst,
            worstLengthsThreshold: '',
            shownResiduesLimit: 100,
        };
    }

    private getSelection() {
        const modelIdx = this.props.structureSelection.modelIndex;
        const chain = this.props.structureSelection.chain === InvalidChain ? '' : this.props.structureSelection.chain;

        return { modelIdx, chain };
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
        if (r.insCode)
            inner.push(<span>{r.insCode}</span>);
        if (r.altId)
            inner.push(<span className='rdo-nice-step-altpos'>(alt. {r.altId})</span>);

        return <div>{...inner}</div>;
    }

    private renderSelection(
        tainer: React.RefObject<HTMLDivElement>,
        indices: number[],
        multipleModels: boolean,
        thresholds: number[],
        pgrpIndices: number[],
        colorsForStatsBar: string[],
        maxResidues: number,
        loadNext: () => void
    ): { elems: JSX.Element[], mapping: Map<string, React.RefObject<Residue>> } {
        const r = this.props.dnatcofication.data.alm.residues;
        const s = this.props.dnatcofication.data.alm.stats;
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());

        const mapping = new Map<string, React.RefObject<Residue>>();
        const elems = new Array<JSX.Element>();
        let adx = 0;
        for (; adx < indices.length && adx < maxResidues; adx++) {
            const idx = indices[adx];

            const _r = r[idx];
            const _s = s[idx];
            const countsAngles = countsInGroups(_s.summary.angles, thresholds);
            const countsLenghts = countsInGroups(_s.summary.lengths, thresholds);
            const residueName = this.renderResidueName(_r, multipleModels);
            const structureName = structureIdentifyingName(this.props.dnatcofication);
            const identResName = residueIdentifyingName(structureName, _r);

            const ref = React.createRef<Residue>();
            const elem = <Residue
                ref={ref}
                tainer={tainer}
                d={this.props.dnatcofication}
                countsAngles={countsAngles}
                countsLenghts={countsLenghts}
                outlierColor={outlierColor}
                pgrpIndices={pgrpIndices}
                residue={_r}
                residueName={residueName}
                residueIdentifyingName={identResName}
                stats={_s}
                structureName={structureName}
                colorsForStatsBar={colorsForStatsBar}
                structureSelection={this.props.structureSelection}
                viewerInterop={this.props.viewerInterop}
                scrollMyselfIntoView={() => this.gotoResidue(identResName, ref)}
                vi={this.props.viewerInterop}
                key={idx}
            />;

            elems.push(elem);
            mapping.set(identResName, ref);
        }

        if (adx === maxResidues)
            elems.push(<div key={-1} id={LoadNextElemId} onClick={loadNext}>{`(... ${indices.length - maxResidues} more residues)`}</div>);

        return { elems, mapping };
    }

    private renderWorstAngles(residues: Measurements.Residue[], stats: ALMResidueStats[], maxCount: number, threshold: number|'outlier', structureName: string, multipleModels: boolean) {
        const worst = gatherWorst('angles', residues, stats, threshold, maxCount);
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        return (
            <div style={ WorstValuesTableStyle }>
                {...worst.map((x, idx) => {
                    const residueName = this.renderResidueName(x.residue, multipleModels);
                    const onAtomsClicked = (r: Measurements.Residue) => {
                        const isSelected = isResidueInSelection(x.residue, this.props.structureSelection)
                        if (!isSelected) {
                            amendResidueSelection(this.props.structureSelection, x.residue, 'add');
                            selectionDisplayer({ steps: [], residues: this.props.structureSelection.residues, atoms: this.props.structureSelection.atoms, reconstruct: false }, this.props.dnatcofication, this.props.viewerInterop);
                            this.events.residueToggled.next({ residue: x.residue, transition: 'selected' });
                        } else {
                            amendResidueSelection(this.props.structureSelection, x.residue, 'remove');
                            selectionDisplayer({ steps: [], residues: this.props.structureSelection.residues, atoms: this.props.structureSelection.atoms, reconstruct: true }, this.props.dnatcofication, this.props.viewerInterop);
                            this.events.residueToggled.next({ residue: x.residue, transition: 'deselected' });
                        }
                    };

                    return (
                        <React.Fragment key={idx}>
                            <WorstValueResidueName
                                name={residueName}
                                residue={x.residue}
                                selection={this.props.structureSelection}
                                d={this.props.dnatcofication}
                                vi={this.props.viewerInterop}
                                toggleEvent={this.events.residueToggled}
                            />
                            {renderBondAngleDetail(
                                this.props.dnatcofication,
                                x.bond,
                                x.maybeBin,
                                x.pGroup,
                                x.residue,
                                residueName,
                                structureName,
                                outlierColor,
                                pgrpIndices,
                                this.props.viewerInterop,
                                onAtomsClicked
                            )}
                            <div />
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    private renderWorstLengths(residues: Measurements.Residue[], stats: ALMResidueStats[], maxCount: number, threshold: number|'outlier', structureName: string, multipleModels: boolean) {
        const worst = gatherWorst('lengths', residues, stats, threshold, maxCount);
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        return (
            <div style={ WorstValuesTableStyle }>
                {...worst.map((x, idx) => {
                    const residueName = this.renderResidueName(x.residue, multipleModels);
                    const onAtomsClicked = (r: Measurements.Residue) => {
                        const isSelected = isResidueInSelection(x.residue, this.props.structureSelection)
                        if (!isSelected) {
                            amendResidueSelection(this.props.structureSelection, x.residue, 'add');
                            selectionDisplayer({ steps: [], residues: this.props.structureSelection.residues, atoms: this.props.structureSelection.atoms, reconstruct: false }, this.props.dnatcofication, this.props.viewerInterop);
                            this.events.residueToggled.next({ residue: x.residue, transition: 'selected' });
                        } else {
                            amendResidueSelection(this.props.structureSelection, x.residue, 'remove');
                            selectionDisplayer({ steps: [], residues: this.props.structureSelection.residues, atoms: this.props.structureSelection.atoms, reconstruct: true }, this.props.dnatcofication, this.props.viewerInterop);
                            this.events.residueToggled.next({ residue: x.residue, transition: 'deselected' });
                        }
                    };

                    return (
                        <React.Fragment key={idx}>
                            <WorstValueResidueName
                                name={residueName}
                                residue={x.residue}
                                selection={this.props.structureSelection}
                                d={this.props.dnatcofication}
                                vi={this.props.viewerInterop}
                                toggleEvent={this.events.residueToggled}
                            />
                            {renderBondLengthDetail(
                                this.props.dnatcofication,
                                x.bond,
                                x.maybeBin,
                                x.pGroup,
                                x.residue,
                                residueName,
                                structureName,
                                outlierColor,
                                pgrpIndices,
                                this.props.viewerInterop,
                                onAtomsClicked
                            )}
                            <div />
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    private selectionName(multipleModels: boolean, modelIdx: number, chain: string) {
        let name = multipleModels
            ? modelIdx === InvalidModelIndex
                ? '' : `m${this.props.dnatcofication.data.structures[0].models[modelIdx].num}`
            : '';
        name += chain === InvalidChain
            ? ''
            : name ? `-${chain}` : chain;

        return `${structureIdentifyingName(this.props.dnatcofication)}_${name ? `${name}_` : ''}`;
    }

    private selectionToIndices(modelIdx: number, chain: string) {
        const alm = this.props.dnatcofication.data.alm;
        if (modelIdx === InvalidModelIndex) {
            return sequence(0, alm.residues.length - 1);
        } else {
            const modelNum = this.props.dnatcofication.data.structures[0].models[modelIdx].num;

            if (chain)
                return alm.chains.get(modelNum)?.get(chain) ?? [];
            else
                return alm.models.get(modelNum) ?? [];
        }
    }

    gotoResidue = (id: string, ref: React.RefObject<Residue>) => {
        if (this.residuesTainerRef.current)
            scrollIntoViewIfNeeded(id, this.residuesTainerRef.current);
        ref.current?.collapseExpand('expand');
    }

    increaseShownResiduesLimit = (increaseBy = ShownResiduesIncrement) => {
        this.setState({ ...this.state, shownResiduesLimit: this.state.shownResiduesLimit + increaseBy });
        setTimeout(() => this.inhibitLoadNext = false, 100);
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.chainSwitched, () => this.forceUpdate());

        this.subscribe(this.props.viewerInterop.events.structuresDeselected, () => {
            for (const ref of this.residueBlocksMapping.values()) {
                if (ref.current)
                    ref.current.collapseExpand('collapse');
            }
        });
        this.subscribe(this.props.viewerInterop.events.residueRequested, (sel) => {
            const authRes: AuthResidue = sel;
            const cifRes = StructureSelection.authToCifResidue(this.props.dnatcofication.data.structures[0], authRes);
            if (!cifRes)
                return;

            const struName = structureIdentifyingName(this.props.dnatcofication);
            const id = residueIdentifyingName(
                struName,
                {
                    modelNum: cifRes.modelNum,
                    chain: cifRes.chain,
                    seqId: cifRes.seqId,
                    altId: cifRes.altId,
                    authChain: authRes.chain,
                    authSeqId: authRes.seqId,
                    insCode: authRes.insCode,
                    compound: 'A', // Irrelevant,
                    bondAngles: [], // Irrelevant
                    bondLengths: [] // Irrelevant
                }
            );

            const ref = this.residueBlocksMapping.get(id);
            if (document.getElementById(id)) {
                // Corresponding residue block is displayed, scroll to it
                if (ref)
                    this.gotoResidue(id, ref);
            } else {
                // Corresponding residue block is not displayed. Expand the residue blocks list and scroll to it then.
                const { modelIdx, chain } = this.getSelection();
                const numSelected = this.selectionToIndices(modelIdx, chain).length;

                if (this.state.shownResiduesLimit < numSelected)
                    this.increaseShownResiduesLimit(numSelected - this.state.shownResiduesLimit + 1);

                setTimeout(
                    () => {
                        const ref = this.residueBlocksMapping.get(id);
                        if (ref)
                            this.gotoResidue(id, ref);
                    },
                    100
                );
            }
        });
        this.subscribe(this.events.residueToggled, (ev) => {
            const { residue, transition } = ev;
            const id = residueIdentifyingName(structureIdentifyingName(this.props.dnatcofication), residue);
            const block = this.residueBlocksMapping.get(id);

            if (transition === 'selected') {
                if (!block) {
                    const { modelIdx, chain } = this.getSelection();
                    const numSelected = this.selectionToIndices(modelIdx, chain).length;

                    if (this.state.shownResiduesLimit < numSelected)
                        this.increaseShownResiduesLimit(numSelected - this.state.shownResiduesLimit + 1);

                    setTimeout(() => {
                        const block = this.residueBlocksMapping.get(id);
                        if (block)
                            this.gotoResidue(id, block);
                    }, 1);
                } else
                    this.gotoResidue(id, block);
            } else
                block?.current?.collapseExpand('collapse');
        });
    }

    componentDidUpdate(prevProps: View.Props) {
        const prevModel = prevProps.structureSelection.modelIndex;
        const prevChain = prevProps.structureSelection.chain;
        const model = this.props.structureSelection.modelIndex;
        const chain = this.props.structureSelection.chain;

        if (prevModel !== model || prevChain !== chain)
            this.setState({ ...this.state, shownResiduesLimit: DefaultShownResiduesLimit });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const multipleModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
        const { modelIdx, chain } = this.getSelection();
        const alm = this.props.dnatcofication.data.alm;

        const selectedIndices = this.selectionToIndices(modelIdx, chain);
        const selectedResidues = selectedIndices.map(x => alm.residues[x]);
        const selectedResidueStats = selectedIndices.map(x => alm.stats[x]);

        const summary = Summarize.substructure(selectedResidues);
        const thresholds = DAnglesLengths.pGroupThresholds();
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        const htmlColorsForStatsBar = new Array<string>();
        for (let idx = 0; idx < DAnglesLengths.pGroupCount(); idx++)
            htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.pGroupColor(idx))));
        htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.outlierColor())));

        const countsAngles = countsInGroups(summary.angles, thresholds);
        const countsLenghts = countsInGroups(summary.lengths, thresholds);

        const percentileOptions = [
            { caption: 'Outliers', value: '' },
            ...thresholds.reverse().map(thr => {
                const v = thr.toString();
                return { caption: v, value: v };
            })
        ];

        const pathPrefix = GlobalConfig.data().pathPrefix;
        const mkHeader = (text: string) => {
            const Style = { display: 'flex', flexDirection: 'row', alignItems: 'center' } as StandardLonghandProperties;

            return {
                collapsed: (
                    <div className='rdo-secondary-caption rdo-active' style={Style}>
                        <div style={{ flex: 1 }}>{text}</div>
                        <Icon img={`${pathPrefix}/imgs/triangle-up.svg`} size='text' />
                    </div>
                ),
                expanded: (
                    <div className='rdo-secondary-caption rdo-active' style={Style}>
                        <div style={{ flex: 1 }}>{text}</div>
                        <Icon img={`${pathPrefix}/imgs/triangle-down.svg`} size='text' />
                    </div>
                )
            };
        };

        const residuesOuterTainerRef = React.createRef<HTMLDivElement>();
        const residueBlocks = this.renderSelection(
            this.residuesTainerRef,
            selectedIndices,
            multipleModels,
            thresholds,
            pgrpIndices,
            htmlColorsForStatsBar,
            this.state.shownResiduesLimit,
            this.increaseShownResiduesLimit
        );
        this.residueBlocksMapping = residueBlocks.mapping;

        return (
            <div style={{ ...Common.VScrollGridJail, gridTemplateRows: 'auto auto auto auto auto auto 1fr auto' }}>
                <NamedList sizing='min-content' rowSpacing='half'>
                {
                    multipleModels
                        ? <NamedListItem name='Model'>
                                <ModelSelect
                                    dnatcofication={this.props.dnatcofication}
                                    structureSelection={this.props.structureSelection}
                                    switching={this.props.switching}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            switching={this.props.switching}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='rdo-secondary-caption'>Structure/Selection</div>
                <OverallStatsBar
                    counts={{ angles: countsAngles, lengths: countsLenghts }}
                    downloaders={StatsDownloaders}
                    name={this.selectionName(multipleModels, modelIdx, chain)}
                    residues={selectedResidues}
                    stats={selectedResidueStats}
                    style={{ height: '4em' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={{ ...BarCaptionStyle, left: 'calc(var(--h-gap) / 2)' }}>Lengths</div>, summary.lengths, countsLenghts, htmlColorsForStatsBar)}
                        </div>
                        <div style={{ flex: 1 }}>
                            {renderSubstructureStats(<div style={{ ...BarCaptionStyle, left: 'calc(var(--h-gap) / 2)' }}>Angles</div>, summary.angles, countsAngles, htmlColorsForStatsBar)}
                        </div>
                    </div>
                </OverallStatsBar>

                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header={mkHeader('Residues')}
                        style={ Common.VScrollJail }
                        onCollapsedExpanded={(change) => {
                            if (change === 'collapsed')
                                this.setState({ ...this.state, shownResiduesLimit: DefaultShownResiduesLimit });
                        }}
                    >
                        <div
                            ref={residuesOuterTainerRef}
                            style={{ ...Common.VScrollElement, position: 'relative' }}
                        >
                            <div
                                className='rdo-scroll-vertically-with-scrollbar'
                                style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--h2-gap) / 2)' }}
                                ref={this.residuesTainerRef}
                                onScroll={(ev) => {
                                    // Debounce
                                    if (this.inhibitLoadNext)
                                        return;

                                    const self = ev.currentTarget;
                                    const loadNextElem = document.querySelector(`#${LoadNextElemId}`);
                                    if (!loadNextElem)
                                        return;

                                    const tainerBRect = self.getBoundingClientRect();
                                    const loadNextBRect = loadNextElem.getBoundingClientRect();

                                    if (loadNextBRect.top + loadNextBRect.height / 2 < tainerBRect.bottom) {
                                        this.inhibitLoadNext = true;
                                        this.increaseShownResiduesLimit();
                                    }
                                }}
                            >
                                {residueBlocks.elems}
                            </div>
                            <div className='rdo-floating-search-icon-tainer' style={{ bottom: 'var(--x-gap)', right: 'var(--x-gap)' }}>
                                <IconButton
                                    src={`${pathPrefix}/imgs/magnifying-glass.svg`}
                                    className='rdo-floating-search-icon rdo-pushbutton-border'
                                    onClick={() => {
                                        if (this.searchBoxOpen === true || !residuesOuterTainerRef.current)
                                            return;

                                        const searching: SearchBox.Searching<Measurements.Residue> = {
                                            ...this.Searching,
                                            onRenderResult: (residue: Measurements.Residue) => this.renderResidueName(residue, multipleModels),
                                            onUseResult: (r) => {
                                                const id = residueIdentifyingName(structureIdentifyingName(this.props.dnatcofication), r);
                                                const ref = this.residueBlocksMapping.get(id);

                                                if (!ref) {
                                                    if (selectedResidues.length > this.state.shownResiduesLimit) {
                                                        this.increaseShownResiduesLimit(selectedResidues.length);
                                                        setTimeout(() => {
                                                            const ref = this.residueBlocksMapping.get(id);
                                                            if (ref)
                                                                this.gotoResidue(id, ref);
                                                        }, 1);
                                                    }
                                                } else
                                                    this.gotoResidue(id, ref);
                                            },
                                        };
                                        const sbprops = { ...this.SearchBoxProps, searching };

                                        this.searchBoxOpen = true;
                                        SearchBox.create(residuesOuterTainerRef.current, sbprops);
                                    }}
                                />
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>

                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header={mkHeader('Worst lengths')}
                        style={ Common.VScrollJail }
                    >
                        <NamedList sizing='min-content' rowSpacing='half'>
                            <NamedListItem name='Percentile'>
                                <ComboBox
                                    options={percentileOptions}
                                    value={this.state.worstLengthsThreshold}
                                    onChange={(v) => this.setState({ ...this.state, worstLengthsThreshold: v }) }
                                />
                            </NamedListItem>
                            <NamedListItem name='Max. count'>
                                <SpinBox
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={this.state.maxWorstLengths}
                                    onChange={(v) => this.setState({ ...this.state, maxWorstLengths: v })}
                                />
                            </NamedListItem>
                        </NamedList>
                        <div style={ Common.VScrollElement }>
                            <div className='rdo-scroll-vertically-with-scrollbar'>
                                {this.renderWorstLengths(
                                    selectedResidues,
                                    selectedResidueStats,
                                    this.state.maxWorstLengths,
                                    this.state.worstLengthsThreshold ? parseFloat(this.state.worstLengthsThreshold) : 'outlier',
                                    structureIdentifyingName(this.props.dnatcofication),
                                    multipleModels
                                )}
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>

                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header={mkHeader('Worst angles')}
                        style={ Common.VScrollJail }
                    >
                        <NamedList sizing='min-content' rowSpacing='half'>
                            <NamedListItem name='Percentile'>
                                <ComboBox
                                    options={percentileOptions}
                                    value={this.state.worstAnglesThreshold}
                                    onChange={(v) => this.setState({ ...this.state, worstAnglesThreshold: v }) }
                                />
                            </NamedListItem>
                            <NamedListItem name='Max. count'>
                                <SpinBox
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={this.state.maxWorstAngles}
                                    onChange={(v) => this.setState({ ...this.state, maxWorstAngles: v })}
                                />
                            </NamedListItem>
                        </NamedList>
                        <div style={ Common.VScrollElement }>
                            <div className='rdo-scroll-vertically-with-scrollbar'>
                                {this.renderWorstAngles(
                                    selectedResidues,
                                    selectedResidueStats,
                                    this.state.maxWorstAngles,
                                    this.state.worstAnglesThreshold ? parseFloat(this.state.worstAnglesThreshold) : 'outlier',
                                    structureIdentifyingName(this.props.dnatcofication),
                                    multipleModels
                                )}
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>

                <div />

                <div style={{ width: '100%', maxWidth: '30em', margin: 'auto' }}>
                    <div className='rdo-talgn-center rdo-strong'>Naval validation reports</div>
                    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                        <div
                            className='rdo-dynamic-table-download-button'
                            style={{ flex: 1, justifyContent: 'center'}}
                            onClick={() => Net.serveFile(
                                FileTypes['csv'].mimeType,
                                Naval.bondsAsCsv(this.props.dnatcofication.data.naval.bonds, ','),
                                `${this.props.dnatcofication.pdbId}-naval-bonds-report.csv`
                            )}
                        >
                            <Icon img={`${pathPrefix}/imgs/data-transfer-download.svg`} size='text' />
                            Bond lengths
                        </div>
                        <div
                            className='rdo-dynamic-table-download-button'
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => Net.serveFile(
                                FileTypes['csv'].mimeType,
                                Naval.anglesAsCsv(this.props.dnatcofication.data.naval.angles, ','),
                                `${this.props.dnatcofication.pdbId}-naval-angles-report.csv`
                            )}
                        >
                            <Icon img={`${pathPrefix}/imgs/data-transfer-download.svg`} size='text' />
                            Bond angles
                        </div>
                        <div
                            className='rdo-dynamic-table-download-button'
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => Net.serveFile(
                                FileTypes['csv'].mimeType,
                                Naval.geometryAsCsv(this.props.dnatcofication.data.naval.geometry, ','),
                                `${this.props.dnatcofication.pdbId}-naval-geometry-report.csv`
                            )}
                        >
                            <Icon img={`${pathPrefix}/imgs/data-transfer-download.svg`} size='text' />
                            Geometry
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

async function selectionDisplayer(pieces: SelectedPieces, d: Dnatcofication, vi: ViewerInterop) {
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

function selectionMaker(
    newStepId: SelectedPieces['steps'][0], newResidue: SelectedPieces['residues'][0], newAtom: SelectedPieces['atoms'][0],
    steps: number[], residues: SelectedPieces['residues'], atoms: SelectedPieces['atoms'],
    d: Dnatcofication
): SelectedPieces {
    let newResidues;
    if (residues.find((x) => StructureSelection.cifResiduesMatch(x, newResidue)))
        newResidues = residues;
    else
        newResidues = [...residues.filter((x) => x.modelNum === newResidue.modelNum), newResidue];

    // If the selection event came from the viewer, the viewer does not know that we want to
    // select the residue AND the preceding O3' atom - if there is any. We need to augment the input atom
    // accordingly by hand here.
    if (newAtom === InvalidAtom) {
        const chain = d.data.alm.chains.get(newResidue.modelNum)?.get(newResidue.chain);
        if (chain) {
            for (const idx of chain) {
                const r = d.data.alm.residues[idx];
                if (r.seqId === newResidue.seqId && r.altId === newResidue.altId) {
                    if (Measurements.Residue.hasPrevious(r)) {
                        newAtom = {
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
    }

    let newAtoms;
    if (atoms.find((x) => StructureSelection.cifAtomsMatch(x, newAtom)))
        newAtoms = atoms;
    else {
        newAtoms = atoms.filter((x) => x.modelNum === newAtom.modelNum);
        if (newAtom !== InvalidAtom)
            newAtoms.push(newAtom);
    }

    return {
        steps: [],
        residues: newResidues,
        atoms: newAtoms,
        reconstruct: steps.length > 0
    };
}

export namespace AnglesLengths {
    export const SelectionDisplayer = selectionDisplayer;
    export const SelectionMaker = selectionMaker;
}
