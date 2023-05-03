import { type StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Subject, type Subscription } from 'rxjs';
import { AnglesLengthsCommon, PGroupSummary, Prosco, ResidueName as CommonResidueName } from './angles-lengths-common';
import { View } from '../view';
import { Common } from '../../common';
import { Constants } from '../../constants';
import {
    InvalidChain, InvalidModelIndex,
    AuthResidue,
    StructureSelection
} from '../../structure-selection';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { Icon } from '../../../common/icon';
import { Tooltip } from '../../../common/tooltip';
import { colorStyle, colorToRgb, colorToTuple, hexToRgb, rgbToHex, type ColorTuple, Rgba } from '../../../util';
import { ALM } from '../../../../dnatco/alm';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { tripletTag, Triplet } from '../../../../dnatco/angles-lengths/angles';
import { pairTag, Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { SerializeByCompound } from '../../../../dnatco/angles-lengths/serialize';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Residues } from '../../../../dnatco/residues';
import { GlobalConfig } from '../../../../global-config';
import { objKeys, sequence } from '../../../../util';
import { doDownload, Downloader, FileTypes } from '../../../../util/downloader';
import { EventsKeeper } from '../../../../util/events-keeper';
import { M } from '../../../../util/math';
import { ViewerApi, ViewerInterop } from '../../../../viewer/viewer-interop';

const BarCaptionStyle = {
    ...AnglesLengthsCommon.BarCaptionStyle,
    top: '50%',
    left: 'var(--h2-gap)',
};

type DownloadableData = {
    angles: ALM.AngleStats[],
    countsAngles: Summarize.CountsInGroup[],
    lengths: ALM.LengthStats[],
    countsLengths: Summarize.CountsInGroup[],
}
function DownloadableData(
    angles: Record<string, ALM.CompoundStats<ALM.AngleStats>>,
    countsAngles: Summarize.CountsInGroup[],
    lengths: Record<string, ALM.CompoundStats<ALM.LengthStats>>,
    countsLengths: Summarize.CountsInGroup[]
): DownloadableData {
    return {
        angles: objKeys(angles).flatMap((k) => Array.from(angles[k].byMetric.values()).map((x) => x.individual)),
        countsAngles,
        lengths: objKeys(lengths).flatMap((k) => Array.from(lengths[k].byMetric.values()).map((x) => x.individual)),
        countsLengths,
    };
}

type StatsDownloader = Downloader<DownloadableData>;
const StatsDownloaders = [
    {
        caption: 'CSV',
        download(fileNameStem, data) {
            const text = SerializeByCompound.toCsv(data.angles, data.countsAngles, data.lengths, data.countsLengths);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.csv,
    },
    {
        caption: 'JSON',
        download(fileNameStem, data) {
            const text = SerializeByCompound.toJson(data.angles, data.countsAngles, data.lengths, data.countsLengths);
            doDownload(fileNameStem, text, this.fileType);
        },
        fileType: FileTypes.json,
    }
] as StatsDownloader[];

function makeAngleDownloadableData(angles: Record<string, ALM.CompoundStats<ALM.AngleStats>>, counts: Summarize.CountsInGroup[]) {
    return DownloadableData(angles, counts, {}, []);
}

function makeLengthDownloadableData(lengths: Record<string, ALM.CompoundStats<ALM.LengthStats>>, counts: Summarize.CountsInGroup[]) {
    return DownloadableData({}, [], lengths, counts);
}

function DownloadButtons(props: {
    downloadableData: DownloadableData,
    downloaders: StatsDownloader[],
    fileName: string,
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
                        dl.download(props.fileName, props.downloadableData);
                }}>
                    <Icon img='imgs/data-transfer-download.svg' size='text' />
                    {dl.caption}
                </div>
            ))}
        </div>
    );
}

function OverallStatsBar(props: {
    children: React.ReactNode,
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloadableData: DownloadableData,
    downloaders: StatsDownloader[],
    name: string,
    style?: StandardLonghandProperties
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 'var(--v2-gap)', ...props.style }}>
            {props.children}
            <DownloadButtons
                downloadableData={props.downloadableData}
                downloaders={props.downloaders}
                fileName={`${props.name}angles_lenghts_by_compound`}
            />
        </div>
    );
}

