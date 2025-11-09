import { type StandardLonghandProperties } from "csstype";
import React from "react";
import { Subject, type Subscription } from "rxjs";
import {
  AnglesLengthsCommon,
  AngstromUnit,
  DegreesUnit,
  FloatingCue,
  PGroupSummary,
  Prosco,
  ResidueName as CommonResidueName,
  WindowsTracker,
} from "./angles-lengths-common";
import { AnglesLengthsDisplayOrder } from './angles-lengths-display-order';
import { View } from "../view";
import { Common } from "../../common";
import { TriangleDownImg } from "../../../../assets/images";
import { CollapsibleVertical } from "../../../common/collapsible-vertical";
import { Window } from "../../../common/window";
import { colorStyle } from "../../../util";
import { ALM, ALMCompoundAngleLength } from "../../../../dnatco/alm";
import { AnglesLengths as DAnglesLengths } from "../../../../dnatco/angles-lengths";
import { tripletTag, Triplet } from "../../../../dnatco/angles-lengths/angles";
import { pairTag, Pair } from "../../../../dnatco/angles-lengths/lengths";
import { Measurements } from "../../../../dnatco/angles-lengths/measurements";
import { Summarize } from "../../../../dnatco/angles-lengths/summarize";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { Residues } from "../../../../dnatco/residues";
import { GlobalConfig } from "../../../../global-config";
import { objKeys, sequence } from "../../../../util";
import {
  colorToRgb,
  colorToTuple,
  hexToRgb,
  rgbToHex,
  type ColorTuple,
  Rgba,
} from "../../../../util/colors";
import { EventsKeeper } from "../../../../util/events-keeper";
import { M } from "../../../../util/math";
import {
  InvalidChain,
  InvalidModelIndex,
  AuthResidue,
  StructureSelection,
} from "../../../../util/structure-selection";
import { ViewerApi, ViewerInterop } from "../../../../viewer/viewer-interop";

type DownloadableData = {
  angles: ALM.AngleStats[];
  countsAngles: Summarize.CountsInGroup[];
  lengths: ALM.LengthStats[];
  countsLengths: Summarize.CountsInGroup[];
};
function DownloadableData(
  angles: Record<string, ALM.CompoundStats<ALM.AngleStats>>,
  countsAngles: Summarize.CountsInGroup[],
  lengths: Record<string, ALM.CompoundStats<ALM.LengthStats>>,
  countsLengths: Summarize.CountsInGroup[]
): DownloadableData {
  return {
    angles: objKeys(angles).flatMap((k) =>
      Array.from(angles[k].byMetric.values()).map((x) => x.individual)
    ),
    countsAngles,
    lengths: objKeys(lengths).flatMap((k) =>
      Array.from(lengths[k].byMetric.values()).map((x) => x.individual)
    ),
    countsLengths,
  };
}

function getSelection(
  alm: ALMCompoundAngleLength,
  modelNum: number,
  chain: string
) {
  if (alm.models.size === 0) {
    return ALM.emptyMappingByCompoundAngleLength();
  }

  return chain === InvalidChain
    ? alm.models.get(modelNum)!
    : alm.chains.get(modelNum)!.get(chain)!;
}

function makeAngleDownloadableData(
  angles: Record<string, ALM.CompoundStats<ALM.AngleStats>>,
  counts: Summarize.CountsInGroup[]
) {
  return DownloadableData(angles, counts, {}, []);
}

function makeLengthDownloadableData(
  lengths: Record<string, ALM.CompoundStats<ALM.LengthStats>>,
  counts: Summarize.CountsInGroup[]
) {
  return DownloadableData({}, [], lengths, counts);
}

