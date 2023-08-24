import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Subject, Subscription } from 'rxjs';
import { AnglesLengthsCommon, FloatingCue, NavalItem, PGroupSummary, Prosco, ResidueName, WindowsTracker } from './angles-lengths-common';
import { View } from '../view';
import { SearchBox } from '../../search-box';
import {
    AuthResidue,
    StructureSelection,
} from '../../structure-selection';
import { Common } from '../../common';
import { colorStyle, colorToRgb, colorToTuple, hexToRgb, scrollIntoViewIfNeeded, rgbToHex, ColorTuple, Rgba } from '../../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { ComboBox } from '../../../common/combo-box';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Icon } from '../../../common/icon';
import { Popup } from '../../../common/popup';
import { IconButton } from '../../../common/push-button';
import { SpinBox } from '../../../common/spin-box';
import { Window } from '../../../common/window';
import { DataTransferDownloadImg, MagnifyingGlassImg, TriangleDownImg } from '../../../../assets/images';
import { ALM } from '../../../../dnatco/alm';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { tripletTag, Triplet } from '../../../../dnatco/angles-lengths/angles';
import { ByResidueHelpers } from '../../../../dnatco/angles-lengths/helpers';
import { pairTag, Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { SerializeByResidue } from '../../../../dnatco/angles-lengths/serialize';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { Naval } from '../../../../dnatco/naval';
import { GlobalConfig } from '../../../../global-config';
import { parseIntStrict, sequence } from '../../../../util';
import { doDownload, Downloader, FileTypes } from '../../../../util/downloader';
import { EventsKeeper } from '../../../../util/events-keeper';
import { M } from '../../../../util/math';
import { Net } from '../../../../util/net';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';

type StatsDownloader = Downloader<{
    residues: Measurements.Residue[],
    counts: {
        angles: Summarize.CountsInGroup[],
        lengths: Summarize.CountsInGroup[]
    },
    stats: ALM.ResidueStats[],
}>;
const StatsDownloaders = [
    {
        caption: 'CSV',
        download: function(fileNameStem, data) {
            const text = SerializeByResidue.toCsv(data.counts.angles, data.counts.lengths, data.residues, data.stats);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.csv,
    },
    {
        caption: 'JSON',
        download: function(fileNameStem, data) {
            const text = SerializeByResidue.toJson(data.counts.angles, data.counts.lengths, data.residues, data.stats);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.json,
    }
] as StatsDownloader[];

function makeAngleDetails(props: ResidueDetailsProps) {
    const displayOrder = AnglesLengthsCommon.AnglesDisplayOrder[props.residue.compound];

    let elems = [];
    for (const tripletTag of displayOrder) {
        let idx = -1;

        for (let _idx = 0; _idx < props.residue.bondAngles.length; _idx++) {
            if (props.residue.bondAngles[_idx].tag === tripletTag) {
                idx = _idx;
                break;
            }
        }
        if (idx < 0)
            throw new Error(`Bad tripletTag ${tripletTag}`);

        const x = props.residue.bondAngles[idx];
        elems.push(
            <tr className='rdo-angles-lengths' key={idx}>
                {renderBondAngleDetail(
                    props.d,
                    x,
                    props.stats.angles[idx].bin,
                    props.stats.angles[idx].pGroup,
                    props.residue,
                    props.residueName,
                    props.structureName,
                    props.outlierColor,
                    props.pgrpIndices,
                    props.vi,
                    props.winTracker
                )}
                <td style={{ width: '100%' }} />
            </tr>
        );
    }

    return elems;
}

function makeLengthDetails(props: ResidueDetailsProps) {
    const displayOrder = AnglesLengthsCommon.LengthsDisplayOrder[props.residue.compound];

    let elems = [];
    for (const pairTag of displayOrder) {
        let idx = -1;

        for (let _idx = 0; _idx < props.residue.bondLengths.length; _idx++) {
            if (props.residue.bondLengths[_idx].tag === pairTag) {
                idx = _idx;
                break;
            }
        }
        if (idx < 0)
            throw new Error(`Bad pairTag ${pairTag}`);

        const x = props.residue.bondLengths[idx];
        elems.push(
            <tr className='rdo-angles-lengths' key={idx}>
                {renderBondLengthDetail(
                    props.d,
                    x,
                    props.stats.lengths[idx].bin,
                    props.stats.lengths[idx].pGroup,
                    props.residue,
                    props.residueName,
                    props.structureName,
                    props.outlierColor,
                    props.pgrpIndices,
                    props.vi,
                    props.winTracker
                )}
                <td style={{ width: '100%' }} />
            </tr>
        );
    }

    return elems;
}

function renderBondAngleDetail(
    d: Dnatcofication,
    bondAngle: Measurements.BondAngle,
    maybeBin: ALM.MaybeBin,
    pGroup: DAnglesLengths.PGroup,
    residue: Measurements.Residue,
    residueName: JSX.Element,
    structureName: string,
    outlierColor: [r: number, g: number, b: number],
    pgrpIndices: number[],
    vi: ViewerInterop,
    winTracker: WindowsTracker,
    onAtomsClicked?: (r: Measurements.Residue, triplet: Triplet) => void
) {
    const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.anglePGroupData(idx, residue.compound, bondAngle.triplet)!);
    const dlName = `${AnglesLengthsCommon.residueIdentifyingName(structureName, residue)}_${AnglesLengthsCommon.fileNameFriendlyTag(tripletTag(bondAngle.triplet))}`;
    const ni = AnglesLengthsCommon.getNavalAngle(d, residue, bondAngle.triplet);

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
            winTracker={winTracker}
            onAtomsClicked={onAtomsClicked}
        />
    );
}

function renderBondLengthDetail(
    d: Dnatcofication,
    bondLength: Measurements.BondLength,
    maybeBin: ALM.MaybeBin,
    pGroup: DAnglesLengths.PGroup,
    residue: Measurements.Residue,
    residueName: JSX.Element,
    structureName: string,
    outlierColor: [r: number, g: number, b: number],
    pgrpIndices: number[],
    vi: ViewerInterop,
    winTracker: WindowsTracker,
    onAtomsClicked?: (r: Measurements.Residue, pair: Pair) => void,
) {
    const pgrpDatas = pgrpIndices.map(idx => DAnglesLengths.lengthPGroupData(idx, residue.compound, bondLength.pair)!);
    const dlName = `${AnglesLengthsCommon.residueIdentifyingName(structureName, residue)}_${AnglesLengthsCommon.fileNameFriendlyTag(pairTag(bondLength.pair))}`;
    const ni = AnglesLengthsCommon.getNavalBond(d, residue, bondLength.pair);

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
            winTracker={winTracker}
            onAtomsClicked={onAtomsClicked}
        />
    );
}

