import React from "react";
import { Annotation } from "./common";
import { ChainSelect, ModelSelect } from "../structure-selectors";
import { View } from "../view";
import { Colors } from "../../colors";
import { niceStepName } from "../../common";
import { setDynamicTableModelColumns } from "../../util";
import { SearchBox } from "../../search-box";
import { DynamicTable as DynamicTableComp } from "../../../common/dynamic-table";
import { IconButton } from "../../../common/push-button";
import { NamedList, NamedListItem } from "../../../common/named-list";
import { Tooltip } from "../../../common/tooltip";
import { MagnifyingGlassImg } from "../../../../assets/images";
import { Cif } from "../../../../cif";
import {
  NdbStructNtcStep,
  NdbStructNtcStepSummary,
} from "../../../../cif/categories/ndb-struct-ntc";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { Step } from "../../../../dnatco/step";
import { StepsMapper } from "../../../../dnatco/steps-mapper";
import { parseIntStrict } from "../../../../util";
import { DynamicTable } from "../../../../util/dynamic-table";
import {
  EmptyStructureSelection,
  InvalidAtom,
  InvalidChain,
  InvalidModelIndex,
  InvalidResidue,
  InvalidStepId,
  StructureSelection,
} from "../../../../util/structure-selection";

export class Conformation extends View<View.Props> {
  static readonly unscrollableContainer = true;
  private tableModel: DynamicTable.Model = new DynamicTable.Model([]);
  private tableTainer = React.createRef<HTMLDivElement>();
  private searchBoxOpen = false;

  private readonly Searching: SearchBox.Searching<Step> = {
    onRenderResult: (step) => (
      <div>
        {step.chainAuth} -{" "}
        {niceStepName(
          step,
          this.props.structureSelection.modelIndex === InvalidModelIndex
        )}
      </div>
    ),
    onSearch: (prompt) => {
      const toks = prompt.split(" ").slice(0, 2);
      const resNoAuth = parseIntStrict(toks.length === 2 ? toks[1] : toks[0]);
      const chainAuth = toks.length === 2 ? toks[0] : void 0;

      if (isNaN(resNoAuth)) return [];

      const modelIndex = this.props.structureSelection.modelIndex;
      const modelNum = this.modelNumFromIndex(modelIndex);
      const chain = this.props.structureSelection.chain;
      const filterFunc = (step: Step) => {
        return (
          (modelIndex === InvalidModelIndex || step.model === modelNum) &&
          (chain === InvalidChain || chain === step.chain)
        );
      };

      const results = [];
      for (const step of this.props.dnatcofication.data.steps.steps.filter(
        (x) => filterFunc(x)
      )) {
        if (step.resNo1Auth === resNoAuth) {
          if (chainAuth) {
            if (chainAuth === step.chain) results.push(step);
          } else results.push(step);
        }
      }

      return results;
    },
    onUseResult: (step) =>
      this.props.switching.changeSelection(
        Conformation.SelectionMaker(
          step.id,
          InvalidResidue,
          InvalidAtom,
          this.props.structureSelection.steps,
          this.props.structureSelection.residues,
          this.props.structureSelection.atoms,
          this.props.dnatcofication
        ),
        Conformation.SelectionDisplayer
      ),
  };

  private readonly SearchBoxProps: SearchBox.Props<Step> = {
    anchor: "top-left",
    xOffset: 32,
    yOffset: 32,
    caption: "Enter chain and residue no.\n(e.g. '2109' or 'B 2109')",
    onClose: () => (this.searchBoxOpen = false),
    searching: this.Searching,
  };

  constructor(props: View.Props) {
    super(props);

    this.setTableModel(EmptyStructureSelection(props.dnatcofication));
  }