function OverallStatsBar(props: {
  children: React.ReactNode;
  counts: {
    angles: Summarize.CountsInGroup[];
    lengths: Summarize.CountsInGroup[];
  };
  name: string;
  style?: StandardLonghandProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: "var(--v2-gap)",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

function Base<T extends ALM.AngleStats | ALM.LengthStats>(props: {
  base: Residues.ElementaryResidue;
  displayOrders: Record<Residues.ElementaryResidue, string[]>;
  stats: ALM.CompoundStats<T>;
  colorsForCounts: string[];
  outlierColor: ColorTuple;
  pgrpIndices: number[];
  multipleModels: boolean;
  structureName: string;
  events: Events;
  d: Dnatcofication;
  selection: StructureSelection;
  vi: ViewerInterop;
  dlMaker: (
    stats: Record<string, ALM.CompoundStats<T>>,
    counts: Summarize.CountsInGroup[]
  ) => DownloadableData;
  tainerRef: React.RefObject<HTMLDivElement>;
  winTracker: WindowsTracker;
}) {
  const metrics = [];
  for (const metricName of props.displayOrders[props.base]) {
    const metric = props.stats.byMetric.get(metricName);
    if (!metric) continue;
    metrics.push(
      <div className="flex flex-row">
        <div className="w-4" />
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
          tainerRef={props.tainerRef}
          winTracker={props.winTracker}
        />
      </div>
    );
  }

  return (
    <CollapsibleVertical
      header={AnglesLengthsCommon.makeCollapsibleHeader(
        <div className="flex h-20">
          {AnglesLengthsCommon.renderSubstructureStats(
            props.winTracker,
            props.base,
            AnglesLengthsCommon.substructureBarCaption(props.base, DAnglesLengths.pGroupColor(0)),
            props.stats.overall,
            Summarize.countsInGroups(props.stats.overall),
            props.colorsForCounts
          )}
        </div>
      )}
    >
      <div className="flex-1 overflow-hidden relative">
        <div className="rdo-scroll-vertically-with-scrollbar flex flex-col gap-[calc(0.5em/2)]">
          <div />
          {...metrics}
        </div>
      </div>
    </CollapsibleVertical>
  );
}

function Bases<T extends ALM.AngleStats | ALM.LengthStats>(props: {
  data: Record<Residues.ElementaryResidue, ALM.CompoundStats<T>>;
  displayOrders: Record<Residues.ElementaryResidue, string[]>;
  colorsForCounts: string[];
  outlierColor: ColorTuple;
  pgrpIndices: number[];
  multipleModels: boolean;
  structureName: string;
  events: Events;
  d: Dnatcofication;
  selection: StructureSelection;
  vi: ViewerInterop;
  dlMaker: (
    stats: Record<string, ALM.CompoundStats<T>>,
    counts: Summarize.CountsInGroup[]
  ) => DownloadableData;
  tainerRef: React.RefObject<HTMLDivElement>;
  winTracker: WindowsTracker;
}) {
  const items: JSX.Element[] = [];

  for (const k of objKeys(props.data)) {
    const stats = props.data[k];
    const totalItems = Array.from(stats.byMetric.values()).reduce(
      (p, metric) => {
        return metric.type === "angle"
          ? p + (metric.individual as ALM.AngleStats).angles.length
          : p + (metric.individual as ALM.LengthStats).lengths.length;
      },
      0
    );

    if (totalItems === 0) continue;

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
        tainerRef={props.tainerRef}
        winTracker={props.winTracker}
      />
    );
  }

  return <>{...items}</>;
}

function FloatingCueText(props: {
  base: string;
  metricName: React.ReactElement;
}) {
  return (
    <div>
      <span className="rdo-nice-step-base font-bold">{props.base}</span>
      {"\u00A0"}
      {props.metricName}
    </div>
  );
}

function Metric<T extends ALM.AngleStats | ALM.LengthStats>(props: {
  base: Residues.ElementaryResidue;
  stats: ALM.MetricStats<T>;
  colorsForCounts: string[];
  outlierColor: ColorTuple;
  pgrpIndices: number[];
  multipleModels: boolean;
  structureName: string;
  events: Events;
  d: Dnatcofication;
  selection: StructureSelection;
  vi: ViewerInterop;
  tainerRef: React.RefObject<HTMLDivElement>;
  winTracker: WindowsTracker;
}) {
  const collapsibleRef = React.useRef<CollapsibleVertical>(null);

  const rgb = hexToRgb(GlobalConfig.data().currentStepColor);
  const backgroundColorSelected = Rgba(rgb.r, rgb.g, rgb.b, 0.5);

  const name =
    props.stats.type === "angle"
      ? AnglesLengthsCommon.tripletBondName(
          props.stats.identifier as Triplet,
          tripletTag(props.stats.identifier as Triplet)
        )
      : AnglesLengthsCommon.pairBondName(
          props.stats.identifier as Pair,
          pairTag(props.stats.identifier as Pair)
        );

  const detailsProps = {
    base: props.base,
    metricName: name,
    multipleModels: props.multipleModels,
    outlierColor: props.outlierColor,
    pgrpIndices: props.pgrpIndices,
    structureName: props.structureName,
    backgroundColorSelected,
    events: props.events,
    d: props.d,
    selection: props.selection,
    vi: props.vi,
    tainerRef: props.tainerRef,
    collapseDetail: () => collapsibleRef?.current?.collapseExpand("collapse"),
    winTracker: props.winTracker,
  };
  const details =
    props.stats.type === "angle" ? (
      <AngleMetricDetails
        {...{
          ...detailsProps,
          stats: props.stats.individual as ALM.AngleStats,
        }}
      />
    ) : (
      <LengthMetricDetails
        {...{
          ...detailsProps,
          stats: props.stats.individual as ALM.LengthStats,
        }}
      />
    );

  return (
    <CollapsibleVertical
      style={{ width: "100%" }}
      header={AnglesLengthsCommon.makeCollapsibleHeader(
        <div className="flex flex-row gap-1 h-20">
          {AnglesLengthsCommon.renderSubstructureStats(
            props.winTracker,
            <div className="font-700">
              {props.base} {name}
            </div>,
            AnglesLengthsCommon.substructureBarCaption(name, DAnglesLengths.pGroupColor(0)),
            props.stats.overall,
            Summarize.countsInGroups(props.stats.overall),
            props.colorsForCounts
          )}
        </div>
      )}
      ref={collapsibleRef}
    >
      <div className="flex flex-row">
        <div className="w-4" />
        {details}
      </div>
    </CollapsibleVertical>
  );
}

function AngleMetricDetails(props: {
  base: Residues.ElementaryResidue;
  metricName: React.ReactElement;
  stats: ALM.AngleStats;
  multipleModels: boolean;
  outlierColor: ColorTuple;
  pgrpIndices: number[];
  structureName: string;
  backgroundColorSelected: Rgba;
  events: Events;
  d: Dnatcofication;
  selection: StructureSelection;
  vi: ViewerInterop;
  tainerRef: React.RefObject<HTMLElement>;
  collapseDetail: () => void;
  winTracker: WindowsTracker;
}) {
  // This code implements a workaround to address limitations in CSS behavior.
  const [cueHeight, setCueHeight] = React.useState(0);
  const cueRef = React.useRef<HTMLTableCellElement>(null);
  React.useLayoutEffect(() => {
    const cue = cueRef.current;
    if (cue && cueHeight === 0) setCueHeight(cue.clientHeight);
  }, []);

  const [floatingCueYOffset, setFloatingCueYOffset] = React.useState(0);
  const selfRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => {
      const self = selfRef.current;
      const tainer = props.tainerRef.current;
      if (!self || !tainer) return;

      const tainerBRect = tainer.getBoundingClientRect();
      const selfBRect = self.getBoundingClientRect();

      let off = tainerBRect.top - selfBRect.top;
      off = off > selfBRect.height - 32 ? 0 : off;

      setFloatingCueYOffset(off);
    };

    props.tainerRef.current?.addEventListener("scroll", onScroll);
    return () => {
      props.tainerRef.current?.removeEventListener("scroll", onScroll);
    };
  }, [selfRef]);

  return (
    <div className="relative w-full" ref={selfRef}>
      <FloatingCue
        yOffset={floatingCueYOffset}
        onClicked={props.collapseDetail}
      >
        <FloatingCueText base={props.base} metricName={props.metricName} />
      </FloatingCue>
      <table className="rdo-angles-lengths">
        <tbody>
          {...props.stats.angles.map((item) => {
            const commonResidueName = (
              <CommonResidueName
                r={item.residue}
                multipleModels={props.multipleModels}
              />
            );

            const doHighlight = () => {
              const r = item.residue;
              const a = AnglesLengthsCommon.makeAtomSelectionPayload(
                r,
                item.angle.triplet[0]
              );
              const b = AnglesLengthsCommon.makeAtomSelectionPayload(
                r,
                item.angle.triplet[1]
              );
              const c = AnglesLengthsCommon.makeAtomSelectionPayload(
                r,
                item.angle.triplet[2]
              );

              if (a && b && c)
                props.vi.api.command(ViewerApi.Commands.Highlight([a, b, c]));
            };
            const doUnhighlight = () =>
              props.vi.api.command(ViewerApi.Commands.Unhighlight());

            const ni = AnglesLengthsCommon.getNavalAngle(
              props.d,
              item.residue,
              item.angle.triplet
            );
            const nrank = DAnglesLengths.angleNavalRanking(item.residue.compound, item.angle);
            const nrankCls = DAnglesLengths.navalRankingClass(
              item.angle.angle,
              nrank,
              M.d2r(ni.csdPreferredLeft),
              M.d2r(ni.csdPreferredRight),
              item.pGroup
            );
            const clr = item.pGroup
              ? colorToTuple(item.pGroup.color)
              : props.outlierColor;
            const pGroupDatas = props.pgrpIndices.map(
              (idx) =>
                DAnglesLengths.anglePGroupData(
                  idx,
                  item.residue.compound,
                  item.angle.triplet
                )!
            );
            const dlName = `${AnglesLengthsCommon.residueIdentifyingName(
              props.structureName,
              item.residue
            )}_${AnglesLengthsCommon.fileNameFriendlyTag(
              tripletTag(item.angle.triplet)
            )}`;

            return (
              <tr className="rdo-angles-lengths">
                <td
                  className="rdo-angles-lengths"
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
                    key={AnglesLengthsCommon.residueIdentifyingName(
                      props.structureName,
                      item.residue
                    )}
                  />
                </td>
                <td
                  style={{ backgroundColor: colorStyle(clr), width: "1em" }}
                  ref={cueRef}
                  onClick={(evt) => {
                    const hwnd = Window.create(
                      <PGroupSummary
                        bins={
                          DAnglesLengths.angleAverages(
                            item.residue.compound,
                            item.angle.triplet
                          )!
                        }
                        pGroup={item.pGroup}
                        pGroupDatas={pGroupDatas}
                        maybeBin={item.bin}
                        rangeFormatter={(v) => v.toFixed(3)}
                        residueName={commonResidueName}
                        suffix={DegreesUnit}
                        value={item.angle.angle}
                        valueFormatter={(v) => M.r2d(v).toFixed(2)}
                        navalPrefferedLower={M.d2r(ni.csdPreferredLeft)}
                        navalPrefferedUpper={M.d2r(ni.csdPreferredRight)}
                        navalRanking={nrank}
                        navalRankingClass={nrankCls}
                        xTitle={"Angle (\u00B0)"}
                        yTitle="Prob. (%)"
                        yTransform={(y) => y * 100}
                        xTransform={(x) => M.r2d(x)}
                        downloadFileName={dlName}
                        highlighter={doHighlight}
                        vi={props.vi}
                      />,
                      AnglesLengthsCommon.pGroupWindowTitle(
                        commonResidueName,
                        AnglesLengthsCommon.tripletBondName(
                          item.angle.triplet,
                          tripletTag(item.angle.triplet)
                        ),
                        item.pGroup,
                        nrankCls,
                        `${M.r2d(item.angle.angle).toFixed(2)} ${DegreesUnit}`
                      ),
                      { x: evt.pageX, y: evt.pageY },
                      () => props.winTracker.remove(hwnd),
                      {
                        initialWidth: 450,
                        resizeableWidth: true,
                        forceResize: true,
                      }
                    );

                    props.winTracker.add(hwnd);
                  }}
                ></td>
                <td className="rdo-angles-lengths">
                  {M.r2d(item.angle.angle).toFixed(2)}
                  {"\u00B0"}
                </td>
                <td className="rdo-angles-lengths">
                  <Prosco bin={item.bin} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LengthMetricDetails(props: {
  base: Residues.ElementaryResidue;
  metricName: React.ReactElement;
  stats: ALM.LengthStats;
  outlierColor: ColorTuple;
  pgrpIndices: number[];
  multipleModels: boolean;
  structureName: string;
  backgroundColorSelected: Rgba;
  events: Events;
  selection: StructureSelection;
  d: Dnatcofication;
  vi: ViewerInterop;
  tainerRef: React.RefObject<HTMLElement>;
  collapseDetail: () => void;
  winTracker: WindowsTracker;
}) {
  // This code implements a workaround to address limitations in CSS behavior.
  const [cueHeight, setCueHeight] = React.useState(0);
  const cueRef = React.useRef<HTMLTableCellElement>(null);
  React.useLayoutEffect(() => {
    const cue = cueRef.current;
    if (cue && cueHeight === 0) setCueHeight(cue.clientHeight);
  }, []);

  const [floatingCueYOffset, setFloatingCueYOffset] = React.useState(0);
  const selfRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => {
      const self = selfRef.current;
      const tainer = props.tainerRef.current;
      if (!self || !tainer) return;

      const tainerBRect = tainer.getBoundingClientRect();
      const selfBRect = self.getBoundingClientRect();

      let off = tainerBRect.top - selfBRect.top;
      off = off > selfBRect.height - 32 ? 0 : off;

      setFloatingCueYOffset(off);
    };

    props.tainerRef.current?.addEventListener("scroll", onScroll);
    return () => {
      props.tainerRef.current?.removeEventListener("scroll", onScroll);
    };
  }, [selfRef]);

  return (
    <div className="relative w-full" ref={selfRef}>
      <FloatingCue
        yOffset={floatingCueYOffset}
        onClicked={props.collapseDetail}
      >
        <FloatingCueText base={props.base} metricName={props.metricName} />
      </FloatingCue>
      <table className="rdo-angles-lengths">
        <tbody>
          {...props.stats.lengths.map((item) => {
            const commonResidueName = (
              <CommonResidueName
                r={item.residue}
                multipleModels={props.multipleModels}
              />
            );

            const doHighlight = () => {
              const r = item.residue;
              const a = AnglesLengthsCommon.makeAtomSelectionPayload(
                r,
                item.length.pair[0]
              );
              const b = AnglesLengthsCommon.makeAtomSelectionPayload(
                r,
                item.length.pair[1]
              );

              if (a && b)
                props.vi.api.command(ViewerApi.Commands.Highlight([a, b]));
            };
            const doUnhighlight = () =>
              props.vi.api.command(ViewerApi.Commands.Unhighlight());

            const ni = AnglesLengthsCommon.getNavalBond(
              props.d,
              item.residue,
              item.length.pair
            );
            const nrank = DAnglesLengths.lengthNavalRanking(item.residue.compound, item.length);
            const nrankCls = DAnglesLengths.navalRankingClass(
              item.length.length,
              nrank,
              ni.csdPreferredLeft,
              ni.csdPreferredRight,
              item.pGroup
            );
            const clr = item.pGroup
              ? colorToTuple(item.pGroup.color)
              : props.outlierColor;
            const pGroupDatas = props.pgrpIndices.map(
              (idx) =>
                DAnglesLengths.lengthPGroupData(
                  idx,
                  item.residue.compound,
                  item.length.pair
                )!
            );
            const dlName = `${AnglesLengthsCommon.residueIdentifyingName(
              props.structureName,
              item.residue
            )}_${AnglesLengthsCommon.fileNameFriendlyTag(
              pairTag(item.length.pair)
            )}`;

            return (
              <tr className="rdo-angles-lengths">
                <td onMouseEnter={doHighlight} onMouseLeave={doUnhighlight}>
                  <ResidueName
                    name={commonResidueName}
                    residue={item.residue}
                    backgroundColorSelected={props.backgroundColorSelected}
                    events={props.events}
                    selection={props.selection}
                    d={props.d}
                    vi={props.vi}
                    key={AnglesLengthsCommon.residueIdentifyingName(
                      props.structureName,
                      item.residue
                    )}
                  />
                </td>
                <td
                  style={{ backgroundColor: colorStyle(clr), width: "1em" }}
                  ref={cueRef}
                  onClick={(evt) => {
                    const hwnd = Window.create(
                      <PGroupSummary
                        bins={
                          DAnglesLengths.lengthAverages(
                            item.residue.compound,
                            item.length.pair
                          )!
                        }
                        pGroup={item.pGroup}
                        pGroupDatas={pGroupDatas}
                        maybeBin={item.bin}
                        rangeFormatter={(v) => v.toFixed(3)}
                        residueName={commonResidueName}
                        suffix={AngstromUnit}
                        value={item.length.length}
                        valueFormatter={(v) => v.toFixed(3)}
                        navalPrefferedLower={ni.csdPreferredLeft}
                        navalPrefferedUpper={ni.csdPreferredRight}
                        navalRanking={nrank}
                        navalRankingClass={nrankCls}
                        xTitle={"Length\u00A0(\u00C5)"}
                        yTitle="Prob. (%)"
                        yTransform={(y) => y * 100}
                        downloadFileName={dlName}
                        highlighter={doHighlight}
                        vi={props.vi}
                      />,
                      AnglesLengthsCommon.pGroupWindowTitle(
                        commonResidueName,
                        AnglesLengthsCommon.pairBondName(
                          item.length.pair,
                          pairTag(item.length.pair),
                        ),
                        item.pGroup,
                        nrankCls,
                        `${item.length.length.toFixed(3)} ${AngstromUnit}`,
                      ),
                      { x: evt.pageX, y: evt.pageY },
                      () => props.winTracker.remove(hwnd),
                      {
                        initialWidth: 450,
                        resizeableWidth: true,
                        forceResize: true,
                      }
                    );

                    props.winTracker.add(hwnd);
                  }}
                ></td>
                <td className="rdo-angles-lengths">
                  {item.length.length.toFixed(3)}
                  {"\u00A0\u00C5"}
                </td>
                <td className="rdo-angles-lengths">
                  <Prosco bin={item.bin} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResidueName(props: {
  name: React.ReactNode;
  residue: Measurements.Residue;
  backgroundColorSelected: Rgba;
  events: Events;
  selection: StructureSelection;
  d: Dnatcofication;
  vi: ViewerInterop;
}) {
  const [selected, setSelected] = React.useState(
    AnglesLengthsCommon.isResidueInSelection(props.residue, props.selection)
  );
  React.useEffect(() => {
    const subs = new Array<Subscription>();
    subs.push(
      props.events.residueToggled.subscribe(() => {
        const isSelected = AnglesLengthsCommon.isResidueInSelection(
          props.residue,
          props.selection
        );
        setSelected(isSelected);
      })
    );
    subs.push(
      props.events.allResiduesDeselected.subscribe(() => setSelected(false))
    );

    return () => {
      subs.forEach((s) => s.unsubscribe());
    };
  }, []);

  const { r, g, b, a } = props.backgroundColorSelected;
  return (
    <div
      style={
        selected
          ? { backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`, width: "100%" }
          : { width: "100%" }
      }
      onClick={() => {
        if (selected)
          AnglesLengthsCommon.deselectResidue(
            props.residue,
            props.selection,
            props.events.residueToggled,
            props.d,
            props.vi
          );
        else
          AnglesLengthsCommon.selectResidue(
            props.residue,
            props.selection,
            props.events.residueToggled,
            props.d,
            props.vi
          );
      }}
    >
      {props.name}
    </div>
  );
}

type Events = {
  allResiduesDeselected: Subject<void>;
  residueToggled: AnglesLengthsCommon.ResidueToggledEvent;
};
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
  private winTracker = new WindowsTracker();

  anglesTainerRef: React.RefObject<HTMLDivElement> = React.createRef();
  lengthsTainerRef: React.RefObject<HTMLDivElement> = React.createRef();

  componentDidMount() {
    this.subscribe(this.props.switching.events.modelSwitched, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.switching.events.chainSwitched, () =>
      this.forceUpdate()
    );

    this.subscribe(this.props.viewerInterop.events.residueRequested, (sel) => {
      const authRes: AuthResidue = sel;
      const cifRes = StructureSelection.authToCifResidue(
        this.props.dnatcofication.data.structures[0],
        authRes
      );
      if (!cifRes) return;

      const mr: Measurements.Residue = {
        modelNum: cifRes.modelNum,
        chain: cifRes.chain,
        seqId: cifRes.seqId,
        altId: cifRes.altId,
        authChain: authRes.chain,
        authSeqId: authRes.seqId,
        insCode: authRes.insCode,
        compound: "A", // Irrelevant,
        bondAngles: [], // Irrelevant
        bondLengths: [], // Irrelevant
      };

      AnglesLengthsCommon.selectResidue(
        mr,
        this.props.structureSelection,
        this.events.residueToggled,
        this.props.dnatcofication,
        this.props.viewerInterop
      );
    });
    this.subscribe(this.props.viewerInterop.events.structuresDeselected, () =>
      this.events.allResiduesDeselected.next()
    );
  }

  componentWillUnmount() {
    this.winTracker.closeAll();
    this.unsubscribeAll();
  }

  render() {
    const multipleModels =
      Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
    const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);

    const modelNum =
      modelIdx === InvalidModelIndex
        ? multipleModels
          ? -1 // BEWARE: This is kind of dangerous because modelNum could theoretically be -1
          : this.props.dnatcofication.data.structures[0].models[0].num
        : this.props.dnatcofication.data.structures[0].models[modelIdx].num;

    const alm = this.props.dnatcofication.data.almByCompound;

    const selected = getSelection(alm, modelNum, chain);

    const overallAngles = selected.overallAngles;
    const overallLengths = selected.overallLengths;
    const countsAngles = Summarize.countsInGroups(overallAngles);
    const countsLengths = Summarize.countsInGroups(overallLengths);

    const htmlColorsForStatsBar = new Array<string>();
    for (let idx = 0; idx < DAnglesLengths.pGroupCount(); idx++)
      htmlColorsForStatsBar.push(
        rgbToHex(colorToRgb(DAnglesLengths.pGroupColor(idx)))
      );
    htmlColorsForStatsBar.push(
      rgbToHex(colorToRgb(DAnglesLengths.outlierColor()))
    );
    const outlierColor = colorToTuple(DAnglesLengths.outlierColor());
    const pgrpIndices = sequence(0, DAnglesLengths.pGroupCount() - 1);
    const structureName = AnglesLengthsCommon.structureIdentifyingName(
      this.props.dnatcofication
    );

    const mkHeader = (text: string) => {
      return {
        collapsed: (
          <div className="rdo-secondary-caption cursor-pointer flex flex-row items-center justify-center">
            <img
              src={TriangleDownImg}
              className="transition-transform duration-200 transform rotate-0"
            />
            <div className="flex-1">{text}</div>
          </div>
        ),
        expanded: (
          <div className="rdo-secondary-caption cursor-pointer flex flex-row items-center justify-center">
            <img
              src={TriangleDownImg}
              className="transition-transform duration-200 transform rotate-180"
            />
            <div className="flex-1">{text}</div>
          </div>
        ),
      };
    };

    return (
      <div className="overflow-hidden h-full grid [grid-template-rows:auto_auto_auto_auto_1fr]">
        <div className="rdo-secondary-caption">
          {AnglesLengthsCommon.displayedSelectionName(
            modelIdx,
            chain,
            multipleModels,
            this.props.dnatcofication
          )}
        </div>
        <OverallStatsBar
          counts={{ angles: countsAngles, lengths: countsLengths }}
          name={AnglesLengthsCommon.selectionName(
            this.props.dnatcofication,
            multipleModels,
            modelIdx,
            chain
          )}
        >
          <div className="flex flex-col h-20">
            <div className="flex flex-1">
              {AnglesLengthsCommon.renderSubstructureStats(
                this.winTracker,
                "Lengths",
                AnglesLengthsCommon.substructureBarCaption("Lengths", DAnglesLengths.pGroupColor(0)),
                overallLengths,
                countsLengths,
                htmlColorsForStatsBar
              )}
            </div>
            <div className="flex flex-1">
              {AnglesLengthsCommon.renderSubstructureStats(
                this.winTracker,
                "Angles",
                AnglesLengthsCommon.substructureBarCaption("Angles", DAnglesLengths.pGroupColor(0)),
                overallAngles,
                countsAngles,
                htmlColorsForStatsBar
              )}
            </div>
          </div>
        </OverallStatsBar>

        <div className="overflow-hidden">
          <CollapsibleVertical
            header={mkHeader("Lenghts by bases")}
            style={Common.VScrollJail}
          >
            <div className="overflow-scroll relative">
              <div
                className="flex flex-col gap-[calc(0.5em/2)]"
                ref={this.lengthsTainerRef}
              >
                <Bases
                  data={selected.lengths}
                  displayOrders={AnglesLengthsDisplayOrder.Lengths}
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
                  tainerRef={this.lengthsTainerRef}
                  winTracker={this.winTracker}
                />
              </div>
            </div>
          </CollapsibleVertical>
        </div>
        <div className="overflow-hidden">
          <CollapsibleVertical
            header={mkHeader("Angles by bases")}
            style={Common.VScrollJail}
          >
            <div className="overflow-scroll relative">
              <div
                className="flex flex-col gap-[calc(0.5em/2)]"
                ref={this.anglesTainerRef}
              >
                <Bases
                  data={selected.angles}
                  displayOrders={AnglesLengthsDisplayOrder.Angles}
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
                  tainerRef={this.anglesTainerRef}
                  winTracker={this.winTracker}
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
