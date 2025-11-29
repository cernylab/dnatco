import React from "react";
import { type StandardLonghandProperties } from "csstype";
import { Validation } from "./common";
import { View } from "../view";
import { Common } from "../../common";
import { StatsBar } from "../../stats-bar";
import { Cif } from "../../../../cif";
import { NdbStructNtcOverall } from "../../../../cif/categories/ndb-struct-ntc";
import { StepRmsdStats as DnatcoStepRmsdStats } from "../../../../dnatco/dnatcofication";
import { AnglesLengths as DAnglesLengths, NavalRankingClasses, ProScoGroup, ProScoGroups } from "../../../../dnatco/angles-lengths";
import { AnglesLengthsCommon } from "./angles-lengths-common";
import { confalPercentile } from "../../../../util/dnatco";
import { GlobalConfig } from "../../../../global-config";
import { GappedSemaphore } from "../../../../util/semaphore";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import {
  InvalidChain,
  InvalidModelIndex,
} from "../../../../util/structure-selection";
import { SummarizeNaval, SummarizeProSco } from "../../../../dnatco/angles-lengths/summarize";
import { ALM, ALMCompoundAngleLength } from "../../../../dnatco/alm";
import { doDownload, Downloader } from "../../../../browser-util/downloader";
import { SerializeByCompound } from "../../../../dnatco/angles-lengths/serialize";
import { FileTypes } from "../../../../util/file-type";
import { objKeys } from "../../../../util";
import { WindowsTracker } from "./angles-lengths-common";
import { colorToRgb, Rgb, rgbToHex } from "../../../../util/colors";
import { Tooltip } from "../../../common/tooltip";
import { tooltipImg } from "../../../../assets/images";

const GSMapping = GappedSemaphore.makeMapping([
  { from: 0, to: 0.3 },
  { from: 0.6, to: 1.0 },
]);

type DownloadableData = {
  angles: ALM.AngleStats[];
  countsAnglesProSco: Record<ProScoGroup | 'outlier',  SummarizeProSco.CountsInGroup>;
  lengths: ALM.LengthStats[];
  countsLengthsProSco: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>;
};

function DownloadableData(
  angles: Record<string, ALM.CompoundStats<ALM.AngleStats>>,
  countsAnglesProSco: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
  lengths: Record<string, ALM.CompoundStats<ALM.LengthStats>>,
  countsLengthsProSco: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>
): DownloadableData {
  return {
    angles: objKeys(angles).flatMap((k) =>
      Array.from(angles[k].byMetric.values()).map((x) => x.individual)
    ),
    countsAnglesProSco,
    lengths: objKeys(lengths).flatMap((k) =>
      Array.from(lengths[k].byMetric.values()).map((x) => x.individual)
    ),
    countsLengthsProSco,
  };
}

type StatsDownloader = Downloader<DownloadableData>;
const StatsDownloaders = [
  {
    caption: "CSV",
    download(fileNameStem, data) {
      const text = SerializeByCompound.toCsv(
        data.angles,
        data.countsAnglesProSco,
        data.lengths,
        data.countsLengthsProSco
      );
      doDownload(fileNameStem, text, this.fileType);
    },
    fileType: FileTypes.csv,
  },
  {
    caption: "JSON",
    download(fileNameStem, data) {
      const text = SerializeByCompound.toJson(
        data.angles,
        data.countsAnglesProSco,
        data.lengths,
        data.countsLengthsProSco
      );
      doDownload(fileNameStem, text, this.fileType);
    },
    fileType: FileTypes.json,
  },
] as StatsDownloader[];

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