  private makeTableModel(selectedModelNum: number, selectedChain?: string) {
    const steps = this.props.dnatcofication.table(NdbStructNtcStep);
    const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

    const { PDB_model_number, label_asym_id_1, auth_asym_id_1, name } = steps;
    const { assigned_NtC, assigned_CANA, closest_NtC, closest_CANA } = summary;

    const chainColumn: DynamicTable.Column<string> = {
      name: "Chain",
      cells: new Array<DynamicTable.Cell<string>>(),
      alignment: "center",
      tooltip: <div>PDB chain ID (author)</div>,
      headerStyle: {
        width: '50px'
      },
    };
    const stepColumn: DynamicTable.Column<string> = {
      name: "Step",
      cells: new Array<DynamicTable.Cell<string>>(),
      alignment: "center",
      notSortable: true,
      headerStyle: {
        width: '105px'
      },
      elem: (
        <div className="flex items-center justify-center gap-2">
          <Tooltip tag={<span>Step</span>} delayMsec={300}>
            Dinucleotide step identifier
          </Tooltip>
          <IconButton
            src={MagnifyingGlassImg}
            className="rdo-pushbutton h-6 w-6"
            onClick={() => {
              const tainer = this.tableTainer.current;
              if (!tainer || this.searchBoxOpen) return;

              this.searchBoxOpen = true;
              SearchBox.create(tainer, this.SearchBoxProps);
            }}
          />
        </div>
      ),
    };
    const ntcColumn: DynamicTable.Column<string> = {
      name: "NtC",
      cells: new Array<DynamicTable.Cell<string>>(),
      alignment: "center",
      headerStyle: {
        width: '45px'
      },
      tooltip: (
        <div>
          Di<span className="rdo-emphasize">N</span>ucleotide{" "}
          <span className="rdo-emphasize">C</span>onformational class
        </div>
      ),
    };
    const canaColumn: DynamicTable.Column<string> = {
      name: "CANA",
      cells: new Array<DynamicTable.Cell<string>>(),
      alignment: "center",
      tooltip: (
        <div>
          <span className="rdo-emphasize">C</span>onformational{" "}
          <span className="rdo-emphasize">A</span>lphabet of{" "}
          <span className="rdo-emphasize">N</span>ucleic{" "}
          <span className="rdo-emphasize">A</span>cids
        </div>
      ),
      headerStyle: {
        width: '50px'
      },
    };

    const columns = [chainColumn, stepColumn, ntcColumn, canaColumn];

    for (let row = 0; row < steps._rowCount; row++) {
      const modelNum = Cif.Column.value(PDB_model_number, row)!;
      if (
        selectedModelNum !== InvalidModelIndex &&
        selectedModelNum !== modelNum
      )
        continue;

      const chain = Cif.Column.value(label_asym_id_1, row)!;
      if (selectedChain && selectedChain !== chain) continue;

      const tag = Cif.Column.value(name, row)!;
      const tags = columns.map(() => tag);
      const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name
      const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
      const assignedCANA = Cif.Column.value(assigned_CANA, row)!;

      setDynamicTableModelColumns(
        this.tableModel,
        row,
        columns,
        tags,
        [
          Cif.Column.value(auth_asym_id_1, row)!,
          tag,
          assignedNtC,
          assignedCANA,
        ],
        [
          void 0,
          () => niceStepName(_step, selectedModelNum === InvalidModelIndex),
          () =>
            assignedNtC === "NANT" ? (
              <Tooltip
                tag={<span className="rdo-unassigned-ntc">NANT</span>}
                delayMsec={300}
              >
                This step is unassigned. Closest NtC is{" "}
                {Cif.Column.value(closest_NtC, row)!}.
              </Tooltip>
            ) : (
              <span>{assignedNtC}</span>
            ),
          () =>
            assignedCANA === "NAN" ? (
              <Tooltip
                tag={<span className="rdo-unassigned-ntc">NAN</span>}
                delayMsec={300}
              >
                This step is unassigned. Closest CANA is{" "}
                {Cif.Column.value(closest_CANA, row)!}.
              </Tooltip>
            ) : (
              <span>{assignedCANA}</span>
            ),
        ]
      );
    }

    return new DynamicTable.Model(columns);
  }

