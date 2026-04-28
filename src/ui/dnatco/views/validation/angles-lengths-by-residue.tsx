import type { StandardLonghandProperties } from "csstype";
import React from "react";
import { Subject, Subscription } from "rxjs";
import {
  AnglesLengthsBar,
  AngstromUnit,
  AnglesLengthsCommon,
  ColorIsDarkThreshold,
  DegreesUnit,
  FloatingCue,
  PGroupSummary,
  Prosco,
  ResidueName,
  SubstructureSummary,
  WindowsTracker,
  measuredItemColor,
} from "./angles-lengths-common";
import { AnglesLengthsDisplayOrder } from "./angles-lengths-display-order";
import { View } from "../view";
import { SearchBox } from "../../search-box";
import { Common } from "../../common";
import { colorStyle, scrollIntoViewIfNeeded } from "../../../util";
import { CollapsibleVertical } from "../../../common/collapsible-vertical";
import { NamedList, NamedListItem } from "../../../common/named-list";
import { IconButton } from "../../../common/push-button";
import { SpinBox } from "../../../common/spin-box";
import { Tooltip } from "../../../common/tooltip";
import { Window } from "../../../common/window";
import { MagnifyingGlassImg, tooltipImg, TriangleDownImg } from "../../../../assets/images";
import { ALM } from "../../../../dnatco/alm";
import { AssemblyMapper } from "../../../../dnatco/assembly-mapper";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import {
  AnglesLengths as DAnglesLengths,
  NavalItem, NavalRankingClass, NavalRankingClasses,
  NavalRankingData,
  ProScoGroup,
  ProScoGroups,
} from "../../../../dnatco/angles-lengths";
import { tripletTag, Triplet } from "../../../../dnatco/angles-lengths/angles";
import { ByResidueHelpers } from "../../../../dnatco/angles-lengths/helpers";
import { pairTag, Pair } from "../../../../dnatco/angles-lengths/lengths";
import { Measurements } from "../../../../dnatco/angles-lengths/measurements";
import { Summarize, SummarizeNaval, SummarizeProSco } from "../../../../dnatco/angles-lengths/summarize";
import { GlobalConfig } from "../../../../global-config";
import { parseIntStrict } from "../../../../util";
import {
  colorToRgb,
  colorToTuple,
  hexToRgb,
  luminance,
  rgbToHex,
  ColorTuple,
  Rgba,
} from "../../../../util/colors";
import { EventsKeeper } from "../../../../util/events-keeper";
import { M } from "../../../../util/math";
import {
  AuthResidue,
  StructureSelection,
} from "../../../../util/structure-selection";
import { ViewerInterop, ViewerApi } from "../../../../viewer/viewer-interop";
import {RadixComboBox} from "../../../common/radix-combo-box";
import { Logger } from "../../../../log/logger";

function reverseTagTriplet(tripletTagStr: string){
        const parts = tripletTagStr.split('^');
        if (parts.length !== 3){
                throw new Error(`Invalid tripletTag format: ${tripletTagStr}`);
        }
        return [parts[2], parts[1], parts[0]].join('^');

}

function makeAngleDetails(props: ResidueDetailsProps, cellRefs: Map<string, React.RefObject<HTMLTableCellElement>>) {
    if (!props.residue || !props.residue.bondAngles) {
        return [];
    }
  const displayOrder =
    AnglesLengthsDisplayOrder.Angles[props.residue.compound];

  let elems = [];
  for (const tripletTagStr of displayOrder) {
    let idx = -1;

    for (let _idx = 0; _idx < props.residue.bondAngles.length; _idx++) {
        if (props.residue.bondAngles[_idx].tag === tripletTagStr) {
            idx = _idx;
            break;

        } else if (props.residue.bondAngles[_idx].tag === reverseTagTriplet(tripletTagStr)) {
            idx = _idx;
            break;
        }

    }
    if (idx < 0) {
        let residueName = props.residue.compound + props.residue.authSeqId;
        Logger.log(Logger.Severity.Debug, `Bad tripletTag ${tripletTagStr} in ${residueName}`);
        continue;
    }

    const x = props.residue.bondAngles[idx];
    const angleTag = tripletTag(x.triplet);
    const cellRef = React.createRef<HTMLTableCellElement>();
    cellRefs.set(angleTag, cellRef);

    elems.push(
      <tr className="rdo-angles-lengths" key={idx}>
        {renderBondAngleDetail(
          props.d,
          x,
          props.stats.angles[idx].bin,
          props.stats.angles[idx].pGroup,
          props.residue,
          props.residueName,
          props.structureName,
          props.outlierColor,
          props.vi,
          props.winTracker,
          undefined,
          cellRef
        )}
        <td className="w-full" />
      </tr>
    );
  }

  return elems;
}

function reverseTag(pairTagStr: string){
    return pairTagStr.split('^').reverse().join('^');
}