function BondAngleDetails(props: {
    bondAngle: Measurements.BondAngle,
    downloadName: string,
    maybeBin: ALM.MaybeBin,
    navalItem: NavalItem,
    outlierColor: [r: number, g: number, b: number],
    pGroup: DAnglesLengths.PGroup,
    pGroupDatas: DAnglesLengths.PGroupData[],
    residue: Measurements.Residue,
    residueName: JSX.Element,
    vi: ViewerInterop,
    winTracker: WindowsTracker,

    onAtomsClicked?: (r: Measurements.Residue, triplet: Triplet) => void,
}) {
    const ba = props.bondAngle;
    const clr = props.pGroup ? colorToTuple(props.pGroup.color) : props.outlierColor;

    const doHighlight = () => {
        const r = props.residue;
        const a = AnglesLengthsCommon.makeAtomSelectionPayload(r, props.bondAngle.triplet[0]);
        const b = AnglesLengthsCommon.makeAtomSelectionPayload(r, props.bondAngle.triplet[1]);
        const c = AnglesLengthsCommon.makeAtomSelectionPayload(r, props.bondAngle.triplet[2]);

        if (a && b && c)
            props.vi.api.command(ViewerApi.Commands.Highlight([a, b, c]));
    };
    const doUnhighlight = () => props.vi.api.command(ViewerApi.Commands.Unhighlight());

    // Do not look at this code. This code is a major workaround
    // of CSS being fucking stupid.
    const [cueHeight, setCueHeight] = React.useState(0);
    const cueRef = React.useRef<HTMLTableCellElement>(null);
    React.useLayoutEffect(() => {
        const cue = cueRef.current;
        if (cue && cueHeight === 0)
            setCueHeight(cue.clientHeight);
    });

    return (
        <>
            <td
                style={{ backgroundColor: colorStyle(clr) }}
                onClick={(evt) => {
                    const hwnd = Window.create(
                        <PGroupSummary
                            bins={DAnglesLengths.angleAverages(props.residue.compound, ba.triplet)!}
                            pGroup={props.pGroup}
                            pGroupDatas={props.pGroupDatas}
                            rangeFormatter={(v) => M.r2d(v).toFixed(2)}
                            residueName={props.residueName}
                            suffix={'\u00B0'}
                            value={ba.angle}
                            valueFormatter={(v) => M.r2d(v).toFixed(2)}
                            naval={props.navalItem} // Contained value is already in degrees
                            xTitle={'Angle (\u00B0)'}
                            yTitle='Prob. (%)'
                            xTransform={(x) => M.r2d(x)}
                            yTransform={(y) => y * 100}
                            downloadFileName={props.downloadName}
                            highlighter={doHighlight}
                            vi={props.vi}
                        />,
                        AnglesLengthsCommon.pGroupWindowTitle(props.residueName, AnglesLengthsCommon.tripletBondName(ba.triplet, ba.tag)),
                        { x: evt.pageX, y: evt.pageY },
                        () => props.winTracker.remove(hwnd),
                        { initialWidth: 450, resizeableWidth: true, forceResize: true }
                    );

                    props.winTracker.add(hwnd);
                }}
            >
                <div style={{ width: '1em' }} />
            </td>
            <td
                className='rdo-angles-lengths'
                onClick={() => {
                    if (props.onAtomsClicked)
                        props.onAtomsClicked(props.residue, props.bondAngle.triplet);
                }}
                onMouseEnter={doHighlight}
                onMouseLeave={doUnhighlight}
            >
                {AnglesLengthsCommon.tripletBondName(ba.triplet, ba.tag)}
            </td>
            <td
                onMouseEnter={doHighlight}
                onMouseLeave={doUnhighlight}
                className='rdo-monospace rdo-talgn-right rdo-angles-lengths'
            >
                {M.r2d(ba.angle).toFixed(2)}{'\u00B0'}
            </td>
            <td className='rdo-angles-lengths'>
                <Prosco bin={props.maybeBin} />
            </td>
        </>
    );
}

