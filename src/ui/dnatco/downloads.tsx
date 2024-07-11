// @ts-ignore DefinitelyTyped does not have definitions for this flavor of plotly.js. Sadge...
import { type PlotData } from "plotly.js-cartesian-dist";
import React from "react";
import { Navigate } from "react-router";
import { Downloads as _Downloads } from "./downloads-common";
import { RsccPlot } from "./rscc-plot";
import { modelOptions } from "./views/structure-selectors";
import { CheckBox } from "../common/check-box";
import { ComboBox } from "../common/combo-box";
import { InProgressSpinner } from "../common/in-progress-spinner";
import { Popup } from "../common/popup";
import { toComboBoxOptions } from "../util";
import { doDownload } from "../../browser-util/downloader";
import { Net } from "../../browser-util/net";
import {
  SerializeByCompound,
  SerializeByResidue,
} from "../../dnatco/angles-lengths/serialize";
import { isOk } from "../../dnatco";
import { Summarize } from "../../dnatco/angles-lengths/summarize";
import { Dnatcofication } from "../../dnatco/dnatcofication";
import { Naval } from "../../dnatco/naval";
import { Rscc } from "../../dnatco/rscc";
import { Report } from "../../report";
import { objKeys } from "../../util";
import { FileTypes } from "../../util/file-type";
import { ImageSerialization } from "../../util/image-serialization";
import { Serialization } from "../../util/serialization";
import { GlobalConfig } from "../../global-config";
import { arrowDown, arrowDownHover } from "../../assets/images";
import { DownloadButtonComponent } from "./common";

type ReportGenerationState = "none" | "generating";

async function checkRsccRmsdAvailability(d: Dnatcofication) {
  const availability = new Array<{ assigned: boolean; unassigned: boolean }>();

  for (let mIdx = 0; mIdx < d.data.structures[0].models.length; mIdx++) {
    // Hopefully the browser will cache the RsccList that may have
    // to be fetched from a remote source.

    const res = await Rscc.structureRscc(d, mIdx);
    if (!isOk(res)) {
      availability.push({ assigned: false, unassigned: false });
    } else {
      availability.push({
        assigned: res.data.assigned.length > 0,
        unassigned: res.data.unassigned.length > 0,
      });
    }
  }

  return availability;
}

function downloadAnglesLengthsByCompound(
  structureName: string,
  fileType: keyof typeof FileTypes,
  d: Dnatcofication
) {
  const multipleModels = Dnatcofication.Structure.numberOfModels(d) > 1;
  const data = d.data.almByCompound.models.get(
    multipleModels ? -1 : d.data.structures[0].models[0].num
  );
  if (!data) return;

  const countsAngles = Summarize.countsInGroups(data.overallAngles);
  const countsLengths = Summarize.countsInGroups(data.overallLengths);

  const angles = objKeys(data.angles).flatMap((k) =>
    Array.from(data.angles[k].byMetric.values()).map((x) => x.individual)
  );
  const lengths = objKeys(data.lengths).flatMap((k) =>
    Array.from(data.lengths[k].byMetric.values()).map((x) => x.individual)
  );

  const text =
    fileType === "csv"
      ? SerializeByCompound.toCsv(angles, countsAngles, lengths, countsLengths)
      : SerializeByCompound.toJson(
          angles,
          countsAngles,
          lengths,
          countsLengths
        );

  doDownload(
    `${structureName}_angles_lengths_by_compound`,
    text,
    FileTypes[fileType]
  );
}

function downloadAnglesLengthsByResidue(
  structureName: string,
  fileType: keyof typeof FileTypes,
  d: Dnatcofication
) {
  const residues = d.data.almByResidue.residues;
  const summary = Summarize.substructure(residues);

  const countsAngles = Summarize.countsInGroups(summary.angles);
  const countsLenghts = Summarize.countsInGroups(summary.lengths);
  const text =
    fileType === "csv"
      ? SerializeByResidue.toCsv(
          countsAngles,
          countsLenghts,
          residues,
          d.data.almByResidue.stats
        )
      : SerializeByResidue.toJson(
          countsAngles,
          countsLenghts,
          residues,
          d.data.almByResidue.stats
        );

  doDownload(
    `${structureName}_angles_lengths_by_residue`,
    text,
    FileTypes[fileType]
  );
}

