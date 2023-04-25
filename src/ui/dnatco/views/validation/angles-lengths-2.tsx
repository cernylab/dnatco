import { type StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Subscription } from 'rxjs';
import { AnglesLengthsCommon, PGroupSummary, Prosco, ResidueName as CommonResidueName } from './angles-lengths-common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Common } from '../../common';
import { Constants } from '../../constants';
import { InvalidChain, InvalidModelIndex } from '../../structure-selection';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { Icon } from '../../../common/icon';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { colorStyle, colorToRgb, colorToTuple, ColorTuple, rgbToHex } from '../../../util';
import { ALM } from '../../../../dnatco/alm';
import { AnglesLengths as DAnglesLengths } from '../../../../dnatco/angles-lengths';
import { tripletTag, Triplet } from '../../../../dnatco/angles-lengths/angles';
import { pairTag, Pair } from '../../../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../../../dnatco/angles-lengths/measurements';
import { Summarize } from '../../../../dnatco/angles-lengths/summarize';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Residues } from '../../../../dnatco/residues';
import { GlobalConfig } from '../../../../global-config';
import { objKeys, sequence } from '../../../../util';
import { doDownload, Downloader, FileTypes } from '../../../../util/downloader';
import { M } from '../../../../util/math';
import { ViewerApi, ViewerInterop } from '../../../../viewer/viewer-interop';

const BarCaptionStyle = {
    ...AnglesLengthsCommon.BarCaptionStyle,
    top: '50%',
    left: 'var(--h2-gap)',
};

type StatsDownloader = Downloader<{
    counts: {
        angles: Summarize.CountsInGroup[],
        lengths: Summarize.CountsInGroup[]
    },
}>;
const StatsDownloaders = [
    {
        caption: 'CSV',
        download: function(fileNameStem, data) {
            // TODO
            //const text = Serialize.toCsv(data.counts.angles, data.counts.lengths, data.residues, data.stats);
            doDownload(fileNameStem, 'UNIMPLEMENTED', this.fileType);
        },
        fileType: FileTypes.csv,
    },
    {
        caption: 'JSON',
        download: function(fileNameStem, data) {
            // TODO
            //const text = Serialize.toJson(data.counts.angles, data.counts.lengths, data.residues, data.stats);
            doDownload(fileNameStem, 'UNIMPLEMENTED', this.fileType);
        },
        fileType: FileTypes.json,
    }
] as StatsDownloader[];

function DownloadButtons(props: {
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
    fileName: string,
    // TODO: The actual data
}) {
    const prefix = GlobalConfig.data().pathPrefix;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {props.downloaders.map((dl, idx) => (
                <div
                    key={idx}
                    className='rdo-dynamic-table-download-button'
                    style={{ flex: 1 }}
                    onClick={e => {
                        e.stopPropagation();
                        // TODO: Do the download
                }}>
                    <Icon img={`${prefix}/imgs/data-transfer-download.svg`} size='text' />
                    {dl.caption}
                </div>
            ))}
        </div>
    );
}

function OverallStatsBar(props: {
    children: React.ReactNode,
    counts: { angles: Summarize.CountsInGroup[], lengths: Summarize.CountsInGroup[] },
    downloaders: StatsDownloader[],
    name: string,
    style?: StandardLonghandProperties
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 'var(--v2-gap)', ...props.style }}>
            {props.children}
            <DownloadButtons
                counts={props.counts}
                downloaders={props.downloaders}
                fileName={`${props.name}angles_lenghts_by_angle_length`}
            />
        </div>
    );
}