function makeLengthDetails(props: ResidueDetailsProps, cellRefs: Map<string, React.RefObject<HTMLTableCellElement>>) {
  const displayOrder =
    AnglesLengthsDisplayOrder.Lengths[props.residue.compound];

  let elems = [];
  for (const pairTagStr of displayOrder) {
    let idx = -1;

    for (let _idx = 0; _idx < props.residue.bondLengths.length; _idx++) {
        if (props.residue.bondLengths[_idx].tag === pairTagStr) {
            idx = _idx;
            break;
        } else if (props.residue.bondLengths[_idx].tag === reverseTag(pairTagStr)) {
            idx = _idx;
            break;
        }

    }

    if (idx < 0) {
        let residueName = props.residue.compound + props.residue.authSeqId;
        Logger.log(Logger.Severity.Debug, `Bad PairTag ${pairTagStr} in ${residueName}`);
        continue;
    }

    const x = props.residue.bondLengths[idx];
    const bondTag = pairTag(x.pair);
    const cellRef = React.createRef<HTMLTableCellElement>();
    cellRefs.set(bondTag, cellRef);

    elems.push(
      <tr className="rdo-angles-lengths" key={idx}>
        {renderBondLengthDetail(
          props.d,
          x,
          props.stats.lengths[idx].bin,
          props.stats.lengths[idx].pGroup,
          props.residue,
          props.residueName,
          props.structureName,
          props.outlierColor,
          props.vi,
          props.winTracker,
          undefined,
          cellRef
        )}
        <td className="w-full" />
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
  vi: ViewerInterop,
  winTracker: WindowsTracker,
  onAtomsClicked?: (r: Measurements.Residue, triplet: Triplet) => void,
  cellRef?: React.RefObject<HTMLTableCellElement>
) {
  const pgrpDatas = Object.fromEntries(
    ProScoGroups.map(grp => [grp, DAnglesLengths.anglePGroupData(grp, residue.compound, bondAngle.triplet)!])
  ) as Record<ProScoGroup, DAnglesLengths.PGroupData>;

  const dlName = `${AnglesLengthsCommon.residueIdentifyingName(
    structureName,
    residue
  )}_${AnglesLengthsCommon.fileNameFriendlyTag(tripletTag(bondAngle.triplet))}`;
  const ni = DAnglesLengths.navalAngle(d.data.naval, residue, bondAngle.triplet);
  const nrank = DAnglesLengths.angleNavalRanking(residue.compound, bondAngle);

  return (
    <BondAngleDetails
      bondAngle={bondAngle}
      downloadName={dlName}
      maybeBin={maybeBin}
      navalItem={ni}
      navalRanking={nrank}
      outlierColor={outlierColor}
      pGroup={pGroup}
      pGroupDatas={pgrpDatas}
      residue={residue}
      residueName={residueName}
      vi={vi}
      winTracker={winTracker}
      onAtomsClicked={onAtomsClicked}
      cellRef={cellRef}
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
  vi: ViewerInterop,
  winTracker: WindowsTracker,
  onAtomsClicked?: (r: Measurements.Residue, pair: Pair) => void,
  cellRef?: React.RefObject<HTMLTableCellElement>
) {
  const pgrpDatas = Object.fromEntries(
    ProScoGroups.map(x => [x, DAnglesLengths.lengthPGroupData(x, residue.compound, bondLength.pair)!])
  ) as Record<ProScoGroup, DAnglesLengths.PGroupData>;

  const dlName = `${AnglesLengthsCommon.residueIdentifyingName(
    structureName,
    residue
  )}_${AnglesLengthsCommon.fileNameFriendlyTag(pairTag(bondLength.pair))}`;
  const ni = DAnglesLengths.navalBond(d.data.naval, residue, bondLength.pair);
  const nrank = DAnglesLengths.lengthNavalRanking(residue.compound, bondLength);

  return (
    <BondLengthDetails
      bondLength={bondLength}
      downloadName={dlName}
      maybeBin={maybeBin}
      navalItem={ni}
      navalRanking={nrank}
      outlierColor={outlierColor}
      pGroup={pGroup}
      pGroupDatas={pgrpDatas}
      residue={residue}
      residueName={residueName}
      vi={vi}
      winTracker={winTracker}
      onAtomsClicked={onAtomsClicked}
      cellRef={cellRef}
    />
  );
}

function BondAngleDetails(props: {
  bondAngle: Measurements.BondAngle;
  downloadName: string;
  maybeBin: ALM.MaybeBin;
  navalItem: NavalItem;
  navalRanking: NavalRankingData;
  outlierColor: [r: number, g: number, b: number];
  pGroup: DAnglesLengths.PGroup;
  pGroupDatas: Record<ProScoGroup, DAnglesLengths.PGroupData>;
  residue: Measurements.Residue;
  residueName: JSX.Element;
  vi: ViewerInterop;
  winTracker: WindowsTracker;

  onAtomsClicked?: (r: Measurements.Residue, triplet: Triplet) => void;
  cellRef?: React.RefObject<HTMLTableCellElement>;
}) {
  const ba = props.bondAngle;
  const clr = measuredItemColor(
    props.bondAngle.angle,
    props.navalRanking,
    M.d2r(props.navalItem.csdPreferredLeft),
    M.d2r(props.navalItem.csdPreferredRight),
    props.pGroup,
    props.outlierColor,
    DAnglesLengths.angleAverages(props.residue.compound, ba.triplet)
  );

  const nrankCls = DAnglesLengths.navalRankingClass(
    ba.angle,
    props.navalRanking,
    M.d2r(props.navalItem.csdPreferredLeft),
    M.d2r(props.navalItem.csdPreferredRight),
    DAnglesLengths.angleAverages(props.residue.compound, ba.triplet)
  );
  const binIndex = ALM.maybeBinHasValue(props.maybeBin)
    ? props.maybeBin.binIndex
    : -1;

  const doHighlight = () => {
    const r = props.residue;
    const a = AnglesLengthsCommon.makeAtomSelectionPayload(
      r,
      props.bondAngle.triplet[0]
    );
    const b = AnglesLengthsCommon.makeAtomSelectionPayload(
      r,
      props.bondAngle.triplet[1]
    );
    const c = AnglesLengthsCommon.makeAtomSelectionPayload(
      r,
      props.bondAngle.triplet[2]
    );

    if (a && b && c)
      props.vi.api.command(ViewerApi.Commands.Highlight([a, b, c]));
  };
  const doUnhighlight = () =>
    props.vi.api.command(ViewerApi.Commands.Unhighlight());

  // This code implements a workaround to address limitations in CSS behavior.
  const [cueHeight, setCueHeight] = React.useState(0);
  const cueRef = React.useRef<HTMLTableCellElement>(null);
  React.useLayoutEffect(() => {
    const cue = cueRef.current;
    if (cue && cueHeight === 0) setCueHeight(cue.clientHeight);
  }, []);

  return (
    <>
      <td
        ref={props.cellRef}
        style={{ backgroundColor: colorStyle(clr) }}
        onClick={(evt) => {
          const hwnd = Window.create(
            <PGroupSummary
              bins={
                DAnglesLengths.angleAverages(
                  props.residue.compound,
                  ba.triplet
                )!
              }
              pGroup={props.pGroup}
              pGroupDatas={props.pGroupDatas}
              maybeBin={props.maybeBin}
              rangeFormatter={(v) => M.r2d(v).toFixed(2)}
              residueName={props.residueName}
              suffix={DegreesUnit}
              value={ba.angle}
              valueFormatter={(v) => M.r2d(v).toFixed(2)}
              navalPreferredLower={M.d2r(props.navalItem.csdPreferredLeft)}
              navalPreferredUpper={M.d2r(props.navalItem.csdPreferredRight)}
              navalRanking={props.navalRanking}
              navalRankingClass={nrankCls}
              nearestReferenceLower={DAnglesLengths.nearestAngleReferenceLower(binIndex, props.residue.compound, props.bondAngle.triplet)}
              nearestReferenceUpper={DAnglesLengths.nearestAngleReferenceUpper(binIndex, props.residue.compound, props.bondAngle.triplet)}
              bondOrAngleAtoms={props.bondAngle.triplet}
              xTitle={"Angle (\u00B0)"}
              yTitle="Prob. (%)"
              xTransform={(x) => M.r2d(x)}
              yTransform={(y) => y * 100}
              xUntransform={(x) => M.d2r(x)}
              downloadFileName={props.downloadName}
              highlighter={doHighlight}
              vi={props.vi}
            />,
            AnglesLengthsCommon.pGroupWindowTitle(
              props.residueName,
              AnglesLengthsCommon.tripletBondName(ba.triplet, ba.tag),
              props.pGroup,
              nrankCls,
              `${M.r2d(props.bondAngle.angle).toFixed(2)} ${DegreesUnit}`
            ),
            { x: evt.pageX, y: evt.pageY },
            () => props.winTracker.remove(hwnd),
            { initialWidth: 450, resizeableWidth: true, forceResize: true }
          );

          props.winTracker.add(hwnd);
        }}
      >
        <div className="w-4" />
      </td>
      <td
        className="rdo-angles-lengths"
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
        className="text-right rdo-angles-lengths"
      >
        {M.r2d(ba.angle).toFixed(2)}
        {"\u00B0"}
      </td>
      <td className="rdo-angles-lengths">
        <Prosco bin={props.maybeBin} />
      </td>
    </>
  );
}

function BondLengthDetails(props: {
  bondLength: Measurements.BondLength;
  downloadName: string;
  maybeBin: ALM.MaybeBin;
  navalItem: NavalItem;
  navalRanking: NavalRankingData;
  outlierColor: ColorTuple;
  pGroup: DAnglesLengths.PGroup;
  pGroupDatas: Record<ProScoGroup, DAnglesLengths.PGroupData>;
  residue: Measurements.Residue;
  residueName: JSX.Element;
  vi: ViewerInterop;
  winTracker: WindowsTracker;

  onAtomsClicked?: (r: Measurements.Residue, pair: Pair) => void;
  cellRef?: React.RefObject<HTMLTableCellElement>;
}) {
  const bl = props.bondLength;
  const clr = measuredItemColor(
    props.bondLength.length,
    props.navalRanking,
    props.navalItem.csdPreferredLeft,
    props.navalItem.csdPreferredRight,
    props.pGroup,
    props.outlierColor,
    DAnglesLengths.lengthAverages(props.residue.compound, props.bondLength.pair)
  );
  const nrankCls = DAnglesLengths.navalRankingClass(
    bl.length,
    props.navalRanking,
    props.navalItem.csdPreferredLeft,
    props.navalItem.csdPreferredRight,
    DAnglesLengths.lengthAverages(props.residue.compound, props.bondLength.pair)
  );
  const binIndex = ALM.maybeBinHasValue(props.maybeBin)
    ? props.maybeBin.binIndex
    : -1;

  const doHighlight = () => {
    const r = props.residue;
    const a = AnglesLengthsCommon.makeAtomSelectionPayload(
      r,
      props.bondLength.pair[0]
    );
    const b = AnglesLengthsCommon.makeAtomSelectionPayload(
      r,
      props.bondLength.pair[1]
    );

    if (a && b) props.vi.api.command(ViewerApi.Commands.Highlight([a, b]));
  };
  const doUnhighlight = () =>
    props.vi.api.command(ViewerApi.Commands.Unhighlight());

  // This code implements a workaround to address limitations in CSS behavior.
  const [cueHeight, setCueHeight] = React.useState(0);
  const cueRef = React.useRef<HTMLTableCellElement>(null);
  React.useLayoutEffect(() => {
    const cue = cueRef.current;
    if (cue && cueHeight === 0) setCueHeight(cue.clientHeight);
  }, []);

  return (
    <>
      <td
        style={{ backgroundColor: colorStyle(clr) }}
        ref={(el) => {
          // Assign to both refs
          (cueRef as React.MutableRefObject<HTMLTableCellElement | null>).current = el;
          if (props.cellRef) {
            (props.cellRef as React.MutableRefObject<HTMLTableCellElement | null>).current = el;
          }
        }}
        onClick={(evt) => {
          const hwnd = Window.create(
            <PGroupSummary
              bins={
                DAnglesLengths.lengthAverages(props.residue.compound, bl.pair)!
              }
              pGroup={props.pGroup}
              pGroupDatas={props.pGroupDatas}
              maybeBin={props.maybeBin}
              rangeFormatter={(v) => v.toFixed(3)}
              residueName={props.residueName}
              suffix={AngstromUnit}
              value={bl.length}
              valueFormatter={(v) => v.toFixed(3)}
              navalPreferredLower={props.navalItem.csdPreferredLeft}
              navalPreferredUpper={props.navalItem.csdPreferredRight}
              navalRanking={props.navalRanking}
              navalRankingClass={nrankCls}
              nearestReferenceLower={DAnglesLengths.nearestLengthReferenceLower(binIndex, props.residue.compound, props.bondLength.pair)}
              nearestReferenceUpper={DAnglesLengths.nearestLengthReferenceUpper(binIndex, props.residue.compound, props.bondLength.pair)}
              bondOrAngleAtoms={props.bondLength.pair}
              xTitle={"Length (\u00C5)"}
              yTitle="Prob. (%)"
              yTransform={(y) => y * 100}
              downloadFileName={props.downloadName}
              highlighter={doHighlight}
              vi={props.vi}
            />,
            AnglesLengthsCommon.pGroupWindowTitle(
              props.residueName,
              AnglesLengthsCommon.pairBondName(
                props.bondLength.pair,
                props.bondLength.tag
              ),
              props.pGroup,
              DAnglesLengths.navalRankingClass(
                bl.length,
                props.navalRanking,
                props.navalItem.csdPreferredLeft,
                props.navalItem.csdPreferredRight,
                DAnglesLengths.lengthAverages(props.residue.compound, props.bondLength.pair)
              ),
              `${props.bondLength.length.toFixed(3)} ${AngstromUnit}`
            ),
            { x: evt.pageX, y: evt.pageY },
            () => props.winTracker.remove(hwnd),
            { initialWidth: 450, resizeableWidth: true, forceResize: true }
          );

          props.winTracker.add(hwnd);
        }}
      >
        <div className="w-4" />
      </td>
      <td
        className="rdo-angles-lengths"
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
        className="text-right rdo-angles-lengths"
        onMouseEnter={doHighlight}
        onMouseLeave={doUnhighlight}
      >
        {bl.length.toFixed(3)}
        {"\u00A0\u00C5"}
      </td>
      <td className="rdo-angles-lengths">
        <Prosco bin={props.maybeBin} />
      </td>
    </>
  );
}

export function OverallStatsBar(props: {
  children: React.ReactNode;
  name: string;
  residues: Measurements.Residue[];
  stats: ALM.ResidueStats[];
  style?: StandardLonghandProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: "calc(var(--v-gap) / 2)",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

interface ResidueElemProps {
  tainer: React.RefObject<HTMLDivElement>;
  d: Dnatcofication;
  colorsForStatsBar: string[];
  counts: {
    kind: 'naval',
    angles: SummarizeNaval.CountsInGroup[];
    lengths: SummarizeNaval.CountsInGroup[];
  } | {
    kind: 'prosco',
    angles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>;
    lengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>;
  },
  outlierColor: ColorTuple;
  residue: Measurements.Residue;
  residueName: JSX.Element;
  residueIdentifyingName: string;
  stats: ALM.ResidueStats;
  structureName: string;
  vi: ViewerInterop;
  winTracker: WindowsTracker;
  autoOpenBond?: string; // Format: atom1_atom2
  autoOpenAngle?: string; // Format: atom1_atom2_atom3
}
interface ResidueDetailsProps extends ResidueElemProps {
  onHideRequested: () => void;
}

class ResidueDetails extends React.Component<
  ResidueDetailsProps,
  { floatingCueYOffset: number }
> {
  private selfRef = React.createRef<HTMLDivElement>();
  private bondCellRefs = new Map<string, React.RefObject<HTMLTableCellElement>>();
  private angleCellRefs = new Map<string, React.RefObject<HTMLTableCellElement>>();

  constructor(props: ResidueDetailsProps) {
    super(props);

    this.state = {
      floatingCueYOffset: -1,
    };
  }

  onScroll = () => {
    const self = this.selfRef.current;
    const tainer = this.props.tainer.current;
    if (!self || !tainer) return;

    const tainerBRect = tainer.getBoundingClientRect();
    const selfBRect = self.getBoundingClientRect();

    let off = tainerBRect.top - selfBRect.top;
    off = off > selfBRect.height ? 0 : off;

    this.setState({ ...this.state, floatingCueYOffset: off });
  };

  componentDidMount() {
    this.props.tainer.current?.addEventListener("scroll", this.onScroll);

    // Auto-open bond window if specified
    if (this.props.autoOpenBond) {
      // Convert underscore separator to caret (pairTag() uses ^, URL uses _)
      const bondKey = this.props.autoOpenBond.replace(/_/g, '^');
      let cellRef = this.bondCellRefs.get(bondKey);

      // If not found, try reversed order (A_B vs B_A)
      if (!cellRef) {
        const atoms = bondKey.split('^');
        if (atoms.length === 2) {
          const reversedKey = `${atoms[1]}^${atoms[0]}`;
          cellRef = this.bondCellRefs.get(reversedKey);
        }
      }

      if (cellRef?.current) {
        // Capture the cell element before requestAnimationFrame to avoid closure issues
        const cell = cellRef.current;

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          // Get the bounding rect to calculate proper page coordinates
          const rect = cell.getBoundingClientRect();
          const pageX = rect.left + rect.width / 2;
          const pageY = rect.top + rect.height / 2;

          // Create and dispatch a synthetic mouse event with proper coordinates
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: pageX,
            clientY: pageY,
          });

          // Set pageX and pageY (they're readonly on MouseEvent, but we can create a custom object)
          Object.defineProperty(clickEvent, 'pageX', { value: pageX });
          Object.defineProperty(clickEvent, 'pageY', { value: pageY });

          cell.dispatchEvent(clickEvent);
        });
      }
    }

    // Auto-open angle window if specified
    if (this.props.autoOpenAngle) {
      // Convert underscore separator to caret (tripletTag() uses ^, URL uses _)
      const angleKey = this.props.autoOpenAngle.replace(/_/g, '^');
      let cellRef = this.angleCellRefs.get(angleKey);

      // If not found, try reversed order (A_B_C vs C_B_A)
      if (!cellRef) {
        const atoms = angleKey.split('^');
        if (atoms.length === 3) {
          const reversedKey = `${atoms[2]}^${atoms[1]}^${atoms[0]}`;
          cellRef = this.angleCellRefs.get(reversedKey);
        }
      }

      if (cellRef?.current) {
        // Capture the cell element before requestAnimationFrame to avoid closure issues
        const cell = cellRef.current;

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          // Get the bounding rect to calculate proper page coordinates
          const rect = cell.getBoundingClientRect();
          const pageX = rect.left + rect.width / 2;
          const pageY = rect.top + rect.height / 2;

          // Create and dispatch a synthetic mouse event with proper coordinates
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: pageX,
            clientY: pageY,
          });

          // Set pageX and pageY (they're readonly on MouseEvent, but we can create a custom object)
          Object.defineProperty(clickEvent, 'pageX', { value: pageX });
          Object.defineProperty(clickEvent, 'pageY', { value: pageY });

          cell.dispatchEvent(clickEvent);
        });
      }
    }
  }

  componentWillUnmount() {
    this.props.tainer.current?.removeEventListener("scroll", this.onScroll);
  }

  render() {
    return (
      <div className="relative" ref={this.selfRef}>
        <FloatingCue
          yOffset={this.state.floatingCueYOffset}
          onClicked={this.props.onHideRequested}
        >
          {this.props.residueName}
        </FloatingCue>

        <div className="flex flex-row gap-4">
          {/* Left side - Bond lengths (50%) */}
          <table className="rdo-angles-lengths" style={{ width: '50%' }}>
            <tbody>
              <tr>
                <td colSpan={5} className="font-700 text-center">
                  Bond lengths
                </td>
              </tr>
              {makeLengthDetails(this.props, this.bondCellRefs)}
            </tbody>
          </table>

          {/* Right side - Bond angles (50%) */}
          <table className="rdo-angles-lengths" style={{ width: '50%' }}>
            <tbody>
              <tr>
                <td colSpan={5} className="font-700 text-center">
                  Bond angles
                </td>
              </tr>
              {makeAngleDetails(this.props, this.angleCellRefs)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

function ResidueHeader(props: {
  caption: string | JSX.Element;
  residue: Measurements.Residue;
  residueIdentifyingName: string;
  stats: ALM.ResidueStats;
  structureName: string;
  summary: Summarize.Summary;
  counts: {
    kind: 'naval',
    angles: SummarizeNaval.CountsInGroup[];
    lengths: SummarizeNaval.CountsInGroup[];
  } | {
    kind: 'prosco',
    angles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>;
    lengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>;
  };
  colorsForStatsBar: string[];
  winTracker: WindowsTracker;
}) {
  const tainerRef = React.useRef<HTMLDivElement>(null);
  const r = props.residue;

  const lastLengthsColor = React.useMemo(() => {
    switch (props.counts.kind) {
      case 'naval': {
        let idx = props.counts.lengths.length - 1;
        for (; idx > 0; idx--) {
          if (props.counts.lengths[idx].exclusive > 0) break;
        }
        const cls = DAnglesLengths.IndexToNavalRankingClass[idx as 0 | 1 | 2];
        return DAnglesLengths.navalRankingClassColor(cls);
      }
      case 'prosco': {
        let grp = 'outlier' as ProScoGroup | 'outlier';
        for (const _grp of [...ProScoGroups, 'outlier'] as const) {
          if (props.counts.lengths[_grp].exclusive > 0) {
             grp = _grp;
             break;
          }
        }
        return DAnglesLengths.pGroupColor(grp);
      }
    }
  }, [props.counts]);
  const lastAnglesColor = React.useMemo(() => {
    switch (props.counts.kind) {
      case 'naval': {
        let idx = props.counts.angles.length - 1;
        for (; idx > 0; idx--) {
          if (props.counts.angles[idx].exclusive > 0) break;
        }
        const cls = DAnglesLengths.IndexToNavalRankingClass[idx as 0 | 1 | 2];
        return DAnglesLengths.navalRankingClassColor(cls);
      }
      case 'prosco': {
        let grp = 'outlier' as ProScoGroup | 'outlier';
        for (const _grp of [...ProScoGroups, 'outlier'] as const) {
          if (props.counts.angles[_grp].exclusive > 0) {
             grp = _grp;
             break;
          }
        }
        return DAnglesLengths.pGroupColor(grp);
      }
    }
  }, [props.counts]);

  // Reverse left side (lengths) so red is on the outside
  const reversedLengthsCounts = {
    exclusive: [...props.summary.lengths.exclusive].reverse(),
    cumulative: [...props.summary.lengths.cumulative].reverse()
  };
  const reversedLengthsColors = [...props.colorsForStatsBar].reverse();

  return (
    <div
      className="relative w-full h-full"
      ref={tainerRef}
      id={props.residueIdentifyingName}
    >
      <OverallStatsBar
        name={AnglesLengthsCommon.residueIdentifyingName(
          props.structureName,
          r
        )}
        residues={[props.residue]}
        stats={[props.stats]}
      >
        <div className="flex flex-row h-10 items-center relative" style={{ width: '100%' }}>
          {/* Left side - Lengths (50%, reversed so red is on outside) */}
          <div className="h-full relative" style={{ width: '50%', display: 'flex' }}>
            <div className="w-full h-full flex flex-row-reverse">
              <AnglesLengthsBar
                counts={reversedLengthsCounts}
                colors={reversedLengthsColors}
              />
            </div>
            <div
              className="absolute z-20 flex flex-row items-center gap-1 p-1 cursor-pointer"
              style={{
                color: luminance(lastLengthsColor) < ColorIsDarkThreshold ? 'white' : 'black',
                fontWeight: 'bold',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '50%',
                marginTop: '-0.75rem'
              }}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const hwnd = Window.create(
                  <SubstructureSummary
                    countsInGroups={
                      props.counts.kind === 'naval'
                        ? { kind: 'naval', counts: props.counts.lengths }
                        : { kind: 'prosco', counts: props.counts.lengths }
                    }
                  />,
                  props.caption,
                  { x: ev.pageX, y: ev.pageY },
                  (hwnd) => props.winTracker.remove(hwnd)
                );
                props.winTracker.add(hwnd);
              }}
            >
              <div>L</div>
              <Tooltip
                tag={
                  <div className="cursor-pointer">
                    <img className="w-4" src={tooltipImg} />
                  </div>
                }
                delayMsec={300}
              >
                Click to see details
              </Tooltip>
            </div>
          </div>

          {/* Right side - Angles (50%, normal order so red is on outside) */}
          <div className="h-full items-center relative" style={{ width: '50%', display: 'flex' }}>
            <div className="w-full h-full flex">
              <AnglesLengthsBar
                counts={props.summary.angles}
                colors={props.colorsForStatsBar}
              />
            </div>
            <div
              className="absolute z-20 flex flex-row items-center gap-1 p-1 cursor-pointer"
              style={{
                color: luminance(lastAnglesColor) < ColorIsDarkThreshold ? 'white' : 'black',
                fontWeight: 'bold',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '50%',
                marginTop: '-0.75rem'
              }}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const hwnd = Window.create(
                  <SubstructureSummary
                    countsInGroups={
                      props.counts.kind === 'naval'
                        ? { kind: 'naval', counts: props.counts.angles }
                        : { kind: 'prosco', counts: props.counts.angles }
                    }
                  />,
                  props.caption,
                  { x: ev.pageX, y: ev.pageY },
                  (hwnd) => props.winTracker.remove(hwnd)
                );
                props.winTracker.add(hwnd);
              }}
            >
              <Tooltip
                tag={
                  <div className="cursor-pointer">
                    <img className="w-4" src={tooltipImg} />
                  </div>
                }
                delayMsec={300}
              >
                Click to see details
              </Tooltip>
              <div>A</div>
            </div>
          </div>

          {/* Center text spanning both regions */}
          <div
            className="absolute z-30 flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontWeight: 'bold',
              color: 'black'
            }}
          >
            {props.caption}
          </div>
        </div>
      </OverallStatsBar>
    </div>
  );
}