function BondLengthDetails(props: {
    bondLength: Measurements.BondLength,
    downloadName: string,
    maybeBin: ALM.MaybeBin,
    navalItem: NavalItem,
    outlierColor: [r: number, g: number, b: number],
    pGroup: DAnglesLengths.PGroup,
    pGroupDatas: DAnglesLengths.PGroupData[],
    residue: Measurements.Residue,
    residueName: JSX.Element,
    vi: ViewerInterop,
    winTracker: WindowsTracker,

    onAtomsClicked?: (r: Measurements.Residue, pair: Pair) => void,
}) {
    const bl = props.bondLength;
    const clr = props.pGroup ? colorToTuple(props.pGroup.color) : props.outlierColor;

    const doHighlight = () => {
        const r = props.residue;
        const a = AnglesLengthsCommon.makeAtomSelectionPayload(r, props.bondLength.pair[0]);
        const b = AnglesLengthsCommon.makeAtomSelectionPayload(r, props.bondLength.pair[1]);

        if (a && b)
            props.vi.api.command(ViewerApi.Commands.Highlight([a, b]));
    };
    const doUnhighlight = () => props.vi.api.command(ViewerApi.Commands.Unhighlight());

    // Do not look at this code. This code is a major workaround
    // of CSS being fucking stupid.
    const [cueHeight, setCueHeight] = React.useState(0);
    const cueRef = React.useRef<HTMLTableCellElement>(null);
    React.useLayoutEffect(() => {
        const cue = cueRef.current;
        if (cue && cueHeight === 0)
            setCueHeight(cue.clientHeight);
    });

    return (
        <>
            <td
                style={{ backgroundColor: colorStyle(clr) }}
                ref={cueRef}
                onClick={(evt) => {
                    const hwnd = Window.create(
                        <PGroupSummary
                            bins={DAnglesLengths.lengthAverages(props.residue.compound, bl.pair)!}
                            pGroup={props.pGroup}
                            pGroupDatas={props.pGroupDatas}
                            rangeFormatter={(v) => v.toFixed(3)}
                            residueName={props.residueName}
                            suffix={'\u00A0\u00C5'}
                            value={bl.length}
                            valueFormatter={(v) => v.toFixed(3)}
                            naval={props.navalItem}
                            xTitle={'Length (\u00C5)'}
                            yTitle='Prob. (%)'
                            yTransform={(y) => y * 100}
                            downloadFileName={props.downloadName}
                            highlighter={doHighlight}
                            vi={props.vi}
                        />,
                        AnglesLengthsCommon.pGroupWindowTitle(props.residueName, AnglesLengthsCommon.pairBondName(props.bondLength.pair, props.bondLength.tag)),
                        { x: evt.pageX, y: evt.pageY },
                        () => props.winTracker.remove(hwnd),
                        { initialWidth: 450, resizeableWidth: true, forceResize: true }
                    );

                    props.winTracker.add(hwnd);
                }}
            >
                <div style={{ width: '1em' }} />
            </td>
            <td
                className='rdo-angles-lengths'
                onClick={() => {
                    if (props.onAtomsClicked)
                        props.onAtomsClicked(props.residue, props.bondLength.pair);
                }}
                onMouseEnter={doHighlight}
                onMouseLeave={doUnhighlight}
            >
                {AnglesLengthsCommon.pairBondName(bl.pair, bl.tag)}
            </td>
            <td
                className='rdo-monospace rdo-talgn-right rdo-angles-lengths'
                onMouseEnter={doHighlight}
                onMouseLeave={doUnhighlight}
            >
                {bl.length.toFixed(3)}{'\u00A0\u00C5'}
            </td>
            <td className='rdo-angles-lengths'>
                <Prosco bin={props.maybeBin} />
            </td>
        </>
    );
}

