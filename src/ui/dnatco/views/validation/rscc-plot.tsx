import React from "react";
import Plot from "react-plotly.js";
import { Validation } from "./common";
import { ModelSelect } from "../structure-selectors";
import { View } from "../view";
import { Constants } from "../../constants";
import { RsccPlot as _RsccPlot } from "../../rscc-plot";
import { NamedList, NamedListItem } from "../../../common/named-list";
import { OkResult, isError, isOk } from "../../../../dnatco";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { Rscc } from "../../../../dnatco/rscc";
import { Logger } from "../../../../log/logger";
import {
  InvalidAtom,
  InvalidModelIndex,
  InvalidResidue,
} from "../../../../util/structure-selection";

interface State {
  stru: Rscc.StructureRscc;
  backdropAssigned: Rscc.BackdropRscc;
  backdropUnassigned: Rscc.BackdropRscc;
  fetchError: string | undefined;
}
export class RsccPlot extends View<View.Props, State> {
  constructor(props: View.Props) {
    super(props);

    this.state = {
      stru: {
        assigned: [],
        unassigned: [],
      },
      backdropAssigned: Rscc.emptyBackdropRscc(),
      backdropUnassigned: Rscc.emptyBackdropRscc(),
      fetchError: void 0,
    };
  }

  private async fetchRsccData() {
    const mIdx =
      this.props.structureSelection.modelIndex !== InvalidModelIndex
        ? 0
        : this.props.structureSelection.modelIndex;

    // WARN: This may trigger an error if the component unmounts before the request completes!!!
    // We will rewrite this code anyway so we can ignore this for the time being...

    const kinds = _RsccPlot.requestedKinds(mIdx, this.props.dnatcofication);

    const struRsccReq = Rscc.structureRscc(this.props.dnatcofication, mIdx);
    const backdropAssignedReq = Rscc.backdropRscc(kinds.assigned);
    const backdropUnassignedReq = Rscc.backdropRscc(kinds.unassigned);

    const struRsccRes = await struRsccReq;
    const backdropAssignedRes = await backdropAssignedReq;
    const backdropUnassignedRes = await backdropUnassignedReq;

    let fetchFailed = false;
    if (!isOk(struRsccRes)) {
      Logger.log(
        Logger.Severity.Warning,
        `Structure RSCC data error: ${struRsccRes.message}`
      );
      fetchFailed = true;
    }
    if (!isOk(backdropAssignedRes)) {
      Logger.log(
        Logger.Severity.Warning,
        `Backdrop-assigned RSCC data error: ${backdropAssignedRes.message}`
      );
      fetchFailed = true;
    }
    if (!isOk(backdropUnassignedRes)) {
      Logger.log(
        Logger.Severity.Warning,
        `Backdrop-unassigned RSCC data error: ${backdropUnassignedRes.message}`
      );
      fetchFailed = true;
    }

    if (fetchFailed) {
      this.setState({
        ...this.state,
        stru: { assigned: [], unassigned: [] },
        backdropAssigned: Rscc.emptyBackdropRscc(),
        backdropUnassigned: Rscc.emptyBackdropRscc(),
        fetchError: isError(struRsccRes)
          ? struRsccRes.message
          : "Unable to get RSCC data",
      });
    } else {
      this.setState({
        ...this.state,
        stru: (struRsccRes as OkResult<Rscc.StructureRscc>).data,
        backdropAssigned: (backdropAssignedRes as OkResult<Rscc.BackdropRscc>)
          .data,
        backdropUnassigned: (
          backdropUnassignedRes as OkResult<Rscc.BackdropRscc>
        ).data,
        fetchError: void 0,
      });
    }
  }

  private makePlotData(): {
    assigned: _RsccPlot.RsccPlotData;
    unassigned: _RsccPlot.RsccPlotData;
  } {
    const { stru, backdropAssigned, backdropUnassigned } = this.state;

    const assigned = _RsccPlot.makeData(
      stru.assigned,
      backdropAssigned,
      this.props.structureSelection.steps[0],
      this.props.dnatcofication
    );
    const unassigned = _RsccPlot.makeData(
      stru.unassigned,
      backdropUnassigned,
      this.props.structureSelection.steps[0],
      this.props.dnatcofication
    );

    return { assigned, unassigned };
  }