function Base<T extends ALM.AngleStats | ALM.LengthStats>(props: {
    base: string,
    stats: ALM.CompoundStats<T>,
    thresholds: number[],
    colorsForCounts: string[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    d: Dnatcofication,
    vi: ViewerInterop,
}) {
    const metrics = [];
    for (const metric of props.stats.byMetric.values()) {
        metrics.push(
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ width: '1em' }} />
                <Metric
                    stats={metric}
                    thresholds={props.thresholds}
                    colorsForCounts={props.colorsForCounts}
                    outlierColor={props.outlierColor}
                    pgrpIndices={props.pgrpIndices}
                    multipleModels={props.multipleModels}
                    d={props.d}
                    vi={props.vi}
                />
            </div>
        );
    }

    return (
        <CollapsibleVertical
            header={AnglesLengthsCommon.makeCollapsibleHeader(
                <div style={{ height: '2em' }}>
                    {AnglesLengthsCommon.renderSubstructureStats(
                        <div style={BarCaptionStyle}>{props.base}</div>,
                        props.stats.overall,
                        AnglesLengthsCommon.countsInGroups(props.stats.overall, props.thresholds),
                        props.colorsForCounts
                    )}
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
    thresholds: number[],
    colorsForCounts: string[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    d: Dnatcofication,
    vi: ViewerInterop,
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
                stats={stats}
                thresholds={props.thresholds}
                colorsForCounts={props.colorsForCounts}
                outlierColor={props.outlierColor}
                pgrpIndices={props.pgrpIndices}
                multipleModels={props.multipleModels}
                d={props.d}
                vi={props.vi}
            />
        );
    }

    return <>{...items}</>;
}

function Metric<T extends ALM.AngleStats | ALM.LengthStats>(props: {
    stats: ALM.MetricStats<T>,
    thresholds: number[],
    colorsForCounts: string[],
    outlierColor: ColorTuple,
    pgrpIndices: number[],
    multipleModels: boolean,
    d: Dnatcofication,
    vi: ViewerInterop,
}) {
    const name = props.stats.type === 'angle'
        ? AnglesLengthsCommon.tripletBondName(props.stats.identifier as Triplet, tripletTag(props.stats.identifier as Triplet))
        : AnglesLengthsCommon.pairBondName(props.stats.identifier as Pair, pairTag(props.stats.identifier as Pair));

    const detailsProps = {
        multipleModels: props.multipleModels,
        outlierColor: props.outlierColor,
        pgrpIndices: props.pgrpIndices,
        d: props.d,
        vi: props.vi
    };
    const details = props.stats.type === 'angle'
        ? <AngleMetricDetails { ...{ ...detailsProps, stats: props.stats.individual as ALM.AngleStats } } />
        : <LengthMetricDetails { ...{ ...detailsProps, stats: props.stats.individual as ALM.LengthStats } } />;

    return (
        <CollapsibleVertical
            style={{ width: '100%' }}
            header={AnglesLengthsCommon.makeCollapsibleHeader(
                <div style={{ height: '2em' }}>
                    {AnglesLengthsCommon.renderSubstructureStats(
                        <div style={BarCaptionStyle}>{name}</div>,
                        props.stats.overall,
                        AnglesLengthsCommon.countsInGroups(props.stats.overall, props.thresholds),
                        props.colorsForCounts
                    )}
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
    d: Dnatcofication,
    vi: ViewerInterop
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
                {...props.stats.angles.map((item, idx) => {
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
                            key={idx}
                        >
                            <td
                                className='rdo-angles-lengths'
                                onMouseEnter={doHighlight}
                                onMouseLeave={doUnhighlight}
                            >
                                <ResidueName
                                    name={commonResidueName}
                                    residue={item.residue}
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
                {...props.stats.lengths.map((item, idx) => {
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
                            key={idx}
                        >
                            <td
                                onMouseEnter={doHighlight}
                                onMouseLeave={doUnhighlight}
                            >
                                <ResidueName
                                    name={commonResidueName}
                                    residue={item.residue}
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
}) {
    // TODO: We will have to get a lot fancier here to make residues selectable - we can borrow code from AnglesLengths for this
    return (
        <div
        >
            {props.name}
        </div>
    );
}

export function AnglesLengths2(props: View.Props) {
    const [_, trigRerender] = React.useState(0);
    const doRerender = () => trigRerender(r => r + 1);

    React.useEffect(() => {
        const subscriptions: Subscription[] = [];
        subscriptions.push(props.switching.events.modelSwitched.subscribe(doRerender));
        subscriptions.push(props.switching.events.chainSwitched.subscribe(doRerender));

        return () => {
            subscriptions.forEach((s) => s.unsubscribe());
        };
    }, []);

    const multipleModels = Dnatcofication.Structure.numberOfModels(props.dnatcofication) > 1;
    const { modelIdx, chain } = AnglesLengthsCommon.getSelection(props);

    const modelNum = modelIdx === InvalidModelIndex
        ? multipleModels
            ? -1 // BEWARE: This is kind of dangerous because modelNum could theoretically be -1
            : props.dnatcofication.data.structures[0].models[0].num
        : props.dnatcofication.data.structures[0].models[modelIdx].num;

    const alm = props.dnatcofication.data.almByCompound;

    const selected = chain === InvalidChain
        ? alm.models.get(modelNum)!
        : alm.chains.get(modelNum)!.get(chain)!;

    const overallAngles = selected.overallAngles
    const overallLengths = selected.overallLengths;
    const thresholds = DAnglesLengths.pGroupThresholds();
    const countsAngles = AnglesLengthsCommon.countsInGroups(overallAngles, thresholds);
    const countsLenghts = AnglesLengthsCommon.countsInGroups(overallLengths, thresholds);

    const htmlColorsForStatsBar = new Array<string>();
    for (let idx = 0; idx < DAnglesLengths.pGroupCount(); idx++)
        htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.pGroupColor(idx))));
    htmlColorsForStatsBar.push(rgbToHex(colorToRgb(DAnglesLengths.outlierColor())));
    const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
    const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);

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

    const residuesOuterTainerRef = React.useRef<HTMLDivElement>(null);
    const residuesTainerRef = React.useRef(null);

    return (
        <div style={{ ...Common.VScrollGridJail, gridTemplateRows: 'auto auto auto auto auto 1fr' }}>
            <NamedList sizing='min-content' rowSpacing='half'>
            {
                multipleModels
                    ? <NamedListItem name='Model'>
                            <ModelSelect
                                dnatcofication={props.dnatcofication}
                                structureSelection={props.structureSelection}
                                switching={props.switching}
                            />
                        </NamedListItem>
                    : undefined
            }
                <NamedListItem name='Chain'>
                    <ChainSelect
                        dnatcofication={props.dnatcofication}
                        structureSelection={props.structureSelection}
                        switching={props.switching}
                    />
                </NamedListItem>
            </NamedList>

            <div className='rdo-secondary-caption'>Structure/Selection</div>
            <OverallStatsBar
                counts={{ angles: countsAngles, lengths: countsLenghts }}
                downloaders={StatsDownloaders}
                name={AnglesLengthsCommon.selectionName(props.dnatcofication, multipleModels, modelIdx, chain)}
                style={{ height: '4em' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                        {AnglesLengthsCommon.renderSubstructureStats(<div style={{ ...AnglesLengthsCommon.BarCaptionStyle, left: 'var(--h2-gap)' }}>Lengths</div>, overallLengths, countsLenghts, htmlColorsForStatsBar)}
                    </div>
                    <div style={{ flex: 1 }}>
                        {AnglesLengthsCommon.renderSubstructureStats(<div style={{ ...AnglesLengthsCommon.BarCaptionStyle, left: 'var(--h2-gap)' }}>Angles</div>, overallAngles, countsAngles, htmlColorsForStatsBar)}
                    </div>
                </div>
            </OverallStatsBar>

            <div style={ Common.VScrollElement }>
                <CollapsibleVertical
                    header={mkHeader('Lenghts by bases')}
                    style={ Common.VScrollJail }
                >
                    <div
                        ref={residuesOuterTainerRef}
                        style={{ ...Common.VScrollElement, position: 'relative' }}
                    >
                        <div
                            className='rdo-scroll-vertically-with-scrollbar'
                            style={AnglesLengthsCommon.BlockListStyle}
                            ref={residuesTainerRef}
                        >
                            <Bases
                                data={selected.lengths}
                                thresholds={thresholds}
                                colorsForCounts={htmlColorsForStatsBar}
                                outlierColor={outlierColor}
                                pgrpIndices={pgrpIndices}
                                multipleModels={multipleModels}
                                d={props.dnatcofication}
                                vi={props.viewerInterop}
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
                    <div
                        ref={residuesOuterTainerRef}
                        style={{ ...Common.VScrollElement, position: 'relative' }}
                    >
                        <div
                            className='rdo-scroll-vertically-with-scrollbar'
                            style={AnglesLengthsCommon.BlockListStyle}
                            ref={residuesTainerRef}
                        >
                            <Bases
                                data={selected.angles}
                                thresholds={thresholds}
                                colorsForCounts={htmlColorsForStatsBar}
                                outlierColor={outlierColor}
                                pgrpIndices={pgrpIndices}
                                multipleModels={multipleModels}
                                d={props.dnatcofication}
                                vi={props.viewerInterop}
                            />
                        </div>
                    </div>
                </CollapsibleVertical>
            </div>

            <div />
        </div>
    );
}

export namespace AnglesLengths2 {
    export const unscrollableContainer = true;
    export const SelectionDisplayer = AnglesLengthsCommon.SelectionDisplayer;
    export const SelectionMaker = AnglesLengthsCommon.SelectionMaker;
}