function DownloadButtons(props: {
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
    fileName: string,
    residues: Measurements.Residue[],
    stats: ALM.ResidueStats[],
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {props.downloaders.map((dl, idx) => (
                <div
                    key={idx}
                    className='rdo-dynamic-table-download-button'
                    style={{ flex: 1 }}
                    onClick={e => {
                        e.stopPropagation();
                        dl.download(props.fileName, { residues: props.residues, counts: props.counts, stats: props.stats });
                }}>
                    <Icon img={DataTransferDownloadImg} size='text' />
                    {dl.caption}
                </div>
            ))}
        </div>
    );
}

export function OverallStatsBar(props: {
    children: React.ReactNode,
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
    name: string,
    residues: Measurements.Residue[],
    stats: ALM.ResidueStats[],
    style?: StandardLonghandProperties
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 'calc(var(--v-gap) / 2)', ...props.style }}>
            {props.children}
            <DownloadButtons
                counts={props.counts}
                downloaders={props.downloaders}
                fileName={`${props.name}angles_lenghts_by_residue`}
                residues={props.residues}
                stats={props.stats}
            />
        </div>
    );
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
    stats: ALM.ResidueStats,
    structureName: string,
    vi: ViewerInterop,
    winTracker: WindowsTracker,
}
interface ResidueDetailsProps extends ResidueElemProps {
    onHideRequested: () => void,
}

class ResidueDetails extends React.Component<ResidueDetailsProps, { floatingCueYOffset: number }> {
    private selfRef = React.createRef<HTMLDivElement>();

    constructor(props: ResidueDetailsProps) {
        super(props);

        this.state = {
            floatingCueYOffset: -1,
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

        this.setState({ ...this.state, floatingCueYOffset: off });
    }

    componentDidMount() {
        this.props.tainer.current?.addEventListener('scroll', this.onScroll);
    }

    componentWillUnmount() {
        this.props.tainer.current?.removeEventListener('scroll', this.onScroll);
    }

    render() {
        return (
            <div style={{ position: 'relative' }} ref={this.selfRef}>
                <FloatingCue
                    yOffset={this.state.floatingCueYOffset}
                    onClicked={this.props.onHideRequested}
                >
                    {this.props.residueName}
                </FloatingCue>

                <table className='rdo-angles-lengths' style={{ width: '100%' }}>
                    <tbody>
                        <tr>
                            <td
                                colSpan={5}
                                className='rdo-strong'
                                style={{ textAlign: 'center' }}
                            >Bond lengths</td>
                        </tr>
                        {makeLengthDetails(this.props)}
                        <tr>
                            <td colSpan={5}
                                className='rdo-strong'
                                style={{ textAlign: 'center' }}
                            >Bond angles</td>
                        </tr>
                        {makeAngleDetails(this.props)}
                    </tbody>
                </table>
            </div>
        );
    }
}

function ResidueHeader(props: {
    caption: string | JSX.Element,
    residue: Measurements.Residue,
    residueIdentifyingName: string,
    stats: ALM.ResidueStats,
    structureName: string,
    summary: Summarize.Summary,
    countsAngles: Summarize.CountsInGroup[],
    countsLengths: Summarize.CountsInGroup[],
    colorsForStatsBar: string[],
    winTracker: WindowsTracker,
}) {
    const tainerRef = React.useRef<HTMLDivElement>(null);
    const r = props.residue;

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            ref={tainerRef}
            id={props.residueIdentifyingName}
        >
            <div
                style={{
                    ...AnglesLengthsCommon.StayAboveStyle,
                    top: 0,
                    left: 'var(--h2-gap)',
                    ...AnglesLengthsCommon.BarCaptionStyle,
                }}
            >
                {props.caption}
            </div>

            <OverallStatsBar
                counts={{ angles: props.countsAngles, lengths: props.countsLengths }}
                downloaders={StatsDownloaders}
                name={AnglesLengthsCommon.residueIdentifyingName(props.structureName, r)}
                residues={[props.residue]}
                stats={[props.stats]}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, display: 'flex' }}>
                        {AnglesLengthsCommon.renderSubstructureStats(
                            props.winTracker,
                            props.caption,
                            AnglesLengthsCommon.substructureBarCaption('L'),
                            props.summary.lengths,
                            props.countsLengths,
                            props.colorsForStatsBar,
                            { right: 'var(--h2-gap)' }
                        )}
                    </div>
                    <div style={{ flex: 1, display: 'flex' }}>
                        {AnglesLengthsCommon.renderSubstructureStats(
                            props.winTracker,
                            props.caption,
                            AnglesLengthsCommon.substructureBarCaption('A'),
                            props.summary.angles,
                            props.countsAngles,
                            props.colorsForStatsBar,
                            { right: 'var(--h2-gap)' }
                        )}
                    </div>
                </div>
            </OverallStatsBar>
        </div>
    );
}