class Residue extends React.Component<
  ResidueElemProps & {
    structureSelection: StructureSelection;
    viewerInterop: ViewerInterop;
    scrollMyselfIntoView: () => void;
    events: Events;
    winTracker: WindowsTracker;
    onExpand: (id: string) => void;
    onCollapse: (id: string) => void;
  }
> {
  private collapserRef = React.createRef<CollapsibleVertical>();

  collapseExpand = (change: "collapse" | "expand") => {
    this.collapserRef.current?.collapseExpand(change);
  };

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
            summary={
              this.props.counts.kind === 'naval'
              ? this.props.stats.summaryNaval
                : this.props.stats.summaryProSco
            }
            structureName={this.props.structureName}
            counts={this.props.counts}
            colorsForStatsBar={this.props.colorsForStatsBar}
            winTracker={this.props.winTracker}
          />
        )}
        onCollapsedExpanded={(change) => {
          const isSelected = AnglesLengthsCommon.isResidueInSelection(
            this.props.residue,
            this.props.structureSelection
          );
          const id = this.props.residueIdentifyingName;
          if (change === "expanded") {
            // First collapse the previously expanded row (single selection mode)
            this.props.onExpand(id);

            // Check if we need to switch assemblies
            const mapping = this.props.d.data.assemblyMapping;
            if (mapping) {
              const targetAssemblyId = AssemblyMapper.getAssemblyForChain(mapping, this.props.residue.authChain);
              if (targetAssemblyId) {
                const currentAssemblies = this.props.vi.api.query('active-assemblies');
                if (currentAssemblies && !currentAssemblies.includes(targetAssemblyId)) {
                  // Switch to the assembly containing this residue
                  this.props.vi.api.command(
                    ViewerApi.Commands.SwitchAssemblies([targetAssemblyId])
                  );
                }
              }
            }

            if (!isSelected) {
              AnglesLengthsCommon.selectResidue(
                this.props.residue,
                this.props.structureSelection,
                this.props.events.residueToggled,
                this.props.d,
                this.props.vi
              );
            }
          } else if (change === "collapsed") {
            this.props.onCollapse(id);
            if (isSelected) {
              AnglesLengthsCommon.deselectResidue(
                this.props.residue,
                this.props.structureSelection,
                this.props.events.residueToggled,
                this.props.d,
                this.props.vi
              );
            }
          }
        }}
        initiallyExpanded={AnglesLengthsCommon.isResidueInSelection(
          this.props.residue,
          this.props.structureSelection
        )}
      >
        <ResidueDetails
          onHideRequested={() =>
            this.collapserRef.current?.collapseExpand("collapse")
          }
          {...this.props}
        />
      </CollapsibleVertical>
    );
  }
}