async function downloadRsccPlot(
  kind: "assigned" | "unassinged",
  structureName: string,
  modelIndex: number,
  d: Dnatcofication
) {
  const rqKinds = RsccPlot.requestedKinds(modelIndex, d);

  const struRsccReq = Rscc.structureRscc(d, modelIndex);
  const backdropReq =
    kind === "assigned"
      ? Rscc.backdropRscc(rqKinds.assigned)
      : Rscc.backdropRscc(rqKinds.unassigned);

  const struRsccRes = await struRsccReq;
  const backdropRes = await backdropReq;

  if (!isOk(struRsccRes)) {
    Popup.create(
      <div>
        <div className="text-secondary-third">
          Cannot fetch RSCC data for the structure
        </div>
        <div className="text-secondary-third">{struRsccRes.message}</div>
      </div>
    );
    return;
  }
  if (!isOk(backdropRes)) {
    Popup.create(
      <div>
        <div className="text-secondary-third">
          Cannot fetch RSCC backdrop for the structure
        </div>
        <div className="text-secondary-third">{backdropRes.message}</div>
      </div>
    );
    return;
  }

  const struData =
    kind === "assigned"
      ? struRsccRes.data.assigned
      : struRsccRes.data.unassigned;
  const backdropData = backdropRes.data;
  const plotData = RsccPlot.makeData(struData, backdropData, void 0, d);

  if (RsccPlot.isPlotEmpty(plotData)) {
    Popup.create(
      <div className="text-secondary-third">{`No ${kind} RSCC data is available for this structure`}</div>
    );
    return;
  }

  const layout = {
    title: `${structureName} ${kind}`,
    xaxis: { title: "RSCC", automargin: true },
    yaxis: { title: "RMSD [Å]", automargin: true },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
  };

  const plotlyData = RsccPlot.makePlotlyData(
    plotData.xy,
    plotData.contour,
    true,
    false
  ) as PlotData[];
  const img = await ImageSerialization.toImage(
    plotlyData,
    layout,
    1000,
    1000,
    "svg"
  );
  doDownload(`${structureName}_rscc_rmsd_${kind}`, img, FileTypes.svgXml);
}

function RsccRmsdDownload(props: { d: Dnatcofication; structureName: string }) {
  const [availability, setAvailability] = React.useState<
    Array<{ assigned: boolean; unassigned: boolean }>
  >([]);
  const [modelIndex, setModelIndex] = React.useState("0");

  React.useEffect(() => {
    checkRsccRmsdAvailability(props.d).then((avail) => {
      setAvailability(avail);
    });
  }, []);

  if (availability.length === 0) {
    return (
      <div className="flex flex-row gap-4 content-center">
        Checking availability... <InProgressSpinner />{" "}
      </div>
    );
  } else {
    const mIdx = parseInt(modelIndex);
    const haveAssigned = availability[mIdx].assigned;
    const haveUnassigned = availability[mIdx].unassigned;

    return (
      <_Downloads.DownloadBox>
        <div className="flex items-center h-full">
          <div className="font-700">Model</div>
        </div>
        <ComboBox
          options={toComboBoxOptions(modelOptions(props.d, true), (o) => ({
            caption: o.name,
            value: o.index.toString(),
          }))}
          value={modelIndex}
          onChange={(v) => setModelIndex(v)}
        />
        {haveAssigned ? (
          <DownloadButtonComponent
            title="Assigned NtCs"
            defaultImage={arrowDown as string}
            hoverImage={arrowDownHover as string}
            onClick={() =>
              downloadRsccPlot(
                "assigned",
                props.structureName,
                parseInt(modelIndex),
                props.d
              )
            }
          />
        ) : (
          <div className="flex items-center h-full whitespace-nowrap">
            (No assigned NtCs)
          </div>
        )}
        {haveUnassigned ? (
          <DownloadButtonComponent
            title="Unassigned NtCs"
            defaultImage={arrowDown as string}
            hoverImage={arrowDownHover as string}
            onClick={() =>
              downloadRsccPlot(
                "unassinged",
                props.structureName,
                parseInt(modelIndex),
                props.d
              )
            }
          />
        ) : (
          <div className="flex items-center h-full whitespace-nowrap">
            (No unassigned NtCs)
          </div>
        )}
      </_Downloads.DownloadBox>
    );
  }
}