  private renderPlot(
    xy: _RsccPlot.RsccXYData,
    contour: _RsccPlot.RsccContourData
  ) {
    const data = _RsccPlot.makePlotlyData(xy, contour);

    return (
      <Plot
        data={data}
        layout={{
          autosize: true,
          dragmode: "pan",
          hovermode: "closest",
          xaxis: { title: { text: "RSCC" }, automargin: true },
          yaxis: { title: { text: "RMSD [Å]" }, automargin: true },
          plot_bgcolor: "white",
          paper_bgcolor: "white",
          uirevision: "true",
          margin: {
            t: 0,
            r: 25,
          },
          modebar: {
            orientation: "v",
          },
        }}
        config={{
          scrollZoom: true,
        }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
        onClick={(ev) => {
          const pt = ev.points[0];
          if (pt) {
            const datum = pt.customdata;
            if (typeof datum === "number") {
              const sel = RsccPlot.SelectionMaker(
                datum,
                InvalidResidue,
                InvalidAtom,
                this.props.structureSelection.steps,
                this.props.structureSelection.residues,
                this.props.structureSelection.atoms,
                this.props.dnatcofication
              );
              this.props.switching.changeSelection(
                sel,
                RsccPlot.SelectionDisplayer
              );
            }
          }
        }}
      />
    );
  }

  componentDidMount() {
    this.subscribe(this.props.switching.events.modelSwitched, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.switching.events.chainSwitched, () =>
      this.forceUpdate()
    );
    this.subscribe(this.props.switching.events.selectionChanged, () =>
      this.forceUpdate()
    );

    this.fetchRsccData();
  }

  componentDidUpdate(prevProps: View.Props) {
    if (
      prevProps.structureSelection.modelIndex !==
      this.props.structureSelection.modelIndex
    )
      this.fetchRsccData();
  }

  componentWillUnmount() {
    this.unsubscribeAll();
  }

  render() {
    const numModels = Dnatcofication.Structure.numberOfModels(
      this.props.dnatcofication
    );
    const rsccPlotData = this.makePlotData();

    return (
      <div className="flex flex-col h-full">
        {numModels > 1 ? (
          <NamedList sizing="min-content" rowSpacing="half">
            <NamedListItem name="Model">
              <ModelSelect
                dnatcofication={this.props.dnatcofication}
                structureSelection={this.props.structureSelection}
                switching={this.props.switching}
                hideAllModelsOption={true}
              />
            </NamedListItem>
          </NamedList>
        ) : undefined}

        <div className="rdo-secondary-caption">
          RSCC(*) vs RMSD plot of assigned steps
        </div>
        <div
          className="flex justify-center items-center flex-1"
          style={{ minHeight: Constants.MinimumFlexiblePlotHeight }}
        >
          {_RsccPlot.isPlotEmpty(rsccPlotData.assigned) ? (
            this.state.fetchError ? (
              <div>{this.state.fetchError && 'RSCC data not available'}</div>
            ) : (
              <div>There are no assigned steps in this structure</div>
            )
          ) : (
            this.renderPlot(
              rsccPlotData.assigned.xy,
              rsccPlotData.assigned.contour
            )
          )}
        </div>

        <div className="rdo-secondary-caption">
          RSCC(*) vs RMSD plot of unassigned steps
        </div>
        <div
          className="flex justify-center items-center flex-1"
          style={{ minHeight: Constants.MinimumFlexiblePlotHeight }}
        >
          {_RsccPlot.isPlotEmpty(rsccPlotData.unassigned) ? (
            this.state.fetchError ? (
              <div>{this.state.fetchError && 'RSCC data not available'}</div>
            ) : (
              <div>There are no unassigned steps in this structure</div>
            )
          ) : (
            this.renderPlot(
              rsccPlotData.unassigned.xy,
              rsccPlotData.unassigned.contour
            )
          )}
        </div>
      </div>
    );
  }
}

export namespace RsccPlot {
  export const SelectionDisplayer = Validation.selectionDisplayer;
  export const SelectionMaker = Validation.selectionMaker;
}
