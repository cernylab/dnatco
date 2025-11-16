import { PlotRelayoutEvent } from "plotly.js";
import Plot, { Figure } from "react-plotly.js";
import React from "react";
import { Subject } from "rxjs";
import { View } from "../view";
import { Colors } from "../../colors";
import { StatsBar } from "../../stats-bar";
import { SelectedPieces } from "../../structure-selection";
import { Icon } from "../../../common/icon";
import { Tooltip } from "../../../common/tooltip";
import { Window } from "../../../common/window";
import { colorStyle } from "../../../util";
import { DataTransferDownloadImg, tooltipImg } from "../../../../assets/images";
import { doDownload, Downloader } from "../../../../browser-util/downloader";
import { ALM } from "../../../../dnatco/alm";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import {
    AnglesLengths as DAnglesLengths,
    NavalRankingClass,
    NavalRankingData
} from "../../../../dnatco/angles-lengths";
import { Triplet } from "../../../../dnatco/angles-lengths/angles";
import { Reference } from "../../../../dnatco/angles-lengths/reference-sets";
import {
  isShiftedName,
  unshiftName,
} from "../../../../dnatco/angles-lengths/atoms";
import { Bins } from "../../../../dnatco/angles-lengths/bin";
import { Pair } from "../../../../dnatco/angles-lengths/lengths";
import { Measurements } from "../../../../dnatco/angles-lengths/measurements";
import { Naval } from "../../../../dnatco/naval";
import { Validation } from "../../../../dnatco/naval/validation";
import { Summarize, SummarizeProSco } from "../../../../dnatco/angles-lengths/summarize";
import { GlobalConfig } from "../../../../global-config";
import { htmlColorAsNumber, isWithin, replaceAll } from "../../../../util";
import { colorToTuple, luminance, colorToHex } from "../../../../util/colors";
import { FileTypes } from "../../../../util/file-type";
import { M } from "../../../../util/math";
import { Serialization } from "../../../../util/serialization";
import {
  InvalidAtom,
  InvalidChain,
  InvalidModelIndex,
  CifAtom,
  CifResidue,
  StructureSelection,
} from "../../../../util/structure-selection";
import { ViewerApi, ViewerInterop } from "../../../../viewer/viewer-interop";

export const ColorIsDarkThreshold = 0.5;
export const AngstromUnit = "\u00A0\u00C5";
export const DegreesUnit = "\u00B0";
export const LeftwardsArrowWithBar = "\u21A4";
export const RightwardsArrowWithBar = "\u21A6";

const PairBondNameCache: Map<string, React.ReactElement> = new Map();
const TripletBondNameCache: Map<string, React.ReactElement> = new Map();

export type NavalItem = {
  csdPreferredLeft: number;
  csdPreferredRight: number;
  value: number;
  quality: Naval.Quality | "none";
};
export function NavalItem(
  item: Validation.ReportItem<Validation.AngleAtoms | Validation.BondAtoms>
): NavalItem {
  const threeSigma = 3 * item.target_sigma;
  return {
    csdPreferredLeft: item.target_value - threeSigma,
    csdPreferredRight: item.target_value + threeSigma,
    value: item.target_value,
    quality: Naval.quality(item),
  };
}
const EmptyNavalItem: NavalItem = {
  csdPreferredLeft: 0,
  csdPreferredRight: 0,
  value: 0,
  quality: "none",
};