export function Downloads(props: { dnatcofication: Dnatcofication }) {
  if (props.dnatcofication.isEmpty()) return <Navigate to="/app" />;

  // We need this shinanegan because unhiding a scrollbar with default appearance
  // in Chrome is a topic for two Ph.D. theses.
  const [listAllDinus, setListAllDinus] = React.useState(false);

  // Report generation may take a little while and the user needs to know
  // that the browser is doing a thing
  const [reportGenerationState, setReportGenerationState] = React.useState(
    "none" as ReportGenerationState
  );

  const structureName =
    props.dnatcofication.identifyingName ?? props.dnatcofication.pdbId;

  return (
    <div className="rdo-offset">
      <div className="overflow-hidden h-full flex flex-col m-auto xl:max-w-[1280px] 2xl:max-w-[1440px]">
        <div className="text-22px uppercase font-700 mb-4">
          Download of data computed for {structureName}
        </div>
        <div className="rdo-scroll-vertically">
          <div className="flex justify-between border-t-secondary-second border-t mt-4 pt-3 mb-8">
            <div>
              <_Downloads.Title title="Extended mmCIF file" />
              <div className="text-16px mb-2">
                mmCIF file extended with additional DNATCO categories.
              </div>
            </div>
            <DownloadButtonComponent
              title="Download"
              defaultImage={arrowDown as string}
              hoverImage={arrowDownHover as string}
              onClick={() => _Downloads.serveMmCif(props.dnatcofication)}
            />
          </div>

          <div className="flex justify-between border-t-secondary-second border-t pt-3 mb-8">
            <div>
              <_Downloads.Title title="Table of assigned NtCs" />
              <div className="text-16px mb-2">Table of assigned NtCs.</div>
            </div>
            <div className="flex">
              <DownloadButtonComponent
                title="CSV"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() => {
                  const t = _Downloads.assignmentTable(
                    props.dnatcofication,
                    false
                  );
                  const text = Serialization.table(t, "csv");
                  Net.serveFile(
                    FileTypes.csv.mimeType,
                    text,
                    `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.csv.suffix}`
                  );
                }}
              />
              <DownloadButtonComponent
                title="JSON"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() => {
                  const t = _Downloads.assignmentTable(
                    props.dnatcofication,
                    false
                  );
                  const text = Serialization.table(t, "json");
                  Net.serveFile(
                    FileTypes.json.mimeType,
                    text,
                    `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.json.suffix}`
                  );
                }}
              />
              <DownloadButtonComponent
                title="CSV (with CS & RMSD)"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() => {
                  const t = _Downloads.assignmentTable(
                    props.dnatcofication,
                    true
                  );
                  const text = Serialization.table(t, "csv");
                  Net.serveFile(
                    FileTypes.csv.mimeType,
                    text,
                    `${props.dnatcofication.identifyingName}_assigned_ntcs_cs_rmsd.${FileTypes.csv.suffix}`
                  );
                }}
              />
              <DownloadButtonComponent
                title="JSON (with CS & RMSD)"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() => {
                  const t = _Downloads.assignmentTable(
                    props.dnatcofication,
                    true
                  );
                  const text = Serialization.table(t, "json");
                  Net.serveFile(
                    FileTypes.json.mimeType,
                    text,
                    `${props.dnatcofication.identifyingName}_assigned_ntcs_cs_rmsd.${FileTypes.json.suffix}`
                  );
                }}
              />
            </div>
          </div>

          <div className="flex justify-between border-t-secondary-second border-t pt-3 mb-8">
            <div>
              <_Downloads.Title title="List of bond lengths and angles (Individual residues)" />
              <div className="text-16px mb-2">
                A list of measured bond lengths and bond angles measured for
                nucleic acid backbone and base atoms. Listed by individual
                residues. Only residues with standard bases are measured.
              </div>
            </div>
            <div className="flex">
              <DownloadButtonComponent
                title="CSV"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  downloadAnglesLengthsByResidue(
                    structureName,
                    "csv",
                    props.dnatcofication
                  )
                }
              />
              <DownloadButtonComponent
                title="JSON"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  downloadAnglesLengthsByResidue(
                    structureName,
                    "json",
                    props.dnatcofication
                  )
                }
              />
            </div>
          </div>

          <div className="flex justify-between border-t-secondary-second border-t pt-3 mb-8">
            <div>
              <_Downloads.Title title="List of bond lengths and angles (Nucleotide type)" />
              <div className="text-16px mb-2">
                A list of measured bond lengths and bond angles measured for
                nucleic acid backbone and base atoms. Listed by nucleotide type.
                Only residues with standard bases are measured.
              </div>
            </div>
            <div className="flex">
              <DownloadButtonComponent
                title="CSV"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  downloadAnglesLengthsByCompound(
                    structureName,
                    "csv",
                    props.dnatcofication
                  )
                }
              />
              <DownloadButtonComponent
                title="JSON"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  downloadAnglesLengthsByCompound(
                    structureName,
                    "json",
                    props.dnatcofication
                  )
                }
              />
            </div>
          </div>

          <div className="flex justify-between border-t-secondary-second border-t pt-3 mb-8">
            <div>
              <_Downloads.Title title="Naval validation reports" />
              <div className="text-16px mb-2">
                Naval validation reports of nucleic acid structure quality.
              </div>
            </div>
            <div className="flex">
              <DownloadButtonComponent
                title="Bond lengths"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  Net.serveFile(
                    FileTypes.csv.mimeType,
                    Naval.bondsAsCsv(
                      props.dnatcofication.data.naval.bonds,
                      ","
                    ),
                    `${structureName}_naval_bonds_report.${FileTypes.csv.suffix}`
                  )
                }
              />
              <DownloadButtonComponent
                title="Bond angles"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  Net.serveFile(
                    FileTypes.csv.mimeType,
                    Naval.anglesAsCsv(
                      props.dnatcofication.data.naval.angles,
                      ","
                    ),
                    `${structureName}_naval_angles_report.${FileTypes.csv.suffix}`
                  )
                }
              />
              <DownloadButtonComponent
                title="Geometry"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() =>
                  Net.serveFile(
                    FileTypes.csv.mimeType,
                    Naval.geometryAsCsv(
                      props.dnatcofication.data.naval.geometry,
                      ","
                    ),
                    `${structureName}_naval_geometry_report.${FileTypes.csv.suffix}`
                  )
                }
              />
            </div>
          </div>

          <div className="flex justify-between border-t-secondary-second border-t pt-3 mb-8">
            <_Downloads.Title title="RSCC vs. RMSD plots" />
            <RsccRmsdDownload
              structureName={structureName}
              d={props.dnatcofication}
            />
          </div>

          <div className="flex justify-between border-t-secondary-second border-t pt-3 mb-8">
            <div>
              <_Downloads.Title
                title={`${
                  GlobalConfig.data().displayedProductName
                } structure validation report`}
              />
              <div className="text-16px mb-2">
                Comprehensive structure validation report.
              </div>
            </div>
            <div className="flex">
              <DownloadButtonComponent
                title="PDF"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() => {
                  setReportGenerationState("generating");
                  Report.pdf(props.dnatcofication, {
                    completeStepsTable: listAllDinus,
                    href: Net.href(),
                  })
                    .then((report) => {
                      Net.serveFileRaw(
                        FileTypes.pdf.mimeType,
                        report,
                        `${
                          props.dnatcofication.pdbId
                        }_${GlobalConfig.data().displayedProductName.toLowerCase()}_validation_report.${
                          FileTypes.pdf.suffix
                        }`
                      );
                      setReportGenerationState("none");
                    })
                    .catch((e) => {
                      setReportGenerationState("none");
                      Popup.create(
                        <div className="text-secondary-third">
                          Could not create validation report:{" "}
                          {(e as Error).message}
                        </div>
                      );
                    });
                }}
              />
              <DownloadButtonComponent
                title="Plain text"
                defaultImage={arrowDown as string}
                hoverImage={arrowDownHover as string}
                onClick={() => {
                  setReportGenerationState("generating");
                  Report.text(props.dnatcofication, {
                    completeStepsTable: listAllDinus,
                    href: Net.href(),
                  })
                    .then((report) => {
                      Net.serveFile(
                        FileTypes.text.mimeType,
                        report,
                        `${
                          props.dnatcofication.pdbId
                        }_${GlobalConfig.data().displayedProductName.toLowerCase()}_validation_report.${
                          FileTypes.text.suffix
                        }`
                      );
                      setReportGenerationState("none");
                    })
                    .catch((e) => {
                      setReportGenerationState("none");
                      Popup.create(
                        <div className="text-secondary-third">
                          Could not create validation report:{" "}
                          {(e as Error).message}
                        </div>
                      );
                    });
                }}
              />
              <div className="flex items-center h-full ml-2">
                <CheckBox
                  caption="List all dinucleotides in the report"
                  checked={listAllDinus}
                  onChanged={(checked) => setListAllDinus(checked)}
                />
              </div>
            </div>
            {reportGenerationState !== "none" ? (
              <div>Generating report. This may take a little while...</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