class Residue extends React.Component<ResidueElemProps & {
    structureSelection: StructureSelection,
    viewerInterop: ViewerInterop,
    scrollMyselfIntoView: () => void,
    events: Events,
    winTracker: WindowsTracker
}> {
    private collapserRef = React.createRef<CollapsibleVertical>();

    collapseExpand = (change: 'collapse' | 'expand') => {
        this.collapserRef.current?.collapseExpand(change);
    }

    render() {
        return (
            <CollapsibleVertical
                ref={this.collapserRef}
                header={AnglesLengthsCommon.makeCollapsibleHeader(
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
                        winTracker={this.props.winTracker}
                    />
                )}
                onCollapsedExpanded={(change) => {
                    const isSelected = AnglesLengthsCommon.isResidueInSelection(this.props.residue, this.props.structureSelection);
                    if (change === 'expanded' && !isSelected) {
                        AnglesLengthsCommon.selectResidue(this.props.residue, this.props.structureSelection, this.props.events.residueToggled, this.props.d, this.props.vi);
                    } else if (change === 'collapsed' && isSelected) {
                        AnglesLengthsCommon.deselectResidue(this.props.residue, this.props.structureSelection, this.props.events.residueToggled, this.props.d, this.props.vi);
                    }
                }}
                initiallyExpanded={AnglesLengthsCommon.isResidueInSelection(this.props.residue, this.props.structureSelection)}
            >
                <ResidueDetails
                    onHideRequested={() => this.collapserRef.current?.collapseExpand('collapse')}
                    { ...this.props }
                />
            </CollapsibleVertical>
        );
    }
}