function Base<T extends ALM.AngleStats | ALM.LengthStats>(props: {
    base: Residues.ElementaryResidue,
    displayOrders: Record<Residues.ElementaryResidue, string[]>,
    stats: ALM.CompoundStats<T>,
    colorsForCounts: string[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    structureName: string,
    events: Events,
    d: Dnatcofication,
    selection: StructureSelection,
    vi: ViewerInterop,
    dlMaker: (stats: Record<string, ALM.CompoundStats<T>>, counts: Summarize.CountsInGroup[]) => DownloadableData,
}) {
    const metrics = [];
    for (const metricName of props.displayOrders[props.base]) {
        const metric = props.stats.byMetric.get(metricName);
        if (!metric)
            continue;
        metrics.push(
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ width: '1em' }} />
                <Metric
                    base={props.base}
                    stats={metric}
                    colorsForCounts={props.colorsForCounts}
                    outlierColor={props.outlierColor}
                    pgrpIndices={props.pgrpIndices}
                    multipleModels={props.multipleModels}
                    structureName={props.structureName}
                    events={props.events}
                    d={props.d}
                    selection={props.selection}
                    vi={props.vi}
                />
            </div>
        );
    }

    const dlStats = { [props.base]: props.stats };
    const dlCounts = Summarize.countsInGroups(props.stats.overall);

    return (
        <CollapsibleVertical
            header={AnglesLengthsCommon.makeCollapsibleHeader(
                <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--h4-gap)' }}>
                    {AnglesLengthsCommon.renderSubstructureStats(
                        <div style={BarCaptionStyle}>{props.base}</div>,
                        props.stats.overall,
                        Summarize.countsInGroups(props.stats.overall),
                        props.colorsForCounts
                    )}
                    <DownloadButtons
                        downloadableData={props.dlMaker(dlStats, dlCounts)}
                        downloaders={StatsDownloaders}
                        fileName={`${props.structureName}_${props.base}_by_compound`}
                    />
                </div>
            )}
        >
            <div
                style={{ ...Common.VScrollElement, position: 'relative' }}
            >
                <div
                    className='rdo-scroll-vertically-with-scrollbar'
                    style={AnglesLengthsCommon.BlockListStyle}
                >
                    <div />
                    {...metrics}
                </div>
            </div>
        </CollapsibleVertical>
    );
}