type AveragesChartDownloader = Downloader<Serialization.Serializable>;
const AveragesChartDownloaders = [
  {
    caption: "CSV",
    download: function (fileNameStem, data) {
      const text = Serialization.toCsv(data);
      doDownload(fileNameStem, text, this.fileType);
    },
    fileType: FileTypes.csv,
  },
  {
    caption: "JSON",
    download: function (fileNameStem, data) {
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

export function AnglesLengthsBar(props: {
  caption?: string | React.ReactNode;
  counts: Summarize.Counts;
  colors: string[];
}) {
  const renderCaption = () => {
    if (!props.caption) return void 0;

    if (typeof props.caption === "string") {
      return (
        <div className="text-white font-bold top-0 left-4 absolute z-1">
          {props.caption}
        </div>
      );
    } else {
      return props.caption;
    }
  };

  return (
    <div className="w-full relative flex flex-row">
      <StatsBar counts={props.counts.exclusive} colors={props.colors} />
      {renderCaption()}
    </div>
  );
}

export class AveragesChart extends React.Component<{
  bins: Bins;
  pGroupDatas: DAnglesLengths.PGroupData[];
  mark: number;
  ofConcernLowerMark: number;
  ofConcernUpperMark: number;
  xTitle: string;
  yTitle: string;
  xTransform?: (x: number) => number;
  yTransform?: (y: number) => number;
  downloadFileName?: string;
  onInitialized?: (fig: Readonly<Figure>) => void;
  onRelayout?: (relayout: Readonly<PlotRelayoutEvent>) => void;
}> {
  private binsToPGroupIndices(
    bins: Bins,
    pGroupDatas: DAnglesLengths.PGroupData[]
  ) {
    const allGroupedBins = pGroupDatas.flatMap((x, idx) =>
      x.groupedBins.map((bin) => ({ bin: bin, pGroupIdx: idx }))
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

    shouldComponentUpdate(nextProps: Readonly<{ bins: Bins; pGroupDatas: DAnglesLengths.PGroupData[]; mark: number; ofConcernLowerMark: number; ofConcernUpperMark: number; xTitle: string; yTitle: string; xTransform?: (x: number) => number; yTransform?: (y: number) => number; downloadFileName?: string; onInitialized?: (fig: Readonly<Figure>) => void; onRelayout?: (relayout: Readonly<PlotRelayoutEvent>) => void; }>, nextState: Readonly<{}>, nextContext: any): boolean {
        return (
            nextProps.bins !== this.props.bins ||
            nextProps.pGroupDatas !== this.props.pGroupDatas ||
            nextProps.mark !== this.props.mark ||
            nextProps.ofConcernLowerMark !== this.props.ofConcernLowerMark ||
            nextProps.ofConcernUpperMark !== this.props.ofConcernUpperMark ||
            nextProps.xTitle !== this.props.xTitle ||
            nextProps.yTitle !== this.props.yTitle ||
            nextProps.xTransform !== this.props.xTransform ||
            nextProps.yTransform !== this.props.yTransform ||
            nextProps.downloadFileName !== this.props.downloadFileName
        );
  }

  render() {
    const markerColorTup = colorToTuple(
      htmlColorAsNumber(GlobalConfig.data().anglesLengths.chartMarkerColor) ?? 0
    );

    const outlierColor = DAnglesLengths.outlierColor();
    const pGroupIndices = this.binsToPGroupIndices(
      this.props.bins,
      this.props.pGroupDatas
    );
    const ofConcernColor = (() => {
      const tup = colorToTuple(DAnglesLengths.navalRankingClassColor('of-concern'));
      return `rgb(${tup[0]}, ${tup[1]}, ${tup[2]})`;
    })();
    const color = pGroupIndices.map((pgIdx) => {
      const tup = colorToTuple(
        pgIdx === -1 ? outlierColor : DAnglesLengths.pGroupColor(pgIdx)
      );
      return `rgb(${tup[0]}, ${tup[1]}, ${tup[2]})`;
    });

    const tm = this.props.xTransform
      ? this.props.xTransform(this.props.mark)
      : this.props.mark;
    const xt = this.props.bins.map((b) =>
      this.props.xTransform ? this.props.xTransform(b.from) : b.from
    );
    const yt = this.props.bins.map((b) =>
      this.props.yTransform
        ? this.props.yTransform(b.probability)
        : b.probability
    );
    const yMax = Math.max(...yt);

    const xtFrom = xt[0];
    const xtTo = xt[xt.length - 1];
    const xAxisMargin = (xtTo - xtFrom) * 0.05;
    const xRange = [
      (xtFrom > tm ? tm : xtFrom) - xAxisMargin,
      (xtTo < tm ? tm : xtTo) + xAxisMargin,
    ];

    return (
      <div className="w-full h-full">
        <div className="rdo-dynamic-table-download-bar bg-secondary-second flex flex-row gap-1">
          {AveragesChartDownloaders.map((dl, idx) => {
            return (
              <div
                className="rdo-dynamic-table-download-button"
                onClick={(e) => {
                  e.nativeEvent.stopImmediatePropagation();
                  e.stopPropagation();

                  let markInRange = false;
                  const actual = new Array<number>();
                  this.props.bins.forEach((bin) => {
                    if (isWithin(this.props.mark, bin)) {
                      actual.push(yMax);
                      markInRange = true;
                    } else actual.push(0);
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

                  const tags = ["x", "y", "pGroupIndex", "actual"];
                  const values = [_xt, _yt, _pGroupIndices, actual];

                  dl.download(
                    this.props.downloadFileName ?? "angle_length_prob_chart",
                    { tags, values }
                  );
                }}
                key={idx}
              >
                <Icon img={DataTransferDownloadImg} size="text" />
                {dl.caption}
              </div>
            );
          })}
          <div className="flex-1" />
        </div>

        <Plot
          data={[
            {
              x: xt,
              y: yt,
              width: xt[1] - xt[0],
              marker: { color: color },
              hoverinfo: "none",
              type: "bar",
              showlegend: false,
            },
            {
              x: [tm],
              y: [yMax * 1.05],
              type: "bar",
              width: 2 * (xt[1] - xt[0]),
              marker: {
                color: `rgb(${markerColorTup[0]}, ${markerColorTup[1]}, ${markerColorTup[2]})`,
              },
              hoverinfo: "text",
              hovertext: "Actual value",
              hoveron: "fills",
              showlegend: false,
            },
            {
              x: [this.props.xTransform?.(this.props.ofConcernLowerMark) ?? this.props.ofConcernLowerMark],
              y: [yMax * 0.33],
              type: "bar",
              width: 2 * (xt[1] - xt[0]),
              marker: {
                color: ofConcernColor,
              },
              hoverinfo: "text",
              hovertext: "NA-VAL Of Concern Lower",
              hoveron: "fills",
              showlegend: false,
            },
            {
              x: [this.props.xTransform?.(this.props.ofConcernUpperMark) ?? this.props.ofConcernUpperMark],
              y: [yMax * 0.33],
              type: "bar",
              width: 2 * (xt[1] - xt[0]),
              marker: {
                color: ofConcernColor,
              },
              hoverinfo: "text",
              hovertext: "NA-VAL Of Concern Upper",
              hoveron: "fills",
              showlegend: false,
            },
          ]}
          layout={{
            autosize: true,
            bargap: 0,
            dragmode: "pan",
            hovermode: "closest",
            margin: { t: 0, l: 0, b: 45, r: 0 },
            xaxis: { title: { text: this.props.xTitle }, range: xRange },
            yaxis: { showticklabels: false },
            plot_bgcolor: "white",
            paper_bgcolor: "white",
          }}
          config={{
            displayModeBar: false,
            responsive: true,
                  scrollZoom: true,
                  autosizable: true
          }}
          style={{
              margin: 0,
              height: '450px',
          }}
          onInitialized={(fig, _elem) => this.props.onInitialized?.(fig)}
          onRelayout={(evt) => this.props.onRelayout?.(evt)}
        />
      </div>
    );
  }
}

export function FloatingCue(props: {
  children: JSX.Element | JSX.Element[];
  yOffset: number;
  onClicked: () => void;
}) {
  if (props.yOffset > 0) {
    return (
      <div
        className="bg-primary-first text-white absolute right-8 py-1 px-2 rounded-smaller"
        style={{
          top: `${props.yOffset + 16}px`,
          zIndex: 1,
        }}
        onClick={() => props.onClicked()}
      >
        {props.children}
      </div>
    );
  } else return <div className="invisible" />;
}

function NavalBar(props: {
  pGroup: DAnglesLengths.PGroup;
  value: number,
  navalRanking: NavalRankingData;
  navalRangeLow: number,
  navalRangeHigh: number,
  navalPreferredLower: number,
  navalPreferredUpper: number,
}) {
  const ofConcernClr = React.useMemo(() => colorToHex(DAnglesLengths.navalRankingClassColor('of-concern')), []);
  const allowedClr = React.useMemo(() => colorToHex(DAnglesLengths.navalRankingClassColor('allowed')), []);
  const preferredClr = React.useMemo(() => colorToHex(DAnglesLengths.navalRankingClassColor('preferred')), []);

  const totalPreferredLower = React.useMemo(() => (
    DAnglesLengths.navalPreferredLowerBound(props.navalPreferredLower, props.pGroup)
  ), [props.pGroup]);
  const totalPreferredUpper = React.useMemo(() => (
    DAnglesLengths.navalPreferredUpperBound(props.navalPreferredUpper, props.pGroup)
  ), [props.pGroup]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const ranking = props.navalRanking;

  const lowest = props.navalRangeLow;
  const highest = props.navalRangeHigh;
  const span = highest - lowest;

  if (ranking.ofConcernLower > totalPreferredLower) {
    console.warn(`ofConcernLower (${ranking.ofConcernLower}) is greater than totalPreferredLower ${totalPreferredLower}`);
  }
  if (totalPreferredUpper > ranking.ofConcernUpper) {
    console.warn(`totalPreferredUpper (${totalPreferredUpper}) is greater than ofConcernUpper ${ranking.ofConcernUpper}`);
  }

  const context = canvasRef.current?.getContext('2d');
  if (context) {
    if (span === 0) return;

    const w = context.canvas.width;
    const h = context.canvas.height;

    const ofConcernLower = w * (ranking.ofConcernLower - lowest) / span;
    if (ofConcernLower > 0) {
      context.fillStyle = ofConcernClr;
      context.fillRect(0, 0, ofConcernLower, h);
    }

    const preferredLower = w * (totalPreferredLower - lowest) / span;
    context.fillStyle = allowedClr;
    context.fillRect(ofConcernLower, 0, preferredLower - ofConcernLower, 32);

    const preferredUpper = w * (totalPreferredUpper - lowest) / span;
    context.fillStyle = preferredClr;
    context.fillRect(preferredLower, 0, preferredUpper - preferredLower, 32);

    const ofConcernUpper = w * (ranking.ofConcernUpper - lowest) / span;
    context.fillStyle = allowedClr;
    context.fillRect(preferredUpper, 0, ofConcernUpper - preferredUpper, 32);

    if (ofConcernUpper < w) {
      context.fillStyle = ofConcernClr;
      context.fillRect(ofConcernUpper, 0, w - ofConcernUpper, 32);
    }

    const valueMarker = w * (props.value - lowest) / span;
    context.fillStyle = '#000000';
    context.fillRect(valueMarker - 2, 0, 4, 32);
  }

  return (
    <canvas ref={canvasRef} width={canvasRef.current?.width ?? 450} height={32}>
    </canvas>
  );
}

export type PGroupSummaryProps = {
  bins: Bins;
  pGroup: DAnglesLengths.PGroup;
  pGroupDatas: DAnglesLengths.PGroupData[];
  maybeBin: ALM.MaybeBin,
  rangeFormatter: (v: number) => string;
  residueName: JSX.Element;
  value: number;
  valueFormatter: (v: number) => string;
  navalPreferredLower: number,
  navalPreferredUpper: number,
  navalRanking: NavalRankingData;
  navalRankingClass: NavalRankingClass;
  nearestReferenceLower: Reference | undefined;
  nearestReferenceUpper: Reference | undefined;
  xTitle: string;
  yTitle: string;
  suffix?: string;
  xTransform?: (x: number) => number;
  yTransform?: (y: number) => number;
  xUntransform?: (x: number) => number;
  downloadFileName?: string;
  highlighter: () => void;
  vi: ViewerInterop;
};
export class PGroupSummary extends React.Component<
  PGroupSummaryProps,
  {
    mode: "chart" | "details",
    navalTainer: HTMLDivElement | null,
    navalRangeLow: number,
    navalRangeHigh: number,
  }
> {
  constructor(props: PGroupSummaryProps) {
    super(props);

    this.state = {
      mode: "chart",
      navalTainer: null,
      navalRangeLow: 0,
      navalRangeHigh: 0,
    };
  }

  private navalRankingClassName() {
    switch (this.props.navalRankingClass) {
      case 'of-concern': return 'Of concern';
      case 'allowed': return 'Allowed';
      case 'preferred': return 'Preferred';
    }
  }

  private renderSummary() {
    const proscoColor = colorToHex(this.props.pGroup?.color ?? DAnglesLengths.outlierColor());

    const nearestLower = this.props.nearestReferenceLower;
    const nearestUpper = this.props.nearestReferenceUpper;

    return (
      <div className="flex flex-row gap-4 font-bold">
          <div className="gap-2" style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', alignItems: 'center' }}>
          <div>NA-VAL</div>
          <div></div>
          <div style={{
            width: '1rem',
            height: '1rem',
            backgroundColor: colorToHex(DAnglesLengths.navalRankingClassColor(this.props.navalRankingClass))
          }} />
          <div>{this.navalRankingClassName()}</div>

          <div>ProSco</div>
          <div><Prosco bin={this.props.maybeBin} /></div>
          <div style={{
            width: '1rem',
            height: '1rem',
            backgroundColor: proscoColor
          }} />
          <div>{this.props.pGroup?.name ?? DAnglesLengths.outlierName()}</div>
        </div>

        <div style={{ flex: '1' }} />

        <div className="flex flex-row gap-2">
            <div>RS18</div>
            <div className="gap-2" style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto' }}>
                <div>{LeftwardsArrowWithBar}</div>
                <div>{nearestLower?.[1].toUpperCase() ?? ''}</div>
                <div>{nearestLower?.[3] ?? ''}</div>
                <div>{nearestLower?.[4] ?? ''}</div>
                <div>{nearestLower?.[6] ?? ''}</div>

                <div>{RightwardsArrowWithBar}</div>
                <div>{nearestUpper?.[1].toUpperCase() ?? ''}</div>
                <div>{nearestUpper?.[3] ?? ''}</div>
                <div>{nearestUpper?.[4] ?? ''}</div>
                <div>{nearestUpper?.[6] ?? ''}</div>
            </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.highlighter();
  }

  render() {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="h-2" />
        <AveragesChart
          bins={this.props.bins}
          mark={this.props.value}
          ofConcernLowerMark={this.props.navalRanking.ofConcernLower}
          ofConcernUpperMark={this.props.navalRanking.ofConcernUpper}
          pGroupDatas={this.props.pGroupDatas}
          xTitle={this.props.xTitle}
          yTitle={this.props.yTitle}
          xTransform={this.props.xTransform}
          yTransform={this.props.yTransform}
          downloadFileName={this.props.downloadFileName}
          onInitialized={(fig) => {
            this.setState({
              ...this.state,
              navalRangeLow: this.props.xUntransform?.(fig.layout?.xaxis?.range?.[0] as number ?? 0) ?? fig.layout?.xaxis?.range?.[0] as number,
              navalRangeHigh: this.props.xUntransform?.(fig.layout?.xaxis?.range?.[1] as number ?? 0) ?? fig.layout?.xaxis?.range?.[1] as number,
            });
          }}
          onRelayout={(relayout) => {
            // This seemingly ridiculous way to get the X axis range is necessary
            const [rangeLow , rangeHigh] = relayout["xaxis.range"]
               ? [relayout["xaxis.range"][0], relayout["xaxis.range"][1]] as [number, number]
               : [relayout["xaxis.range[0]"], relayout["xaxis.range[1]"]] as [number, number];

            if (!!rangeLow && !!rangeHigh) {
              this.setState({
                ...this.state,
                navalRangeLow: this.props.xUntransform?.(rangeLow) ?? rangeLow,
                navalRangeHigh: this.props.xUntransform?.(rangeHigh) ?? rangeHigh
              });
            }
          }}
        />

        <div className="h-2" />
        <NavalBar
          pGroup={this.props.pGroup}
          navalRanking={this.props.navalRanking}
          value={this.props.value}
          navalRangeLow={this.state.navalRangeLow}
          navalRangeHigh={this.state.navalRangeHigh}
          navalPreferredLower={this.props.navalPreferredLower}
          navalPreferredUpper={this.props.navalPreferredUpper}
        />

        <div className="h-2" />
        {this.renderSummary()}
      </div>
    );
  }
}

export function Prosco(props: { bin: ALM.MaybeBin }) {
  const renderUnavailable = (belowAbove: "below" | "above") => {
    return (
      <Tooltip
        tag=<div className="text-right">
          {belowAbove === "below" ? "N/A (<)" : "N/A (>)"}
        </div>
      >
        <div>
          Relative probability is unavailable because the value is outside the
          range of values observed in the reference dataset.
        </div>
      </Tooltip>
    );
  };

  const bin = props.bin;

  if (bin === "no-data") {
    return <div className="text-right">No data</div>;
  } else if (bin === "below" || bin === "above") return renderUnavailable(bin);
  else {
    return (
      // Remove tooltip?
      <Tooltip
        tag=<div className="text-right">
          {fmtDecimal(bin.prosco * 100, 1)}
          {"\u00A0"}%
        </div>
      >
        <div>
          {props.bin
            ? `Relative probability of bin [${bin.from}\u00A0-\u00A0${bin.to}] within its respective distribution.`
            : "Relative probability is unavailable because the value is outside the range of values observed in the reference dataset."}
        </div>
      </Tooltip>
    );
  }
}

export function ResidueName(props: {
  r: Measurements.Residue;
  multipleModels: boolean;
}) {
  let inner = [];

  if (props.multipleModels) {
    inner.push(
      <span className="rdo-nice-step-model">M{props.r.modelNum}</span>
    );
    inner.push(<span>{"\u00A0"}</span>);
  }

  inner.push(<span>{props.r.authChain}</span>);
  inner.push(<span>{"\u00A0"}</span>);
  inner.push(
    <span className="rdo-nice-step-base font-bold">{props.r.compound}</span>
  );
  inner.push(<span>{props.r.authSeqId}</span>);
  if (props.r.insCode) inner.push(<span>{props.r.insCode}</span>);
  if (props.r.altId)
    inner.push(
      <span className="rdo-nice-step-altpos">(alt. {props.r.altId})</span>
    );

  return <div>{...inner}</div>;
}

export function SubstructureSummary(props: {
    // FIXME: THIS IS A PROBLEM
  countsInGroups: SummarizeProSco.CountsInGroup[];
}) {
  const maxDecimals = Math.max(
    ...props.countsInGroups.map((x) => {
      const s = x.threshold.toString();
      const dot = s.indexOf(".");
      return dot >= 0 ? s.substring(dot + 1).length : 0;
    })
  );
  const outlierColor = DAnglesLengths.outlierColor();
  const total =
    props.countsInGroups[props.countsInGroups.length - 1].cumulative;

  return (
    <div className="grid gap-x-4 [grid-template-columns:1em_auto_auto_auto]">
      <div className="col-span-2" />
      <div className="font-700 text-center flex justify-center col-start-3 col-span-2">
        Counts
      </div>

      <div className="font-700 col-span-2">Percentile</div>
      <div className="font-700">Exclusive</div>
      <div className="font-700">Cumulative</div>
      {props.countsInGroups.map((x, idx) => {
        const thr =
          x.pGroupIdx === "outlier"
            ? "OfConcern"
            : x.threshold.toFixed(maxDecimals);
        const clr = DAnglesLengths.pGroupColor(idx) ?? outlierColor;
        const perc = 100 * (x.cumulative / total);
        return (
          <React.Fragment key={idx}>
            <div style={{ backgroundColor: colorStyle(colorToTuple(clr)) }} />
            <div className="text-right">{thr}</div>
            <div className="text-right">{x.exclusive}</div>
            <div className="text-right">{`${x.cumulative}\u00A0(${perc
              .toFixed(2)
              .padStart(6)}\u00A0%)`}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export class WindowsTracker {
  private windows: Window.Handle[] = [];

  add(hwnd: Window.Handle) {
    this.windows.push(hwnd);
  }

  close(hwnd: Window.Handle) {
    hwnd.close();
    this.remove(hwnd);
  }

  closeAll() {
    this.windows.forEach((hwnd) => hwnd.close());
    this.windows = [];
  }

  remove(hwnd: Window.Handle) {
    const idx = this.windows.findIndex((h) => h === hwnd);

    if (idx !== -1) this.windows.splice(idx, 1);
  }
}

export namespace AnglesLengthsCommon {
  export type ResidueToggledEvent = Subject<{
    residue: Measurements.Residue;
    transition: "selected" | "deselected";
  }>;

  function amendStructureSelection(
    selection: StructureSelection,
    residue: Measurements.Residue,
    strategy: "add" | "remove"
  ) {
    const cifRes = {
      modelNum: residue.modelNum,
      chain: residue.chain,
      seqId: residue.seqId,
      altId: residue.altId,
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

    if (strategy === "add") {
      selection.residues = selection.residues.filter(
        (x) => x.modelNum === cifRes.modelNum
      );
      selection.residues.push(cifRes);

      if (cifAtomPrevC3) {
        selection.atoms = selection.atoms.filter(
          (x) => x.modelNum === cifAtomPrevC3!.modelNum
        );
        selection.atoms.push(cifAtomPrevC3);
      }
      if (cifAtomPrevO3) {
        selection.atoms = selection.atoms.filter(
          (x) => x.modelNum === cifAtomPrevO3!.modelNum
        );
        selection.atoms.push(cifAtomPrevO3);
      }
    } else if (strategy === "remove") {
      selection.residues = selection.residues.filter(
        (x) => !cifResidueMatches(x, cifRes)
      );
      if (cifAtomPrevC3)
        selection.atoms = selection.atoms.filter(
          (x) => !cifAtomMatches(x, cifAtomPrevC3!)
        );
      if (cifAtomPrevO3)
        selection.atoms = selection.atoms.filter(
          (x) => !cifAtomMatches(x, cifAtomPrevO3!)
        );
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

  function compareNavalAtom(
    a: Validation.Atom,
    name: string,
    seqId: number,
    altId: string
  ) {
    const altIdMatch = a.altloc === "" || altId === "" || a.altloc === altId;
    const isShifted = isShiftedName(name);
    const _name = isShifted ? unshiftName(name) : name;
    const _seqId = isShifted ? seqId - 1 : seqId;

    return a.name === _name && a.seqId === _seqId && altIdMatch;
  }

  function makeBondName(bond: Pair | Triplet) {
    const toks = bond.map((x) =>
      isShiftedName(x) ? (
        <span>
          {unshiftName(x)}
          <span className="rdo-sup">(-1)</span>
        </span>
      ) : (
        <span>{x}</span>
      )
    );
    let idx = 1;
    while (idx < toks.length) {
      const tail = toks.splice(idx, toks.length - idx, <span>-</span>);
      toks.push(...tail);
      idx += 2;
    }

    return <span>{...toks}</span>;
  }

  export function pGroupWindowTitle(
    residueName: JSX.Element,
    metricName: JSX.Element,
    proscoPGroup: DAnglesLengths.PGroup,
    navalRankingClass: NavalRankingClass,
    value: string,
  ) {
    const proscoColor = colorToHex(proscoPGroup?.color ?? DAnglesLengths.outlierColor());
    const navalColor = colorToHex(DAnglesLengths.navalRankingClassColor(navalRankingClass));

    return (
      <div className="font-700 flex flex-row gap-1 items-center whitespace-nowrap">
        {residueName}
        <div>|</div>
        {metricName}

        <div style={{ backgroundColor: proscoColor, width: '1rem', height: '1rem' }} />
        <div style={{ backgroundColor: navalColor, width: '1rem', height: '1rem' }} />

        <div>{value}</div>
      </div>
    );
  }

  export async function SelectionDisplayer(
    pieces: SelectedPieces,
    d: Dnatcofication,
    vi: ViewerInterop
  ) {
    if (pieces.reconstruct)
      await vi.api.command(ViewerApi.Commands.DeselectStructures());

    if (pieces.residues.length < 1) return;

    const selected = [];
    for (const r of pieces.residues) {
      const authRes = StructureSelection.cifToAuthResidue(
        d.data.structures[0],
        r
      );
      if (authRes) {
        const cmdRes = ViewerApi.Commands.ResidueSelection(
          r.modelNum,
          authRes.chain,
          authRes.cifChain,
          authRes.seqId,
          authRes.insCode,
          authRes.altId,
          Colors.CurrentStep()
        );
        selected.push(cmdRes);
      }
    }
    for (const a of pieces.atoms) {
      const authAtom = StructureSelection.cifToAuthAtom(
        d.data.structures[0],
        a
      );
      if (authAtom) {
        const cmdAtom = ViewerApi.Commands.AtomSelection(
          authAtom.modelNum,
          authAtom.chain,
          authAtom.cifChain,
          authAtom.seqId,
          authAtom.insCode,
          authAtom.altId,
          authAtom.cifAtomId,
          0
        );
        selected.push(cmdAtom);
      }
    }

    await vi.api.command(ViewerApi.Commands.SelectStructures(selected));
  }

  export function SelectionMaker(
    newStepId: SelectedPieces["steps"][0],
    newResidue: SelectedPieces["residues"][0],
    newAtom: SelectedPieces["atoms"][0],
    steps: number[],
    residues: SelectedPieces["residues"],
    atoms: SelectedPieces["atoms"],
    d: Dnatcofication
  ): SelectedPieces {
    let newResidues;
    if (
      residues.find((x) => StructureSelection.cifResiduesMatch(x, newResidue))
    )
      newResidues = residues;
    else
      newResidues = [
        ...residues.filter((x) => x.modelNum === newResidue.modelNum),
        newResidue,
      ];

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
              };
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
      basePairs: [],
      reconstruct: steps.length > 0,
    };
  }

  export function deselectResidue(
    residue: Measurements.Residue,
    selection: StructureSelection,
    event: ResidueToggledEvent,
    d: Dnatcofication,
    vi: ViewerInterop
  ) {
    amendStructureSelection(selection, residue, "remove");
    SelectionDisplayer(
      {
        steps: [],
        residues: selection.residues,
        atoms: selection.atoms,
        basePairs: [],
        reconstruct: true,
      },
      d,
      vi
    );
    event.next({ residue, transition: "deselected" });
  }

  export function displayedSelectionName(
    modelIdx: number,
    chain: string,
    hasMultipleModels: boolean,
    dnatcofication: Dnatcofication
  ) {
    if (modelIdx === InvalidModelIndex) return "Entire structure";

    if (hasMultipleModels) {
      const m = dnatcofication.data.structures[0].models[modelIdx];
      const modelNum = dnatcofication.data.structures[0].models[modelIdx].num;
      const ch =
        chain === InvalidChain ? null : m.chains.find((x) => x.name === chain)!;

      return `Model ${modelNum}, ${
        ch === null ? "all chains" : `chain ${ch.authName} (Cif ${ch.name})`
      }`;
    } else {
      const m = dnatcofication.data.structures[0].models[0];
      const ch =
        chain === InvalidChain ? null : m.chains.find((x) => x.name === chain)!;
      return `${
        ch === null
          ? "Entire structure"
          : `Chain ${ch.authName} (Cif ${ch.name})`
      }`;
    }
  }

  export function fileNameFriendlyTag(tag: string) {
    return replaceAll(replaceAll(tag, "^", "_"), "'", "p");
  }

  export function getNavalAngle(
    d: Dnatcofication,
    r: Measurements.Residue,
    triplet: Triplet
  ) {
    const [na, nb, nc] = triplet;
    const niIdx =
      d.data.naval.anglesMapping
        .get(r.modelNum)
        ?.get(r.chain)
        ?.get(r.seqId)
        ?.find((idx) => {
          const { a, b, c } = d.data.naval.angles[idx].atoms;
          return (
            (compareNavalAtom(a, na, r.seqId, r.altId) ||
              compareNavalAtom(a, nc, r.seqId, r.altId)) &&
            compareNavalAtom(b, nb, r.seqId, r.altId) &&
            (compareNavalAtom(c, na, r.seqId, r.altId) ||
              compareNavalAtom(c, nc, r.seqId, r.altId))
          );
        }) ?? -1;
    return niIdx === -1
      ? EmptyNavalItem
      : NavalItem(d.data.naval.angles[niIdx]);
  }

  export function getNavalBond(
    d: Dnatcofication,
    r: Measurements.Residue,
    pair: Pair
  ) {
    const [na, nb] = pair;
    const niIdx =
      d.data.naval.bondsMapping
        .get(r.modelNum)
        ?.get(r.chain)
        ?.get(r.seqId)
        ?.find((idx) => {
          const rr = d.data.naval.bonds[idx];
          const { a, b } = rr.atoms;
          return (
            (compareNavalAtom(a, na, r.seqId, r.altId) ||
              compareNavalAtom(a, nb, r.seqId, r.altId)) &&
            (compareNavalAtom(b, na, r.seqId, r.altId) ||
              compareNavalAtom(b, nb, r.seqId, r.altId))
          );
        }) ?? -1;
    return niIdx === -1 ? EmptyNavalItem : NavalItem(d.data.naval.bonds[niIdx]);
  }

  export function getSelection(props: View.Props) {
    const modelIdx = props.structureSelection.modelIndex;
    const chain =
      props.structureSelection.chain === InvalidChain
        ? ""
        : props.structureSelection.chain;

    return { modelIdx, chain };
  }

  export function isResidueInSelection(
    r: Measurements.Residue,
    selection: StructureSelection
  ) {
    const cifRes = {
      modelNum: r.modelNum,
      chain: r.chain,
      seqId: r.seqId,
      altId: r.altId,
    };

    return !!selection.residues.find((x) => cifResidueMatches(x, cifRes));
  }

  export function makeAtomSelectionPayload(
    r: Measurements.Residue,
    atomName: string
  ) {
    if (isShiftedName(atomName)) {
      if (Measurements.Residue.hasPrevious(r))
        return ViewerApi.Payloads.AtomSelection(
          r.modelNum,
          r.authChain,
          r.chain,
          r.prevAuthSeqId!,
          r.prevInsCode!,
          r.prevAltId!,
          unshiftName(atomName),
          0
        );
      else return void 0;
    } else
      return ViewerApi.Payloads.AtomSelection(
        r.modelNum,
        r.authChain,
        r.chain,
        r.authSeqId,
        r.insCode,
        r.altId,
        atomName,
        0
      );
  }

  export function makeCollapsibleHeader(
    collapsed: React.ReactNode,
    expanded?: React.ReactNode
  ): { collapsed: React.ReactNode; expanded: React.ReactNode } {
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

  export function residueIdentifyingName(
    structureName: string,
    r: Measurements.Residue
  ) {
    return `${structureName}-m${r.modelNum}-${r.authChain}-${r.authSeqId}${
      r.insCode ? `.${r.insCode}` : ""
    }${r.altId ? `_alt${r.altId}` : ""}_`;
  }

  export function selectResidue(
    residue: Measurements.Residue,
    selection: StructureSelection,
    event: ResidueToggledEvent,
    d: Dnatcofication,
    vi: ViewerInterop
  ) {
    amendStructureSelection(selection, residue, "add");
    SelectionDisplayer(
      {
        steps: [],
        residues: selection.residues,
        atoms: selection.atoms,
        basePairs: [],
        reconstruct: false,
      },
      d,
      vi
    );
    event.next({ residue, transition: "selected" });
  }

  export function tripletBondName(t: Triplet, tag: string) {
    let name = TripletBondNameCache.get(tag);
    if (!name) {
      name = makeBondName(t);
      TripletBondNameCache.set(tag, name);
    }

    return name;
  }

  export function renderSubstructureStats(
    winTracker: WindowsTracker,
    winCaption: string | JSX.Element,
    caption: string | JSX.Element,
      summaryCounts: Summarize.Counts,
      /// FIXME: THIS IS A PROBLEM
    countsInGroups: SummarizeProSco.CountsInGroup[],
    colorsForCounts: string[],
    captionStyle?: React.CSSProperties
  ) {
    return (
      <AnglesLengthsBar
        caption={
          <div className="absolute z-1 top-0" style={{ ...captionStyle }}>
            <div
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const hwnd = Window.create(
                  <SubstructureSummary countsInGroups={countsInGroups} />,
                  winCaption,
                  { x: ev.pageX, y: ev.pageY },
                  (hwnd) => winTracker.remove(hwnd)
                );
                winTracker.add(hwnd);
              }}
            >
              {caption}
            </div>
          </div>
        }
        counts={summaryCounts}
        colors={colorsForCounts}
      />
    );
  }

  export function selectionName(
    d: Dnatcofication,
    multipleModels: boolean,
    modelIdx: number,
    chain: string
  ) {
    let name = multipleModels
      ? modelIdx === InvalidModelIndex
        ? ""
        : `m${d.data.structures[0].models[modelIdx].num}`
      : "";
    name += chain === InvalidChain ? "" : name ? `-${chain}` : chain;

    return `${structureIdentifyingName(d)}_${name ? `${name}_` : ""}`;
  }

  export function structureIdentifyingName(d: Dnatcofication) {
    return d.identifyingName ?? d.pdbId;
  }

  export function substructureBarCaption(text: string | JSX.Element, backgroundClr: number) {
    return (
      <div className="flex items-center h-full cursor-pointer p-1">
          <div className={`${luminance(backgroundClr) < ColorIsDarkThreshold ? "text-white" : ""} font-bold mr-2`}>{text}</div>
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
    );
  }
}