function WorstValueResidueName(props: {
    name: React.ReactNode,
    residue: Measurements.Residue,
    selection: StructureSelection,
    backgroundColorSelected: Rgba,
    d: Dnatcofication,
    vi: ViewerInterop,
    events: Events,
}) {
    const doHighlight = () => {
        const r = props.residue;
        const sel = ViewerApi.Payloads.ResidueSelection(r.modelNum, r.authChain, r.chain, r.authSeqId, r.insCode, r.altId, 0);

        props.vi.api.command(ViewerApi.Commands.Highlight([sel]));
    };
    const doUnhighlight = () => props.vi.api.command(ViewerApi.Commands.Unhighlight());

    const [selected, setSelected] = React.useState(AnglesLengthsCommon.isResidueInSelection(props.residue, props.selection));
    React.useEffect(() => {
        const subs = new Array<Subscription>();
        subs.push(props.events.residueToggled.subscribe(() => {
            const isSelected = AnglesLengthsCommon.isResidueInSelection(props.residue, props.selection);
            setSelected(isSelected);
        }));
        subs.push(props.events.allResiduesDeselected.subscribe(() => {
            setSelected(false);
        }));

        return () => {
            subs.forEach((s) => s.unsubscribe());
        }
    }, []);

    const { r, g, b, a } = props.backgroundColorSelected;
    return (
        <div
            style={selected ? { backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})` } : {} }
            onClick={() => {
                const isSelected = AnglesLengthsCommon.isResidueInSelection(props.residue, props.selection);
                if (!isSelected) {
                    AnglesLengthsCommon.selectResidue(props.residue, props.selection, props.events.residueToggled, props.d, props.vi);
                } else {
                    AnglesLengthsCommon.deselectResidue(props.residue, props.selection, props.events.residueToggled, props.d, props.vi);
                }
            }}
            onMouseEnter={doHighlight}
            onMouseLeave={doUnhighlight}
        >
            {props.name}
        </div>
    );
}


type Events = {
    allResiduesDeselected: Subject<void>,
    residueToggled: AnglesLengthsCommon.ResidueToggledEvent,
}
const DefaultShownResiduesLimit = 100;
const ShownResiduesIncrement = 100;
const LoadNextElemId = 'rdo-angles-lenghts-load-next-elem';
export class AnglesLengthsByResidue extends View<
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
    // Needed to keep track of any open PGroupSummary windows because we need to close them
    // if we get unmounted
    private winTracker = new WindowsTracker();

    private readonly ek = new EventsKeeper();
    readonly events: Events = {
        allResiduesDeselected: this.ek.subject(),
        residueToggled: this.ek.subject(),
    };

    private readonly Searching = {
        onSearch: (prompt: string) => {
            const toks = prompt.split(' ').slice(0, 2);
            const authSeqId = parseIntStrict(toks.length === 2 ? toks[1] : toks[0]);
            const authChain = toks.length === 2 ? toks[0] : void 0;

            if (isNaN(authSeqId))
                return [];

            const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);
            const alm = this.props.dnatcofication.data.almByResidue;

            const selectedIndices = ByResidueHelpers.selectionToIndices(this.props.dnatcofication, modelIdx, chain);
            const selectedResidues = selectedIndices.map((x) => alm.residues[x]);

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

    private renderSelection(
        tainer: React.RefObject<HTMLDivElement>,
        indices: number[],
        multipleModels: boolean,
        pgrpIndices: number[],
        colorsForStatsBar: string[],
        maxResidues: number,
        loadNext: () => void,
        winTracker: WindowsTracker
    ): { elems: JSX.Element[], mapping: Map<string, React.RefObject<Residue>> } {
        const r = this.props.dnatcofication.data.almByResidue.residues;
        const s = this.props.dnatcofication.data.almByResidue.stats;
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());

        const mapping = new Map<string, React.RefObject<Residue>>();
        const elems = new Array<JSX.Element>();
        let adx = 0;
        for (; adx < indices.length && adx < maxResidues; adx++) {
            const idx = indices[adx];

            const _r = r[idx];
            const _s = s[idx];
            const countsAngles = Summarize.countsInGroups(_s.summary.angles);
            const countsLenghts = Summarize.countsInGroups(_s.summary.lengths);
            const residueName = <ResidueName r={_r} multipleModels={multipleModels} />
            const structureName = AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication);
            const identResName = AnglesLengthsCommon.residueIdentifyingName(structureName, _r);

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
                winTracker={winTracker}
                events={this.events}
                key={idx}
            />;

            elems.push(elem);
            mapping.set(identResName, ref);
        }

        if (adx === maxResidues)
            elems.push(<div key={-1} id={LoadNextElemId} onClick={loadNext}>{`(... ${indices.length - maxResidues} more residues)`}</div>);

        return { elems, mapping };
    }

    private renderWorstAngles(residues: Measurements.Residue[], stats: ALM.ResidueStats[], maxCount: number, threshold: number|'outlier', structureName: string, multipleModels: boolean, winTracker: WindowsTracker) {
        const worst = ByResidueHelpers.gatherWorst('angles', residues, stats, threshold, maxCount);
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        const rgb = hexToRgb(GlobalConfig.data().currentStepColor);
        const backgroundColorSelected = Rgba(rgb.r, rgb.g, rgb.b, 0.5);

        return (
            <table className='rdo-angles-lengths'>
                <tbody>
                {...worst.map((x, idx) => {
                    const residueName = <ResidueName r={x.residue} multipleModels={multipleModels} />
                    const onAtomsClicked = (r: Measurements.Residue) => {
                        const isSelected = AnglesLengthsCommon.isResidueInSelection(x.residue, this.props.structureSelection)
                        if (!isSelected) {
                            AnglesLengthsCommon.selectResidue(x.residue, this.props.structureSelection, this.events.residueToggled, this.props.dnatcofication, this.props.viewerInterop);
                        } else {
                            AnglesLengthsCommon.deselectResidue(x.residue, this.props.structureSelection, this.events.residueToggled, this.props.dnatcofication, this.props.viewerInterop);
                        }
                    };

                    return (
                        <tr className='rdo-angles-lengths' key={idx}>
                            <td className='rdo-angles-lengths'>
                                <WorstValueResidueName
                                    name={residueName}
                                    residue={x.residue}
                                    selection={this.props.structureSelection}
                                    backgroundColorSelected={backgroundColorSelected}
                                    d={this.props.dnatcofication}
                                    vi={this.props.viewerInterop}
                                    events={this.events}
                                />
                            </td>
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
                                winTracker,
                                onAtomsClicked
                            )}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        );
    }

    private renderWorstLengths(residues: Measurements.Residue[], stats: ALM.ResidueStats[], maxCount: number, threshold: number|'outlier', structureName: string, multipleModels: boolean, winTracker: WindowsTracker) {
        const worst = ByResidueHelpers.gatherWorst('lengths', residues, stats, threshold, maxCount);
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        const rgb = hexToRgb(GlobalConfig.data().currentStepColor);
        const backgroundColorSelected = Rgba(rgb.r, rgb.g, rgb.b, 0.5);

        return (
            <table className='rdo-angles-lengths'>
                <tbody>
                {...worst.map((x, idx) => {
                    const residueName = <ResidueName r={x.residue} multipleModels={multipleModels} />
                    const onAtomsClicked = (r: Measurements.Residue) => {
                        const isSelected = AnglesLengthsCommon.isResidueInSelection(x.residue, this.props.structureSelection);
                        if (!isSelected) {
                            AnglesLengthsCommon.selectResidue(x.residue, this.props.structureSelection, this.events.residueToggled, this.props.dnatcofication, this.props.viewerInterop);
                        } else {
                            AnglesLengthsCommon.deselectResidue(x.residue, this.props.structureSelection, this.events.residueToggled, this.props.dnatcofication, this.props.viewerInterop);
                        }
                    };

                    return (
                        <tr className='rdo-angles-lengths' key={idx}>
                            <td className='rdo-angles-lengths'>
                                <WorstValueResidueName
                                    name={residueName}
                                    residue={x.residue}
                                    selection={this.props.structureSelection}
                                    backgroundColorSelected={backgroundColorSelected}
                                    d={this.props.dnatcofication}
                                    vi={this.props.viewerInterop}
                                    events={this.events}
                                />
                            </td>
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
                                winTracker,
                                onAtomsClicked
                            )}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        );
    }

    private scrollResidueIntoView(residueIdentifyingName: string, doAfterScroll?: (block: React.RefObject<Residue>) => void) {
        const block = this.residueBlocksMapping.get(residueIdentifyingName);

        if (!block) {
            const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);
            const numSelected = ByResidueHelpers.selectionToIndices(this.props.dnatcofication, modelIdx, chain).length;

            if (this.state.shownResiduesLimit < numSelected)
                this.increaseShownResiduesLimit(numSelected - this.state.shownResiduesLimit + 1);

            setTimeout(() => {
                const block = this.residueBlocksMapping.get(residueIdentifyingName);
                if (block) {
                    if (doAfterScroll)
                        doAfterScroll(block);
                    this.gotoResidue(residueIdentifyingName, block);
                }
            }, 50);
        } else {
            if (doAfterScroll)
                doAfterScroll(block);
            this.gotoResidue(residueIdentifyingName, block);
        }
    }

    gotoResidue = (id: string, ref: React.RefObject<Residue>) => {
        if (this.residuesTainerRef.current)
            scrollIntoViewIfNeeded(id, this.residuesTainerRef.current);
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
            this.events.allResiduesDeselected.next();
        });
        this.subscribe(this.props.viewerInterop.events.residueRequested, (sel) => {
            const authRes: AuthResidue = sel;
            const cifRes = StructureSelection.authToCifResidue(this.props.dnatcofication.data.structures[0], authRes);
            if (!cifRes)
                return;

            const mr: Measurements.Residue = {
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

            AnglesLengthsCommon.selectResidue(mr, this.props.structureSelection, this.events.residueToggled, this.props.dnatcofication, this.props.viewerInterop);
        });
        this.subscribe(this.events.residueToggled, (ev) => {
            const { residue, transition } = ev;
            const id = AnglesLengthsCommon.residueIdentifyingName(AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication), residue);
            if (transition === 'selected')
                this.scrollResidueIntoView(id, (block) => block.current?.collapseExpand('expand'));
            else if (transition === 'deselected') {
                const block = this.residueBlocksMapping.get(id);
                block?.current?.collapseExpand('collapse');
            }
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
        this.winTracker.closeAll();
        this.unsubscribeAll();
    }

    render() {
        const multipleModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
        const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);
        const alm = this.props.dnatcofication.data.almByResidue;

        const selectedIndices = ByResidueHelpers.selectionToIndices(this.props.dnatcofication, modelIdx, chain);
        const selectedResidues = selectedIndices.map((x) => alm.residues[x]);
        const selectedResidueStats = selectedIndices.map((x) => alm.stats[x]);

        const summary = Summarize.substructure(selectedResidues);
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

        const htmlColorsForStatsBar = new Array<string>();
        for (let idx = 0; idx < DAnglesLengths.pGroupCount(); idx++)
            htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.pGroupColor(idx))));
        htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.outlierColor())));

        const countsAngles = Summarize.countsInGroups(summary.angles);
        const countsLenghts = Summarize.countsInGroups(summary.lengths);

        const percentileOptions = [
            { caption: 'Outliers', value: '' },
            ...DAnglesLengths.pGroupThresholds().reverse().map(thr => {
                const v = thr.toString();
                return { caption: v, value: v };
            })
        ];

        const mkHeader = (text: string) => {
            const Style = { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' } as StandardLonghandProperties;

            return {
                collapsed: (
                    <div className='rdo-secondary-caption rdo-active' style={Style}>
                        <img
                            src={TriangleDownImg}
                            style={{ transition: 'rotate var(--anim-speed)', rotate: '0deg' }}
                        />
                        <div style={{ flex: 1 }}>{text}</div>
                    </div>
                ),
                expanded: (
                    <div className='rdo-secondary-caption rdo-active' style={Style}>
                        <img
                            src={TriangleDownImg}
                            style={{ transition: 'rotate var(--anim-speed)', rotate: '180deg' }}
                        />
                        <div style={{ flex: 1 }}>{text}</div>
                    </div>
                )
            };
        };

        const residuesOuterTainerRef = React.createRef<HTMLDivElement>();
        const residueBlocks = this.renderSelection(
            this.residuesTainerRef,
            selectedIndices,
            multipleModels,
            pgrpIndices,
            htmlColorsForStatsBar,
            this.state.shownResiduesLimit,
            this.increaseShownResiduesLimit,
            this.winTracker
        );
        this.residueBlocksMapping = residueBlocks.mapping;

        return (
            <div style={{ ...Common.VScrollGridJail, gridTemplateRows: 'auto auto auto auto auto 1fr auto' }}>
                <div className='rdo-secondary-caption'>{AnglesLengthsCommon.displayedSelectionName(modelIdx, chain, multipleModels, this.props.dnatcofication)}</div>
                <OverallStatsBar
                    counts={{ angles: countsAngles, lengths: countsLenghts }}
                    downloaders={StatsDownloaders}
                    name={AnglesLengthsCommon.selectionName(this.props.dnatcofication, multipleModels, modelIdx, chain)}
                    residues={selectedResidues}
                    stats={selectedResidueStats}
                    style={{ height: '4em' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, display: 'flex' }}>
                            {AnglesLengthsCommon.renderSubstructureStats(
                                this.winTracker,
                                'Lengths',
                                AnglesLengthsCommon.substructureBarCaption('Lengths'),
                                summary.lengths,
                                countsLenghts,
                                htmlColorsForStatsBar
                            )}
                        </div>
                        <div style={{ flex: 1, display: 'flex' }}>
                            {AnglesLengthsCommon.renderSubstructureStats(
                                this.winTracker,
                                'Angles',
                                AnglesLengthsCommon.substructureBarCaption('Angles'),
                                summary.angles,
                                countsAngles,
                                htmlColorsForStatsBar
                            )}
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
                                style={AnglesLengthsCommon.BlockListStyle}
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
                                    src={MagnifyingGlassImg}
                                    className='rdo-floating-search-icon rdo-pushbutton-border'
                                    onClick={() => {
                                        if (this.searchBoxOpen === true || !residuesOuterTainerRef.current)
                                            return;

                                        const searching: SearchBox.Searching<Measurements.Residue> = {
                                            ...this.Searching,
                                            onRenderResult: (residue: Measurements.Residue) => <ResidueName r={residue} multipleModels={multipleModels} />,
                                            onUseResult: (r) => {
                                                const id = AnglesLengthsCommon.residueIdentifyingName(AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication), r);
                                                this.scrollResidueIntoView(id, (block) => block.current?.collapseExpand('expand'));
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
                        header={mkHeader('Most untypical lengths')}
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
                                    AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication),
                                    multipleModels,
                                    this.winTracker
                                )}
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>

                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header={mkHeader('Most untypical angles')}
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
                                    AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication),
                                    multipleModels,
                                    this.winTracker
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
                            onClick={() => {
                                if (this.props.dnatcofication.data.naval.bonds.length === 0) {
                                    Popup.create(<div className='rdo-error-text'>Naval bonds report does not contain any data</div>);
                                } else {
                                    Net.serveFile(
                                        FileTypes['csv'].mimeType,
                                        Naval.bondsAsCsv(this.props.dnatcofication.data.naval.bonds, ','),
                                        `${this.props.dnatcofication.pdbId}_naval_bonds_report.csv`
                                    );
                                }
                            }}
                        >
                            <Icon img={DataTransferDownloadImg} size='text' />
                            Bond lengths
                        </div>
                        <div
                            className='rdo-dynamic-table-download-button'
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                                if (this.props.dnatcofication.data.naval.angles.length === 0) {
                                    Popup.create(<div className='rdo-error-text'>Naval angles report does not contain any data</div>);
                                } else {
                                    Net.serveFile(
                                        FileTypes['csv'].mimeType,
                                        Naval.anglesAsCsv(this.props.dnatcofication.data.naval.angles, ','),
                                        `${this.props.dnatcofication.pdbId}_naval_angles_report.csv`
                                    );
                                }
                            }}
                        >
                            <Icon img={DataTransferDownloadImg} size='text' />
                            Bond angles
                        </div>
                        <div
                            className='rdo-dynamic-table-download-button'
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                                if (this.props.dnatcofication.data.naval.geometry.length === 0) {
                                    Popup.create(<div className='rdo-error-text'>Naval geometry report does not contain any data</div>);
                                } else {
                                    Net.serveFile(
                                        FileTypes['csv'].mimeType,
                                        Naval.geometryAsCsv(this.props.dnatcofication.data.naval.geometry, ','),
                                        `${this.props.dnatcofication.pdbId}_naval_geometry_report.csv`
                                    );
                                }
                            }}
                        >
                            <Icon img={DataTransferDownloadImg} size='text' />
                            Geometry
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