function Bases<T extends ALM.AngleStats | ALM.LengthStats>(props: {
    data: Record<Residues.ElementaryResidue, ALM.CompoundStats<T>>,
    displayOrders: Record<Residues.ElementaryResidue, string[]>,
    colorsForCounts: string[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    structureName: string,
    events: Events,
    d: Dnatcofication,
    selection: StructureSelection,
    vi: ViewerInterop,
    dlMaker: (stats: Record<string, ALM.CompoundStats<T>>, counts: Summarize.CountsInGroup[]) => DownloadableData,
}) {
    const items: JSX.Element[] = [];

    for (const k of objKeys(props.data)) {
        const stats = props.data[k];
        const totalItems = Array.from(stats.byMetric.values()).reduce(
            (p, metric) => {
                return metric.type === 'angle'
                    ? p + (metric.individual as ALM.AngleStats).angles.length
                    : p + (metric.individual as ALM.LengthStats).lengths.length;
            },
            0
        );

        if (totalItems === 0)
            continue;

        items.push(
            <Base
                base={k}
                displayOrders={props.displayOrders}
                stats={stats}
                colorsForCounts={props.colorsForCounts}
                outlierColor={props.outlierColor}
                pgrpIndices={props.pgrpIndices}
                multipleModels={props.multipleModels}
                structureName={props.structureName}
                events={props.events}
                d={props.d}
                selection={props.selection}
                vi={props.vi}
                dlMaker={props.dlMaker}
            />
        );
    }

    return <>{...items}</>;
}

function Metric<T extends ALM.AngleStats | ALM.LengthStats>(props: {
    base: Residues.ElementaryResidue,
    stats: ALM.MetricStats<T>,
    colorsForCounts: string[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    structureName: string,
    events: Events,
    d: Dnatcofication,
    selection: StructureSelection,
    vi: ViewerInterop,
}) {

    const rgb = hexToRgb(GlobalConfig.data().currentStepColor);
    const backgroundColorSelected = Rgba(rgb.r, rgb.g, rgb.b, 0.5);

    const name = props.stats.type === 'angle'
        ? AnglesLengthsCommon.tripletBondName(props.stats.identifier as Triplet, tripletTag(props.stats.identifier as Triplet))
        : AnglesLengthsCommon.pairBondName(props.stats.identifier as Pair, pairTag(props.stats.identifier as Pair));

    const detailsProps = {
        multipleModels: props.multipleModels,
        outlierColor: props.outlierColor,
        pgrpIndices: props.pgrpIndices,
        structureName: props.structureName,
        backgroundColorSelected,
        events: props.events,
        d: props.d,
        selection: props.selection,
        vi: props.vi
    };
    const details = props.stats.type === 'angle'
        ? <AngleMetricDetails { ...{ ...detailsProps, stats: props.stats.individual as ALM.AngleStats } } />
        : <LengthMetricDetails { ...{ ...detailsProps, stats: props.stats.individual as ALM.LengthStats } } />;

    const dlData: DownloadableData = props.stats.type === 'angle'
        ? { angles: [(props.stats.individual as ALM.AngleStats)], countsAngles: Summarize.countsInGroups(props.stats.overall), lengths: [], countsLengths: [] }
        : { angles: [], countsAngles: [], lengths: [(props.stats.individual as ALM.LengthStats)], countsLengths: Summarize.countsInGroups(props.stats.overall) };

    return (
        <CollapsibleVertical
            style={{ width: '100%' }}
            header={AnglesLengthsCommon.makeCollapsibleHeader(
                <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--h4-gap)' }}>
                    {AnglesLengthsCommon.renderSubstructureStats(
                        <div style={BarCaptionStyle}>{name}</div>,
                        props.stats.overall,
                        Summarize.countsInGroups(props.stats.overall),
                        props.colorsForCounts
                    )}
                    <DownloadButtons
                        downloadableData={dlData}
                        downloaders={StatsDownloaders}
                        fileName={`${props.structureName}_${props.base}_${props.stats.identifier.join('-')}_by_compound`}
                    />
                </div>
            )}
        >
            <div style={{ height: 'var(--v2-gap)' }} />
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ width: '1em' }} />
                {details}
            </div>
        </CollapsibleVertical>
    );
}