function WorstValueResidueName(props: {
  name: React.ReactNode;
  residue: Measurements.Residue;
  selection: StructureSelection;
  backgroundColorSelected: Rgba;
  d: Dnatcofication;
  vi: ViewerInterop;
  events: Events;
}) {
  const doHighlight = () => {
    const r = props.residue;
    const sel = ViewerApi.Payloads.ResidueSelection(
      r.modelNum,
      r.authChain,
      r.chain,
      r.authSeqId,
      r.insCode,
      r.altId,
      0
    );

    props.vi.api.command(ViewerApi.Commands.Highlight([sel]));
  };
  const doUnhighlight = () =>
    props.vi.api.command(ViewerApi.Commands.Unhighlight());

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
      props.events.allResiduesDeselected.subscribe(() => {
        setSelected(false);
      })
    );

    return () => {
      subs.forEach((s) => s.unsubscribe());
    };
  }, []);

  const { r, g, b, a } = props.backgroundColorSelected;
  return (
    <div
      style={
        selected ? { backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})` } : {}
      }
      onClick={() => {
        const isSelected = AnglesLengthsCommon.isResidueInSelection(
          props.residue,
          props.selection
        );
        if (!isSelected) {
          AnglesLengthsCommon.selectResidue(
            props.residue,
            props.selection,
            props.events.residueToggled,
            props.d,
            props.vi
          );
        } else {
          AnglesLengthsCommon.deselectResidue(
            props.residue,
            props.selection,
            props.events.residueToggled,
            props.d,
            props.vi
          );
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
  allResiduesDeselected: Subject<void>;
  residueToggled: AnglesLengthsCommon.ResidueToggledEvent;
};
const DefaultShownResiduesLimit = 100;
const ShownResiduesIncrement = 100;
const LoadNextElemId = "rdo-angles-lenghts-load-next-elem";
export class AnglesLengthsByResidue extends View<
  View.Props,
  {
    maxWorstAngles: number;
    worstAnglesThreshold: string;
    maxWorstLengths: number;
    worstLengthsThreshold: string;
    shownResiduesLimit: number;
    autoOpenBond?: { residue: Measurements.Residue; bondSpec: string };
    autoOpenAngle?: { residue: Measurements.Residue; angleSpec: string };
    currentExpandedId?: string;
  }
> {
  static readonly unscrollableContainer = true;
  private residuesTainerRef = React.createRef<HTMLDivElement>();
  private residuesSectionCollapserRef = React.createRef<CollapsibleVertical>();
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
      const toks = prompt.split(" ").slice(0, 2);
      const authSeqId = parseIntStrict(toks.length === 2 ? toks[1] : toks[0]);
      const authChain = toks.length === 2 ? toks[0] : void 0;

      if (isNaN(authSeqId)) return [];

      const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);
      const alm = this.props.dnatcofication.data.almByResidue;

      const selectedIndices = ByResidueHelpers.selectionToIndices(
        this.props.dnatcofication,
        modelIdx,
        chain
      );
      const selectedResidues = selectedIndices.map((x) => alm.residues[x]);

      const results = [];
      for (const r of selectedResidues) {
        if (r.authSeqId === authSeqId) {
          if (authChain) {
            if (authChain === r.authChain) results.push(r);
          } else results.push(r);
        }
      }

      return results;
    },
  };

  private readonly SearchBoxProps = {
    anchor: "top-left" as SearchBox.Props<Measurements.Residue>["anchor"],
    xOffset: 32,
    yOffset: 32,
    caption: "Enter chain and residue no.\n(e.g. '2109' or 'B 2109')",
    onClose: () => (this.searchBoxOpen = false),
  };

  constructor(props: View.Props) {
    super(props);

    const thr = GlobalConfig.data().anglesLengths.summaryMetrics === "naval"
      ? "of-concern"
      : "outlier";

    this.state = {
      maxWorstAngles: GlobalConfig.data().anglesLengths.maxWorst,
      worstAnglesThreshold: thr,
      maxWorstLengths: GlobalConfig.data().anglesLengths.maxWorst,
      worstLengthsThreshold: thr,
      shownResiduesLimit: 100,
      currentExpandedId: undefined,
    };
  }

  private collapsePreviousRow = (nextId: string) => {
    const { currentExpandedId } = this.state;
    if (currentExpandedId && currentExpandedId !== nextId) {
      const previousBlock = this.residueBlocksMapping.get(currentExpandedId);
      previousBlock?.current?.collapseExpand("collapse");
    }
    if (currentExpandedId !== nextId) {
      this.setState({ currentExpandedId: nextId });
    }
  };

  private handleRowCollapsed = (id: string) => {
    if (this.state.currentExpandedId === id) {
      this.setState({ currentExpandedId: undefined });
    }
  };

  private renderSelection(
    tainer: React.RefObject<HTMLDivElement>,
    indices: number[],
    multipleModels: boolean,
    colorsForStatsBar: string[],
    maxResidues: number,
    loadNext: () => void,
    winTracker: WindowsTracker
  ): { elems: JSX.Element[]; mapping: Map<string, React.RefObject<Residue>> } {
    const r = this.props.dnatcofication.data.almByResidue.residues;
    const s = this.props.dnatcofication.data.almByResidue.stats;
    const outlierColor = colorToTuple(DAnglesLengths.outlierColor());

    const metrics = GlobalConfig.data().anglesLengths.summaryMetrics;

    const mapping = new Map<string, React.RefObject<Residue>>();
    const elems = new Array<JSX.Element>();
    let adx = 0;
    for (; adx < indices.length && adx < maxResidues; adx++) {
      const idx = indices[adx];

      const _r = r[idx];
      const _s = s[idx];
      const residueName = (
        <ResidueName r={_r} multipleModels={multipleModels} />
      );
      const structureName = AnglesLengthsCommon.structureIdentifyingName(
        this.props.dnatcofication
      );
      const identResName = AnglesLengthsCommon.residueIdentifyingName(
        structureName,
        _r
      );
      const ref = React.createRef<Residue>();

      // Check if this residue should auto-open a bond or angle window
      const shouldAutoOpenBond = this.state.autoOpenBond &&
        this.state.autoOpenBond.residue.modelNum === _r.modelNum &&
        this.state.autoOpenBond.residue.authChain === _r.authChain &&
        this.state.autoOpenBond.residue.authSeqId === _r.authSeqId &&
        this.state.autoOpenBond.residue.insCode === _r.insCode &&
        this.state.autoOpenBond.residue.altId === _r.altId;

      const shouldAutoOpenAngle = this.state.autoOpenAngle &&
        this.state.autoOpenAngle.residue.modelNum === _r.modelNum &&
        this.state.autoOpenAngle.residue.authChain === _r.authChain &&
        this.state.autoOpenAngle.residue.authSeqId === _r.authSeqId &&
        this.state.autoOpenAngle.residue.insCode === _r.insCode &&
        this.state.autoOpenAngle.residue.altId === _r.altId;

      const elem = (
        <Residue
          ref={ref}
          tainer={tainer}
          d={this.props.dnatcofication}
          counts={
            metrics === 'naval'
              ? {
                kind: 'naval',
                angles: SummarizeNaval.countsInGroups(_s.summaryNaval.angles),
                lengths: SummarizeNaval.countsInGroups(_s.summaryNaval.lengths),
              }
              : {
                kind: 'prosco',
                angles: SummarizeProSco.countsInGroups(_s.summaryProSco.angles),
                lengths: SummarizeProSco.countsInGroups(_s.summaryProSco.lengths),
              }
          }
          outlierColor={outlierColor}
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
          onExpand={(id) => this.collapsePreviousRow(id)}
          onCollapse={(id) => this.handleRowCollapsed(id)}
          autoOpenBond={shouldAutoOpenBond ? this.state.autoOpenBond!.bondSpec : undefined}
          autoOpenAngle={shouldAutoOpenAngle ? this.state.autoOpenAngle!.angleSpec : undefined}
          key={idx}
        />
      );

      elems.push(elem);
      mapping.set(identResName, ref);
    }

    if (adx === maxResidues)
      elems.push(
        <div key={-1} id={LoadNextElemId} onClick={loadNext}>{`(... ${
          indices.length - maxResidues
        } more residues)`}</div>
      );

    return { elems, mapping };
  }

  private renderWorstAngles(
    residues: Measurements.Residue[],
    stats: ALM.ResidueStats[],
    metrics: "prosco" | "naval",
    maxCount: number,
    threshold: string,
    structureName: string,
    multipleModels: boolean,
    winTracker: WindowsTracker
  ) {
    const worst = ByResidueHelpers.gatherWorst(
      this.props.dnatcofication.data.naval,
      metrics,
      "angles",
      residues,
      stats,
      threshold,
      maxCount
    );
    const outlierColor = colorToTuple(DAnglesLengths.outlierColor());

    const rgb = hexToRgb(GlobalConfig.data().currentStepColor);
    const backgroundColorSelected = Rgba(rgb.r, rgb.g, rgb.b, 0.5);

    return (
      <table className="rdo-angles-lengths">
        <tbody>
          {...worst.map((x, idx) => {
            const residueName = (
              <ResidueName r={x.residue} multipleModels={multipleModels} />
            );
            const onAtomsClicked = (r: Measurements.Residue) => {
              const isSelected = AnglesLengthsCommon.isResidueInSelection(
                x.residue,
                this.props.structureSelection
              );
              if (!isSelected) {
                AnglesLengthsCommon.selectResidue(
                  x.residue,
                  this.props.structureSelection,
                  this.events.residueToggled,
                  this.props.dnatcofication,
                  this.props.viewerInterop
                );
              } else {
                AnglesLengthsCommon.deselectResidue(
                  x.residue,
                  this.props.structureSelection,
                  this.events.residueToggled,
                  this.props.dnatcofication,
                  this.props.viewerInterop
                );
              }
            };

            return (
              <tr className="rdo-angles-lengths" key={idx}>
                <td className="rdo-angles-lengths">
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

  private renderWorstLengths(
    residues: Measurements.Residue[],
    stats: ALM.ResidueStats[],
    metrics: "prosco" | "naval",
    maxCount: number,
    threshold: string,
    structureName: string,
    multipleModels: boolean,
    winTracker: WindowsTracker
  ) {
    const worst = ByResidueHelpers.gatherWorst(
      this.props.dnatcofication.data.naval,
      metrics,
      "lengths",
      residues,
      stats,
      threshold,
      maxCount
    );
    const outlierColor = colorToTuple(DAnglesLengths.outlierColor());

    const rgb = hexToRgb(GlobalConfig.data().currentStepColor);
    const backgroundColorSelected = Rgba(rgb.r, rgb.g, rgb.b, 0.5);

    return (
      <table className="rdo-angles-lengths">
        <tbody>
          {...worst.map((x, idx) => {
            const residueName = (
              <ResidueName r={x.residue} multipleModels={multipleModels} />
            );
            const onAtomsClicked = (r: Measurements.Residue) => {
              const isSelected = AnglesLengthsCommon.isResidueInSelection(
                x.residue,
                this.props.structureSelection
              );
              if (!isSelected) {
                AnglesLengthsCommon.selectResidue(
                  x.residue,
                  this.props.structureSelection,
                  this.events.residueToggled,
                  this.props.dnatcofication,
                  this.props.viewerInterop
                );
              } else {
                AnglesLengthsCommon.deselectResidue(
                  x.residue,
                  this.props.structureSelection,
                  this.events.residueToggled,
                  this.props.dnatcofication,
                  this.props.viewerInterop
                );
              }
            };

            return (
              <tr className="rdo-angles-lengths" key={idx}>
                <td className="rdo-angles-lengths">
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

  private scrollResidueIntoView(
    residueIdentifyingName: string,
    doAfterScroll?: (block: React.RefObject<Residue>) => void
  ) {
    const block = this.residueBlocksMapping.get(residueIdentifyingName);

    if (!block) {
      const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);
      const numSelected = ByResidueHelpers.selectionToIndices(
        this.props.dnatcofication,
        modelIdx,
        chain
      ).length;

      if (this.state.shownResiduesLimit < numSelected)
        this.increaseShownResiduesLimit(
          numSelected - this.state.shownResiduesLimit + 1
        );

      setTimeout(() => {
        const block = this.residueBlocksMapping.get(residueIdentifyingName);
        if (block) {
          if (doAfterScroll) doAfterScroll(block);
          this.gotoResidue(residueIdentifyingName, block);
        }
      }, 50);
    } else {
      if (doAfterScroll) doAfterScroll(block);
      this.gotoResidue(residueIdentifyingName, block);
    }
  }

  gotoResidue = (id: string, ref: React.RefObject<Residue>) => {
    if (this.residuesTainerRef.current)
      scrollIntoViewIfNeeded(id, this.residuesTainerRef.current);
  };

  increaseShownResiduesLimit = (increaseBy = ShownResiduesIncrement) => {
    this.setState({
      ...this.state,
      shownResiduesLimit: this.state.shownResiduesLimit + increaseBy,
    });
    setTimeout(() => (this.inhibitLoadNext = false), 100);
  };

  componentDidMount() {
    this.subscribe(this.props.switching.events.modelSwitched, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.switching.events.chainSwitched, () =>
      this.forceUpdate()
    );

    this.subscribe(this.props.viewerInterop.events.structuresDeselected, () => {
      for (const ref of this.residueBlocksMapping.values()) {
        if (ref.current) ref.current.collapseExpand("collapse");
      }
      this.setState({ currentExpandedId: undefined });
      this.events.allResiduesDeselected.next();
    });
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
    this.subscribe(this.events.residueToggled, (ev) => {
      const { residue, transition } = ev;
      const id = AnglesLengthsCommon.residueIdentifyingName(
        AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication),
        residue
      );
      if (transition === "selected")
        this.scrollResidueIntoView(id, (block) =>
          block.current?.collapseExpand("expand")
        );
      else if (transition === "deselected") {
        const block = this.residueBlocksMapping.get(id);
        block?.current?.collapseExpand("collapse");
        if (this.state.currentExpandedId === id) {
          this.setState({ currentExpandedId: undefined });
        }
      }
    });

    // Subscribe to bond window opening from URL
    this.subscribe(this.props.outsideControl.openBondWindow, (data: any) => {
      const { residue, bondSpec } = data;

      // Set state first so the ResidueDetails component will have the props when it mounts
      this.setState({ ...this.state, autoOpenBond: { residue, bondSpec } }, () => {
        // After state is set, expand the "Residues" section
        requestAnimationFrame(() => {
          this.residuesSectionCollapserRef.current?.collapseExpand("expand");

          // Wait for the residue block to render and set its ref
          const id = AnglesLengthsCommon.residueIdentifyingName(
            AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication),
            residue
          );

          requestAnimationFrame(() => {
            const block = this.residueBlocksMapping.get(id);
            if (block?.current) {
              block.current.collapseExpand("expand");
            }
          });
        });
      });
    });

    // Subscribe to angle window opening from URL
    this.subscribe(this.props.outsideControl.openAngleWindow, (data: any) => {
      const { residue, angleSpec } = data;

      // Set state first so the ResidueDetails component will have the props when it mounts
      this.setState({ ...this.state, autoOpenAngle: { residue, angleSpec } }, () => {
        // After state is set, expand the "Residues" section
        requestAnimationFrame(() => {
          this.residuesSectionCollapserRef.current?.collapseExpand("expand");

          // Wait for the residue block to render and set its ref
          const id = AnglesLengthsCommon.residueIdentifyingName(
            AnglesLengthsCommon.structureIdentifyingName(this.props.dnatcofication),
            residue
          );

          requestAnimationFrame(() => {
            const block = this.residueBlocksMapping.get(id);
            if (block?.current) {
              block.current.collapseExpand("expand");
            }
          });
        });
      });
    });
  }

  componentDidUpdate(prevProps: View.Props) {
    const prevModel = prevProps.structureSelection.modelIndex;
    const prevChain = prevProps.structureSelection.chain;
    const model = this.props.structureSelection.modelIndex;
    const chain = this.props.structureSelection.chain;

    if (prevModel !== model || prevChain !== chain)
      this.setState({
        ...this.state,
        shownResiduesLimit: DefaultShownResiduesLimit,
      });
  }

  componentWillUnmount() {
    this.winTracker.closeAll();
    this.unsubscribeAll();
  }

  render() {
    const multipleModels =
      Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
    const { modelIdx, chain } = AnglesLengthsCommon.getSelection(this.props);
    const alm = this.props.dnatcofication.data.almByResidue;

    const selectedIndices = ByResidueHelpers.selectionToIndices(
      this.props.dnatcofication,
      modelIdx,
      chain
    );
    const selectedResidues = selectedIndices.map((x) => alm.residues[x]);
    const selectedResidueStats = selectedIndices.map((x) => alm.stats[x]);
    const metrics = GlobalConfig.data().anglesLengths.summaryMetrics;
    const summary = metrics === 'naval'
      ? SummarizeNaval.substructure(selectedResidues, this.props.dnatcofication.data.naval)
      : SummarizeProSco.substructure(selectedResidues);

    const htmlColorsForStatsBar = new Array<string>();
    if (metrics === 'naval') {
      for (const cls of NavalRankingClasses) {
        htmlColorsForStatsBar.push(
          rgbToHex(colorToRgb(DAnglesLengths.navalRankingClassColor(cls)))
        );
      }
    } else if (metrics === 'prosco') {
      for (const grp of ProScoGroups)
        htmlColorsForStatsBar.push(
          rgbToHex(colorToRgb(DAnglesLengths.pGroupColor(grp)))
        );
      htmlColorsForStatsBar.push(
        rgbToHex(colorToRgb(DAnglesLengths.outlierColor()))
      );
    }

    const categoryOptions = (metrics === 'naval'
      ? Array.from([...NavalRankingClasses])
      : Array.from([...ProScoGroups, 'outlier']))
    .reverse()
    .map((thr) => {
      const v = thr.toString();
      return {
        caption: metrics === 'naval'
          ? DAnglesLengths.navalRankingClassName(v as NavalRankingClass)
          : v === 'outlier' ? DAnglesLengths.outlierName() : DAnglesLengths.pGroupName(v as ProScoGroup),
        value: v,
      };
    });

    const mkHeader = (text: string, withSearchIcon?: boolean) => {
      const searchIcon = withSearchIcon ? (
        <IconButton
          src={MagnifyingGlassImg}
          className="rdo-pushbutton h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            if (this.searchBoxOpen === true || !residuesOuterTainerRef.current)
              return;

            const searching: SearchBox.Searching<Measurements.Residue> = {
              ...this.Searching,
              onRenderResult: (residue: Measurements.Residue) => (
                <ResidueName r={residue} multipleModels={multipleModels} />
              ),
              onUseResult: (r) => {
                const id = AnglesLengthsCommon.residueIdentifyingName(
                  AnglesLengthsCommon.structureIdentifyingName(
                    this.props.dnatcofication
                  ),
                  r
                );
                this.scrollResidueIntoView(id, (block) =>
                  block.current?.collapseExpand("expand")
                );
              },
            };
            const sbprops = { ...this.SearchBoxProps, searching };

            this.searchBoxOpen = true;
            SearchBox.create(residuesOuterTainerRef.current, sbprops);
          }}
        />
      ) : null;

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
            {searchIcon}
          </div>
        ),
      };
    };

    const residuesOuterTainerRef = React.createRef<HTMLDivElement>();
    const residueBlocks = this.renderSelection(
      this.residuesTainerRef,
      selectedIndices,
      multipleModels,
      htmlColorsForStatsBar,
      this.state.shownResiduesLimit,
      this.increaseShownResiduesLimit,
      this.winTracker
    );
    this.residueBlocksMapping = residueBlocks.mapping;

    return (
      <div className="overflow-hidden h-full grid [grid-template-rows:auto_auto_auto_auto_auto_1fr_auto]">
        <div className="rdo-secondary-caption">
          {AnglesLengthsCommon.displayedSelectionName(
            modelIdx,
            chain,
            multipleModels,
            this.props.dnatcofication
          )}
        </div>
        <OverallStatsBar
          name={AnglesLengthsCommon.selectionName(
            this.props.dnatcofication,
            multipleModels,
            modelIdx,
            chain
          )}
          residues={selectedResidues}
          stats={selectedResidueStats}
        >
          <div className="flex flex-col h-20">
            <div className="flex flex-1">
              {AnglesLengthsCommon.renderSubstructureStats(
                this.winTracker,
                "Lengths",
                AnglesLengthsCommon.substructureBarCaption(
                  "Lengths",
                  metrics === 'naval' ? DAnglesLengths.navalRankingClassColor('allowed') : DAnglesLengths.pGroupColor('common')
                ),
                summary.lengths,
                metrics === 'naval'
                  ? { kind: 'naval', counts: SummarizeNaval.countsInGroups(summary.lengths) }
                  : { kind: 'prosco', counts: SummarizeProSco.countsInGroups(summary.lengths) },
                htmlColorsForStatsBar
              )}
            </div>
            <div className="flex flex-1">
              {AnglesLengthsCommon.renderSubstructureStats(
                this.winTracker,
                "Angles",
                AnglesLengthsCommon.substructureBarCaption(
                  "Angles",
                  metrics === 'naval' ? DAnglesLengths.navalRankingClassColor('allowed') : DAnglesLengths.pGroupColor('common')
                ),
                summary.angles,
                metrics === 'naval'
                  ? { kind: 'naval', counts: SummarizeNaval.countsInGroups(summary.angles) }
                  : { kind: 'prosco', counts: SummarizeProSco.countsInGroups(summary.angles) },
                htmlColorsForStatsBar
              )}
            </div>
          </div>
        </OverallStatsBar>

        <div className="overflow-hidden flex-1">
          <CollapsibleVertical
            ref={this.residuesSectionCollapserRef}
            header={mkHeader("Residues", true)}
            style={Common.VScrollJail}
            onCollapsedExpanded={(change) => {
              if (change === "collapsed")
                this.setState({
                  ...this.state,
                  shownResiduesLimit: DefaultShownResiduesLimit,
                });
            }}
          >
            <div
              ref={residuesOuterTainerRef}
              className="overflow-hidden flex-1 relative"
            >
              <div
                className="rdo-scroll-vertically-with-scrollbar"
                ref={this.residuesTainerRef}
                onScroll={(ev) => {
                  // Debounce
                  if (this.inhibitLoadNext) return;

                  const self = ev.currentTarget;
                  const loadNextElem = document.querySelector(
                    `#${LoadNextElemId}`
                  );
                  if (!loadNextElem) return;

                  const tainerBRect = self.getBoundingClientRect();
                  const loadNextBRect = loadNextElem.getBoundingClientRect();

                  if (
                    loadNextBRect.top + loadNextBRect.height / 2 <
                    tainerBRect.bottom
                  ) {
                    this.inhibitLoadNext = true;
                    this.increaseShownResiduesLimit();
                  }
                }}
              >
                {residueBlocks.elems}
              </div>
            </div>
          </CollapsibleVertical>
        </div>

        <div className="overflow-hidden flex-1">
          <CollapsibleVertical
            header={mkHeader("Most untypical lengths")}
            style={Common.VScrollJail}
          >
            <div className="overflow-scroll">
              <NamedList sizing="min-content" rowSpacing="half">
                <NamedListItem name="Category">
                  <RadixComboBox
                    options={categoryOptions}
                    value={this.state.worstLengthsThreshold}
                    onChange={(v) =>
                      this.setState({ ...this.state, worstLengthsThreshold: v as any })
                    }
                  />
                </NamedListItem>
                <NamedListItem name="Max. count">
                  <SpinBox
                    min={1}
                    max={100}
                    step={1}
                    value={this.state.maxWorstLengths}
                    onChange={(v) =>
                      this.setState({ ...this.state, maxWorstLengths: v })
                    }
                  />
                </NamedListItem>
              </NamedList>
              <div className="overflow-hidden flex-1">
                <div className="rdo-scroll-vertically-with-scrollbar">
                  {this.renderWorstLengths(
                    selectedResidues,
                    selectedResidueStats,
                    metrics,
                    this.state.maxWorstLengths,
                    this.state.worstLengthsThreshold as any,
                    AnglesLengthsCommon.structureIdentifyingName(
                      this.props.dnatcofication
                    ),
                    multipleModels,
                    this.winTracker
                  )}
                </div>
              </div>
            </div>
          </CollapsibleVertical>
        </div>

        <div className="overflow-hidden flex-1">
          <CollapsibleVertical
            header={mkHeader("Most untypical angles")}
            style={Common.VScrollJail}
          >
            <div className="overflow-scroll">
              <NamedList sizing="min-content" rowSpacing="half">
                <NamedListItem name="Category">
                  <RadixComboBox
                    options={categoryOptions}
                    value={this.state.worstAnglesThreshold}
                    onChange={(v) =>
                      this.setState({ ...this.state, worstAnglesThreshold: v })
                    }
                  />
                </NamedListItem>
                <NamedListItem name="Max. count">
                  <SpinBox
                    min={1}
                    max={100}
                    step={1}
                    value={this.state.maxWorstAngles}
                    onChange={(v) =>
                      this.setState({ ...this.state, maxWorstAngles: v })
                    }
                  />
                </NamedListItem>
              </NamedList>
              <div className="overflow-hidden flex-1">
                <div className="rdo-scroll-vertically-with-scrollbar">
                  {this.renderWorstAngles(
                    selectedResidues,
                    selectedResidueStats,
                    metrics,
                    this.state.maxWorstAngles,
                    this.state.worstAnglesThreshold as any,
                    AnglesLengthsCommon.structureIdentifyingName(
                      this.props.dnatcofication
                    ),
                    multipleModels,
                    this.winTracker
                  )}
                </div>
              </div>
            </div>
          </CollapsibleVertical>
        </div>
      </div>
    );
  }
}