  private modelNumFromIndex(modelIndex: number) {
    return modelIndex !== InvalidModelIndex
      ? this.props.dnatcofication.data.structures[0].models[modelIndex].num
      : InvalidModelIndex;
  }

  private renderStepsTable() {
    const stepName =
      this.props.structureSelection.steps.length === 0
        ? ""
        : StepsMapper.byId(
            this.props.dnatcofication,
            this.props.structureSelection.steps[0]
          ).name;

    return (
      <DynamicTableComp
        model={this.tableModel}
        onCellClicked={(data, row, colName) => {
          const cIdx = this.tableModel.columnNames.findIndex(
            (cn) => cn === "Step"
          );
          if (cIdx === -1) return;

          const stepName = row[cIdx].data;
          const stepId =
            StepsMapper.byName(this.props.dnatcofication, stepName)?.id ??
            InvalidStepId;
          if (stepId !== InvalidStepId)
            this.props.switching.changeSelection(
              Conformation.SelectionMaker(
                stepId,
                InvalidResidue,
                InvalidAtom,
                this.props.structureSelection.steps,
                this.props.structureSelection.residues,
                this.props.structureSelection.atoms,
                this.props.dnatcofication
              ),
              Conformation.SelectionDisplayer
            );
        }}
        highlightedTag={stepName}
        highlightColor={Colors.CurrentStep()}
        scrollTainer={this.tableTainer.current ?? void 0}
        style="wide"
      />
    );
  }

  private setTableModel(sel: StructureSelection) {
    const modelNum = this.modelNumFromIndex(sel.modelIndex);
    this.tableModel = this.makeTableModel(
      modelNum,
      sel.chain === InvalidChain ? void 0 : sel.chain
    );
  }

  componentDidMount() {
    this.subscribe(this.props.dnatcofication.events.structureChanged, () =>
      this.setTableModel(EmptyStructureSelection(this.props.dnatcofication))
    );
    this.subscribe(this.props.switching.events.modelSwitched, (sel) => {
      this.setTableModel(sel);
      this.forceUpdate();
    });
    this.subscribe(this.props.switching.events.chainSwitched, (sel) => {
      this.setTableModel(sel);
      this.forceUpdate();
    });
    this.subscribe(this.props.switching.events.selectionChanged, (sel) => {
      this.setTableModel(sel);
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribeAll();
  }

  render() {
    const numModels = Dnatcofication.Structure.numberOfModels(
      this.props.dnatcofication
    );
    
    const numChains = this.props.dnatcofication.data.steps.chains[0].size;

    const selfRef = React.createRef<HTMLDivElement>();

    return (
      <div
        className="relative overflow-hidden h-full flex flex-col"
        ref={selfRef}
      >
        <div className="font-700 mb-2 p-2 text-center border-b border-primary-first">
          Conformation
        </div>

        <NamedList sizing="min-content" rowSpacing="half">
          {numModels > 1 && (
            <NamedListItem name="Model">
              <ModelSelect
                dnatcofication={this.props.dnatcofication}
                structureSelection={this.props.structureSelection}
                switching={this.props.switching}
              />
            </NamedListItem>
          )}
          {numChains > 1 && (
            <NamedListItem name="Chain">
              <ChainSelect
                dnatcofication={this.props.dnatcofication}
                structureSelection={this.props.structureSelection}
                switching={this.props.switching}
              />
            </NamedListItem>
          )}
        </NamedList>
        <div className="rdo-line-spacer" />

        <div className="rdo-secondary-caption">
          Table of assigned dinucleotide NtC classes
        </div>
        <div className="overflow-hidden flex-1" ref={this.tableTainer}>
          <div className="rdo-scroll-vertically-with-scrollbar-none">
            {this.renderStepsTable()}
          </div>
        </div>
      </div>
    );
  }
}

export namespace Conformation {
  export const SelectionDisplayer = Annotation.selectionDisplayer;
  export const SelectionMaker = Annotation.selectionMaker;
}