function AngleMetricDetails(props: {
    stats: ALM.AngleStats,
    multipleModels: boolean,
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    structureName: string,
    backgroundColorSelected: Rgba,
    events: Events,
    d: Dnatcofication,
    selection: StructureSelection,
    vi: ViewerInterop,
}) {
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
        <table className='rdo-angles-lengths'>
            <tbody>
                {...props.stats.angles.map((item) => {
                    const commonResidueName = <CommonResidueName r={item.residue} multipleModels={props.multipleModels} />;

                    const doHighlight = () => {
                        const r = item.residue;
                        const a = AnglesLengthsCommon.makeAtomSelectionPayload(r, item.angle.triplet[0]);
                        const b = AnglesLengthsCommon.makeAtomSelectionPayload(r, item.angle.triplet[1]);
                        const c = AnglesLengthsCommon.makeAtomSelectionPayload(r, item.angle.triplet[2]);

                        if (a && b && c)
                            props.vi.api.command(ViewerApi.Commands.Highlight([a, b, c]));
                    };
                    const doUnhighlight = () => props.vi.api.command(ViewerApi.Commands.Unhighlight());

                    const ni = AnglesLengthsCommon.getNavalAngle(props.d, item.residue, item.angle.triplet);
                    const clr = item.pGroup ? colorToTuple(item.pGroup.color) : props.outlierColor;
                    const pGroupDatas = props.pgrpIndices.map((idx) => DAnglesLengths.anglePGroupData(idx, item.residue.compound, item.angle.triplet)!);

                    return (
                        <tr
                            className='rdo-angles-lengths'
                        >
                            <td
                                className='rdo-angles-lengths'
                                onMouseEnter={doHighlight}
                                onMouseLeave={doUnhighlight}
                            >
                                <ResidueName
                                    name={commonResidueName}
                                    residue={item.residue}
                                    backgroundColorSelected={props.backgroundColorSelected}
                                    events={props.events}
                                    selection={props.selection}
                                    d={props.d}
                                    vi={props.vi}
                                    key={AnglesLengthsCommon.residueIdentifyingName(props.structureName, item.residue)}
                                />
                            </td>
                            <td
                                style={{ backgroundColor: colorStyle(clr), width: '1em' }}
                                ref={cueRef}
                            >
                                <Tooltip
                                    tag=<div style={{ height: `${cueHeight}px`, width: '1em' }} />
                                    delayMsec={Constants.TooltipDelayMSec}
                                    display='block'
                                >
                                    <div
                                        onMouseLeave={doUnhighlight} // We need to do it like this because componentWillUnmount() won't fire on Tooltipped components
                                    >
                                        <PGroupSummary
                                            bins={DAnglesLengths.angleAverages(item.residue.compound, item.angle.triplet)!}
                                            caption={AnglesLengthsCommon.tripletBondName(item.angle.triplet, tripletTag(item.angle.triplet))}
                                            pGroup={item.pGroup}
                                            pGroupDatas={pGroupDatas}
                                            rangeFormatter={(v) => v.toFixed(3)}
                                            residueName={commonResidueName}
                                            suffix={'\u00B0'}
                                            value={item.angle.angle}
                                            valueFormatter={(v) => v.toFixed(3)}
                                            naval={ni}
                                            xTitle={'Angle (\u00B0)'}
                                            yTitle='Prob. (%)'
                                            yTransform={(y) => y * 100}
                                            downloadFileName={'UNIMPL'} // TODO
                                            highlighter={doHighlight}
                                            vi={props.vi}
                                        />
                                    </div>
                                </Tooltip>
                            </td>
                            <td className='rdo-angles-lengths'>{M.r2d(item.angle.angle).toFixed(2)}{'\u00B0'}</td>
                            <td className='rdo-angles-lengths'><Prosco bin={item.bin} /></td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function LengthMetricDetails(props: {
    stats: ALM.LengthStats,
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    structureName: string,
    backgroundColorSelected: Rgba,
    events: Events,
    selection: StructureSelection,
    d: Dnatcofication,
    vi: ViewerInterop,
}) {
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
        <table className='rdo-angles-lengths'>
            <tbody>
                {...props.stats.lengths.map((item) => {
                    const commonResidueName = <CommonResidueName r={item.residue} multipleModels={props.multipleModels} />;

                    const doHighlight = () => {
                        const r = item.residue;
                        const a = AnglesLengthsCommon.makeAtomSelectionPayload(r, item.length.pair[0]);
                        const b = AnglesLengthsCommon.makeAtomSelectionPayload(r, item.length.pair[1]);

                        if (a && b)
                            props.vi.api.command(ViewerApi.Commands.Highlight([a, b]));
                    };
                    const doUnhighlight = () => props.vi.api.command(ViewerApi.Commands.Unhighlight());

                    const ni = AnglesLengthsCommon.getNavalBond(props.d, item.residue, item.length.pair);
                    const clr = item.pGroup ? colorToTuple(item.pGroup.color) : props.outlierColor;
                    const pGroupDatas = props.pgrpIndices.map((idx) => DAnglesLengths.lengthPGroupData(idx, item.residue.compound, item.length.pair)!);

                    return (
                        <tr
                            className='rdo-angles-lengths'
                        >
                            <td
                                onMouseEnter={doHighlight}
                                onMouseLeave={doUnhighlight}
                            >
                                <ResidueName
                                    name={commonResidueName}
                                    residue={item.residue}
                                    backgroundColorSelected={props.backgroundColorSelected}
                                    events={props.events}
                                    selection={props.selection}
                                    d={props.d}
                                    vi={props.vi}
                                    key={AnglesLengthsCommon.residueIdentifyingName(props.structureName, item.residue)}
                                />
                            </td>
                            <td
                                style={{ backgroundColor: colorStyle(clr), width: '1em' }}
                                ref={cueRef}
                            >
                                <Tooltip
                                    tag=<div style={{ height: `${cueHeight}px`, width: '1em' }} />
                                    delayMsec={Constants.TooltipDelayMSec}
                                    display='block'
                                >
                                    <div
                                        onMouseLeave={doUnhighlight} // We need to do it like this because componentWillUnmount() won't fire on Tooltipped components
                                    >
                                        <PGroupSummary
                                            bins={DAnglesLengths.lengthAverages(item.residue.compound, item.length.pair)!}
                                            caption={AnglesLengthsCommon.pairBondName(item.length.pair, pairTag(item.length.pair))}
                                            pGroup={item.pGroup}
                                            pGroupDatas={pGroupDatas}
                                            rangeFormatter={(v) => v.toFixed(3)}
                                            residueName={commonResidueName}
                                            suffix={'\u00A0\u212B'}
                                            value={item.length.length}
                                            valueFormatter={(v) => v.toFixed(3)}
                                            naval={ni}
                                            xTitle={'Length\u00A0(\u212B)'}
                                            yTitle='Prob. (%)'
                                            yTransform={(y) => y * 100}
                                            downloadFileName={'UNIMPL'} //TODO
                                            highlighter={doHighlight}
                                            vi={props.vi}
                                        />
                                    </div>
                                </Tooltip>
                            </td>
                            <td className='rdo-angles-lengths'>{item.length.length.toFixed(3)}{'\u00A0\u212B'}</td>
                            <td className='rdo-angles-lengths'><Prosco bin={item.bin} /></td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function ResidueName(props: {
    name: React.ReactNode,
    residue: Measurements.Residue,
    backgroundColorSelected: Rgba,
    events: Events,
    selection: StructureSelection,
    d: Dnatcofication,
    vi: ViewerInterop,
}) {
    const [selected, setSelected] = React.useState(AnglesLengthsCommon.isResidueInSelection(props.residue, props.selection));
    React.useEffect(() => {
        const subs = new Array<Subscription>();
        subs.push(props.events.residueToggled.subscribe(() => {
            const isSelected = AnglesLengthsCommon.isResidueInSelection(props.residue, props.selection);
            setSelected(isSelected);
        }));
        subs.push(props.events.allResiduesDeselected.subscribe(() => setSelected(false)));

        return () => {
            subs.forEach((s) => s.unsubscribe());
        }
    }, []);

    const { r, g, b, a } = props.backgroundColorSelected;
    return (
        <div
            style={selected ? { backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`, width: '100%' } : { width: '100%' } }
            onClick={() => {
                if (selected)
                    AnglesLengthsCommon.deselectResidue(props.residue, props.selection, props.events.residueToggled, props.d, props.vi);
                else
                    AnglesLengthsCommon.selectResidue(props.residue, props.selection, props.events.residueToggled, props.d, props.vi);
            }}
        >
            {props.name}
        </div>
    );
}

type Events = {
    allResiduesDeselected: Subject<void>,
    residueToggled: AnglesLengthsCommon.ResidueToggledEvent,
}
export class AnglesLengthsByCompound extends View<View.Props> {
    /*
     * This needs to be a class component because it has its own event Subjects
     * that must not change throughout the entire lifetime of the component.
     * If they did, it would cause the events to be misdelivered.
     *
     * We could do a useMemo() instead but who has the time to keep rewriting things just
     * becuase they are more "correct".
     */
    static readonly unscrollableContainer = true;
    private readonly ek = new EventsKeeper();
    readonly events: Events = {
        allResiduesDeselected: this.ek.subject(),
        residueToggled: this.ek.subject(),
    };

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.chainSwitched, () => this.forceUpdate());

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
        this.subscribe(this.props.viewerInterop.events.structuresDeselected, () => this.events.allResiduesDeselected.next());
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const multipleModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
        const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);

        const modelNum = modelIdx === InvalidModelIndex
            ? multipleModels
                ? -1 // BEWARE: This is kind of dangerous because modelNum could theoretically be -1
                : this.props.dnatcofication.data.structures[0].models[0].num
            : this.props.dnatcofication.data.structures[0].models[modelIdx].num;

        const alm = this.props.dnatcofication.data.almByCompound;

        const selected = chain === InvalidChain
            ? alm.models.get(modelNum)!
            : alm.chains.get(modelNum)!.get(chain)!;

        const overallAngles = selected.overallAngles
        const overallLengths = selected.overallLengths;
        const countsAngles = Summarize.countsInGroups(overallAngles);
        const countsLengths = Summarize.countsInGroups(overallLengths);

        const htmlColorsForStatsBar = new Array<string>();
        for (let idx = 0; idx < DAnglesLengths.pGroupCount(); idx++)
            htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.pGroupColor(idx))));
        htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.outlierColor())));
        const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
        const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);
        const structureName = AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication);

        const mkHeader = (text: string) => {
            const Style = { display: 'flex', flexDirection: 'row', alignItems: 'center' } as StandardLonghandProperties;

            return {
                collapsed: (
                    <div className='rdo-secondary-caption rdo-active' style={Style}>
                        <div style={{ flex: 1 }}>{text}</div>
                        <Icon img='imgs/triangle-up.svg' size='text' />
                    </div>
                ),
                expanded: (
                    <div className='rdo-secondary-caption rdo-active' style={Style}>
                        <div style={{ flex: 1 }}>{text}</div>
                        <Icon img='imgs/triangle-down.svg' size='text' />
                    </div>
                )
            };
        };

        return (
            <div style={{ ...Common.VScrollGridJail, gridTemplateRows: 'auto auto auto auto 1fr' }}>
                <div className='rdo-secondary-caption'>Structure/Selection</div>
                <OverallStatsBar
                    counts={{ angles: countsAngles, lengths: countsLengths }}
                    downloadableData={DownloadableData(selected.angles, countsAngles, selected.lengths, countsLengths)}
                    downloaders={StatsDownloaders}
                    name={AnglesLengthsCommon.selectionName(this.props.dnatcofication, multipleModels, modelIdx, chain)}
                    style={{ height: '4em' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, display: 'flex' }}>
                            {AnglesLengthsCommon.renderSubstructureStats(<div style={{ ...AnglesLengthsCommon.BarCaptionStyle, left: 'var(--h2-gap)' }}>Lengths</div>, overallLengths, countsLengths, htmlColorsForStatsBar)}
                        </div>
                        <div style={{ flex: 1, display: 'flex' }}>
                            {AnglesLengthsCommon.renderSubstructureStats(<div style={{ ...AnglesLengthsCommon.BarCaptionStyle, left: 'var(--h2-gap)' }}>Angles</div>, overallAngles, countsAngles, htmlColorsForStatsBar)}
                        </div>
                    </div>
                </OverallStatsBar>

                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header={mkHeader('Lenghts by bases')}
                        style={ Common.VScrollJail }
                    >
                        <div style={{ ...Common.VScrollElement, position: 'relative' }}>
                            <div
                                className='rdo-scroll-vertically-with-scrollbar'
                                style={AnglesLengthsCommon.BlockListStyle}
                            >
                                <Bases
                                    data={selected.lengths}
                                    displayOrders={AnglesLengthsCommon.LengthsDisplayOrder}
                                    colorsForCounts={htmlColorsForStatsBar}
                                    outlierColor={outlierColor}
                                    pgrpIndices={pgrpIndices}
                                    multipleModels={multipleModels}
                                    structureName={structureName}
                                    events={this.events}
                                    d={this.props.dnatcofication}
                                    selection={this.props.structureSelection}
                                    vi={this.props.viewerInterop}
                                    dlMaker={makeLengthDownloadableData}
                                />
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>
                <div style={ Common.VScrollElement }>
                    <CollapsibleVertical
                        header={mkHeader('Angles by bases')}
                        style={ Common.VScrollJail }
                    >
                        <div style={{ ...Common.VScrollElement, position: 'relative' }}>
                            <div
                                className='rdo-scroll-vertically-with-scrollbar'
                                style={AnglesLengthsCommon.BlockListStyle}
                            >
                                <Bases
                                    data={selected.angles}
                                    displayOrders={AnglesLengthsCommon.AnglesDisplayOrder}
                                    colorsForCounts={htmlColorsForStatsBar}
                                    outlierColor={outlierColor}
                                    pgrpIndices={pgrpIndices}
                                    multipleModels={multipleModels}
                                    structureName={structureName}
                                    events={this.events}
                                    d={this.props.dnatcofication}
                                    selection={this.props.structureSelection}
                                    vi={this.props.viewerInterop}
                                    dlMaker={makeAngleDownloadableData}
                                />
                            </div>
                        </div>
                    </CollapsibleVertical>
                </div>

                <div />
            </div>
        );
    }
}