function OverallStatsBar(props: {
  children: React.ReactNode;
  downloadableData: DownloadableData;
  downloaders: StatsDownloader[];
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
      ch === null ? "Entire structure" : `Chain ${ch.authName} (Cif ${ch.name})`
    }`;
  }
}

class ConfalPercentileStatsBar extends React.Component<{ percentile: number }> {
  render() {
    return (
      <div
        className="items-center relative bg-linear-to-r from-secondary-third via-white to-secondary-second"
        style={{ height: `${Common.BarHeightEm}em` }}
      >
        <div
          className="bg-primary-first h-[133%] absolute w-2 -top-[16%]"
          style={{ left: `${this.props.percentile}%` }}
        />
      </div>
    );
  }
}

class Stats extends React.Component<{
  assigned: number;
  close: number;
  unassigned: number;
  rmsdStats: DnatcoStepRmsdStats[];
  confalAverage: number;
  confalPercentile: number;
}> {
  render() {
    const _stats = this.props.rmsdStats;
    const rmsdCounts = _stats.map((x) => x.count);
    const rmsdGreen = _stats[0].rmsdThreshold;
    const rmsdRed =
      _stats[this.props.rmsdStats.length - 2]?.rmsdThreshold ?? rmsdGreen * 2;
    const rmsdColors = _stats.map((x, idx) => {
      const thrPrev = _stats[idx - 1]?.rmsdThreshold ?? 0;
      const v =
        x.rmsdThreshold === -1
          ? rmsdRed + 0.1
          : thrPrev + (x.rmsdThreshold - thrPrev) / 2.0;
      const rgb = GappedSemaphore.toSemaphore(v, rmsdGreen, rmsdRed, GSMapping);

      return rgbToHex(rgb);
    });

    return (
      <div>
        <div className="flex">
          <div className="font-700 mr-2">NtC conformers:</div>
          <div className="flex">
            <div className="mr-2">{`Assigned:\u00A0${this.props.assigned}`}</div>
            <div>{`Unassigned:\u00A0${this.props.unassigned}`}</div>
          </div>
        </div>
        <div>
          <div className="flex">
            <div className="font-700">Confal score</div>
            <Tooltip
              tag={
                <div className="cursor-pointer ml-2">
                  <img className="w-5" src={tooltipImg} />
                </div>
              }
              delayMsec={300}
            >
              100 indicates a perfect alignment with a reference, 0 a
              significant departure. For more see Help
            </Tooltip>
          </div>
          <div>{`Average value:\u00A0${this.props.confalAverage.toFixed(
            0
          )}`}</div>
          <div>{`Percentile:\u00A0${this.props.confalPercentile.toFixed(
            0
          )}`}</div>
          <ConfalPercentileStatsBar percentile={this.props.confalPercentile} />
        </div>

        <div className="flex mt-2">
          <div className="font-700">RMSD [{"\u00C5"}]</div>
          <Tooltip
            tag={
              <div className="cursor-pointer ml-2">
                <img className="w-5" src={tooltipImg} />
              </div>
            }
            delayMsec={300}
          >
            RMSD between the reference NtC and actual geometry. For more see
            Help
          </Tooltip>
        </div>
        <div>
          {this.props.rmsdStats
            .slice(0, this.props.rmsdStats.length - 1)
            .map((s, idx, stats) => {
              const green = stats[0].rmsdThreshold; // First
              const red = stats[stats.length - 1].rmsdThreshold; // Last (mind that we sliced off the last element of the original array)
              const tprev = stats[idx - 1]?.rmsdThreshold ?? 0;
              const v =
                s.rmsdThreshold === -1
                  ? red + 0.1
                  : tprev + (s.rmsdThreshold - tprev) / 2.0;
              const clr = GappedSemaphore.toSemaphore(v, green, red, GSMapping);

              return (
                <div className="flex" key={idx}>
                  <div>Bellow</div>
                  <div
                    key={idx}
                    style={{
                      color: rgbToHex(clr),
                    }}
                  >
                    {`\u00A0${s.rmsdThreshold.toFixed(1)} Å :\u00A0${s.count}`}
                  </div>
                </div>
              );
            })}
          <div className="flex">
            <div>Over</div>
            <div style={{ color: rgbToHex(Rgb(255, 0, 0)) }}>
              {`\u00A0${this.props.rmsdStats[
                this.props.rmsdStats.length - 2
              ].rmsdThreshold.toFixed(1)} Å :\u00A0${
                this.props.rmsdStats[this.props.rmsdStats.length - 1].count
              }`}
            </div>
          </div>
        </div>
        <div />
        <div style={{ height: `${Common.BarHeightEm}em` }}>
          <StatsBar counts={rmsdCounts} colors={rmsdColors} />
        </div>
      </div>
    );
  }
}

export class OverallQuality extends View<View.Props> {
  static readonly unscrollableContainer = true;
  private winTracker = new WindowsTracker();

  render() {
    const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
    const modelIdxx =
      this.props.structureSelection.modelIndex === InvalidModelIndex
        ? 0
        : this.props.structureSelection.modelIndex;
    const confalAverage =
      this.props.dnatcofication.data.averageConfals[modelIdxx];
    const selfRef = React.createRef<HTMLDivElement>();

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

    const metrics = GlobalConfig.data().anglesLengths.summaryMetrics;

    const [overallAngles, overallLengths] = metrics === 'naval'
        ? [selected.overallAnglesNaval, selected.overallLengthsNaval]
        : [selected.overallAnglesProSco, selected.overallLengthsProSco];

    // These are currently only passed to download
    const countsAnglesProSco = SummarizeProSco.countsInGroups(selected.overallAnglesProSco);
    const countsLengthsProSco = SummarizeProSco.countsInGroups(selected.overallLengthsProSco);

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

    return (
      <div
        className="relative overflow-hidden h-full flex flex-col"
        ref={selfRef}
      >
        <div className="font-700 mb-2 p-2 text-center border-b border-primary-first">
          Backbone conformational quality
        </div>

        <Stats
          assigned={Cif.Column.value(overall.num_classified, 0)!}
          close={Cif.Column.value(overall.num_unclassified_rmsd_close, 0)!}
          unassigned={Cif.Column.value(overall.num_unclassified, 0)!}
          rmsdStats={this.props.dnatcofication.data.stepRmsdStats[modelIdxx]}
          confalAverage={confalAverage}
          confalPercentile={confalPercentile(confalAverage)}
        />

        <div className="font-700 mb-2 p-2 text-center border-b border-primary-first">
          Valence geometry quality
        </div>

        <OverallStatsBar
          downloadableData={DownloadableData(
            selected.angles,
            countsAnglesProSco,
            selected.lengths,
            countsLengthsProSco
          )}
          downloaders={StatsDownloaders}
          name={AnglesLengthsCommon.selectionName(
            this.props.dnatcofication,
            multipleModels,
            modelIdx,
            chain
          )}
          style={{ height: "4em" }}
        >
          <div className="flex flex-col">
            <div className="flex flex-1">
              {AnglesLengthsCommon.renderSubstructureStats(
                this.winTracker,
                "Lengths",
                AnglesLengthsCommon.substructureBarCaption("Lengths", DAnglesLengths.pGroupColor('common')),
                overallLengths,
                metrics === 'naval'
                  ? { kind: 'naval', counts: SummarizeNaval.countsInGroups(overallLengths) }
                  : { kind: 'prosco', counts: SummarizeProSco.countsInGroups(overallLengths) },
                htmlColorsForStatsBar
              )}
            </div>
            <div className="flex flex-1">
              {AnglesLengthsCommon.renderSubstructureStats(
                this.winTracker,
                "Angles",
                AnglesLengthsCommon.substructureBarCaption("Angles", DAnglesLengths.pGroupColor('common')),
                overallAngles,
                metrics === 'naval'
                  ? { kind: 'naval', counts: SummarizeNaval.countsInGroups(overallAngles) }
                  : { kind: 'prosco', counts: SummarizeProSco.countsInGroups(overallAngles) },
                htmlColorsForStatsBar
              )}
            </div>
          </div>
        </OverallStatsBar>
      </div>
    );
  }
}

export namespace OverallQuality {
  export const SelectionDisplayer = Validation.selectionDisplayer;
  export const SelectionMaker = Validation.selectionMaker;
}
