import React from "react";
import { Refinement } from "./common";
import { CustomNtCSets } from "./custom-ntc-sets";
import { ChainSelect, ModelSelect } from "../structure-selectors";
import { View } from "../view";
import { Colors } from "../../colors";
import { niceStepName } from "../../common";
import { SearchBox } from "../../search-box";
import { setDynamicTableModelColumns } from "../../util";
import { DynamicTable as DynamicTableComp } from "../../../common/dynamic-table";
import { NamedList, NamedListItem } from "../../../common/named-list";
import { IconButton } from "../../../common/push-button";
import { Tooltip } from "../../../common/tooltip";
import { MagnifyingGlassImg, XImg } from "../../../../assets/images";
import { Cif } from "../../../../cif";
import {
  NdbStructNtcStep,
  NdbStructNtcStepSummary,
} from "../../../../cif/categories/ndb-struct-ntc";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { NtC } from "../../../../dnatco/ntc";
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

export class ChangeNtCs extends View<Refinement.Props> {
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
            if (chainAuth === step.chainAuth) results.push(step);
          } else results.push(step);
        }
      }

      return results;
    },
    onUseResult: (step) =>
      this.props.switching.changeSelection(
        ChangeNtCs.SelectionMaker(
          step.id,
          InvalidResidue,
          InvalidAtom,
          this.props.structureSelection.steps,
          this.props.structureSelection.residues,
          this.props.structureSelection.atoms,
          this.props.dnatcofication
        ),
        ChangeNtCs.SelectionDisplayer
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

  constructor(props: Refinement.Props) {
    super(props);

    this.setTableModel(EmptyStructureSelection(props.dnatcofication));
  }

  private makeTableModel(selectedModelNum: number, selectedChain?: string) {
    const steps = this.props.dnatcofication.table(NdbStructNtcStep);
    const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

    const { PDB_model_number, label_asym_id_1, auth_asym_id_1, name } = steps;
    const { assigned_NtC, closest_NtC } = summary;

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
        width: '100px'
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
    const computedNtCColumn: DynamicTable.Column<string> = {
      name: "Computed NtC",
      cells: new Array<DynamicTable.Cell<string>>(),
      alignment: "center",
      headerStyle: {
        width: '75px'
      },
      tooltip: (
        <div>
          Di<span className="rdo-emphasize">N</span>ucleotide{" "}
          <span className="rdo-emphasize">C</span>onformational class
        </div>
      ),
    };
    const customNtCColumn: DynamicTable.Column<string> = {
      name: "Custom NtC",
      cells: new Array<DynamicTable.Cell<string>>(),
      notSortable: true,
      headerStyle: {
        width: '130px'
      },
      tooltip: (
        <div>
          Di<span className="rdo-emphasize">N</span>ucleotide{" "}
          <span className="rdo-emphasize">C</span>onformational class
        </div>
      ),
    };

    const makeSelCell =
      this.props.selectedCustomNtCSet === ""
        ? () => <div className="text-center h-6">(Not changeable)</div>
        : (row: number) => {
            const step = Cif.Column.value(name, row)!;
            const computedNtC = Cif.Column.value(
              closest_NtC,
              row
            )! as NtC.ValidClass; // closest_NtC will must always be something
            const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(
              this.props.selectedCustomNtCSet,
              step
            );
            return (
              <div className="grid gap-2 [grid-template-columns:auto_2em_1fr]">
                <Refinement.NtCSelector
                  value={customNtC ?? computedNtC}
                  onChanged={(v) => {
                    this.props.dnatcofication.customNtCs.setCustomNtC(
                      this.props.selectedCustomNtCSet,
                      step,
                      v
                    );
                  }}
                />
                {customNtC ? (
                  <IconButton
                    src={XImg}
                    onClick={() =>
                      this.props.dnatcofication.customNtCs.deleteCustomNtC(
                        this.props.selectedCustomNtCSet,
                        step
                      )
                    }
                    className="rdo-icon-text-button"
                  />
                ) : (
                  <div />
                )}
                <div />
              </div>
            );
          };

    const columns = [
      chainColumn,
      stepColumn,
      computedNtCColumn,
      customNtCColumn,
    ];

    for (let row = 0; row < steps._rowCount; row++) {
      const modelNum = Cif.Column.value(PDB_model_number, row)!;
      if (selectedModelNum !== -1 && selectedModelNum !== modelNum) continue;

      const chain = Cif.Column.value(label_asym_id_1, row)!;
      if (selectedChain && selectedChain !== chain) continue;

      const tag = Cif.Column.value(name, row)!;
      const tags = [tag, tag, tag, void 0];
      const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name
      const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
      const computedNtC = Cif.Column.value(closest_NtC, row)!;
      const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(
        this.props.selectedCustomNtCSet,
        tag
      );
      const modelCustomNtC = `${this.props.selectedCustomNtCSet}-${
        customNtC ? customNtC : computedNtC
      }`;

      setDynamicTableModelColumns(
        this.tableModel,
        row,
        columns,
        tags,
        [
          Cif.Column.value(auth_asym_id_1, row)!,
          tag,
          assignedNtC,
          modelCustomNtC,
        ],
        [
          void 0,
          () => niceStepName(_step),
          () =>
            assignedNtC === "NANT" ? (
              <Tooltip
                tag={
                  <span className="text-secondary-third">
                    {Cif.Column.value(closest_NtC, row)!}
                  </span>
                }
                delayMsec={300}
              >
                This step is unassigned. Closest NtC is shown instead.
              </Tooltip>
            ) : (
              <span>{assignedNtC}</span>
            ),
          () => <div className="m-auto w-36">{makeSelCell(row)}</div>,
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
          if (colName === "Custom NtC") return;

          const cIdx = this.tableModel.columnNames.findIndex(
            (cn) => cn === "Step"
          );
          if (cIdx === -1) return;

          const stepName = row[cIdx].data;
          const stepId =
            StepsMapper.byName(this.props.dnatcofication, stepName)?.id ??
            InvalidStepId;
          if (stepId !== InvalidStepId) {
            const sel = ChangeNtCs.SelectionMaker(
              stepId,
              InvalidResidue,
              InvalidAtom,
              this.props.structureSelection.steps,
              this.props.structureSelection.residues,
              this.props.structureSelection.atoms,
              this.props.dnatcofication
            );
            this.props.switching.changeSelection(
              sel,
              ChangeNtCs.SelectionDisplayer
            );
          }
        }}
        highlightedTag={stepName}
        highlightColor={Colors.CurrentStep()}
        scrollTainer={this.tableTainer.current ?? void 0}
        style="wide"
        modelsAlwaysCompareFalse
      />
    );
  }

  private setTableModel(sel: StructureSelection) {
    const modelNum =
      sel.modelIndex !== InvalidModelIndex
        ? this.props.dnatcofication.data.structures[0].models[sel.modelIndex]
            .num
        : InvalidModelIndex;
    this.tableModel = this.makeTableModel(
      modelNum,
      sel.chain === InvalidChain ? void 0 : sel.chain
    );
  }

  componentDidMount() {
    this.subscribe(
      this.props.dnatcofication.customNtCs.events.setChanged,
      (update) => {
        if (update.set === this.props.selectedCustomNtCSet) {
          const sel = this.props.structureSelection;
          this.setTableModel(sel);
          this.forceUpdate();
        }
      }
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

  componentDidUpdate(prevProps: Refinement.Props) {
    if (this.props.selectedCustomNtCSet !== prevProps.selectedCustomNtCSet) {
      const sel = this.props.structureSelection;
      this.setTableModel(sel);
      this.forceUpdate();
    }
  }

  componentWillUnmount() {
    this.unsubscribeAll();
  }

  render() {
    const numModels = Dnatcofication.Structure.numberOfModels(
      this.props.dnatcofication
    );
    const numChains = this.props.dnatcofication.data.steps.chains[0].size;

    return (
      <div className="overflow-hidden h-full flex flex-col">
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

        <div className="h-4" />

        <CustomNtCSets
          customNtCs={this.props.dnatcofication.customNtCs}
          selectedSet={this.props.selectedCustomNtCSet}
          onSetChanged={this.props.onCustomNtCSetChanged}
        />

        <div className="h-4" />
        <div className="overflow-hidden flex-1" ref={this.tableTainer}>
          <div className="rdo-scroll-vertically-with-scrollbar">
            {this.renderStepsTable()}
          </div>
        </div>
      </div>
    );
  }
}

export namespace ChangeNtCs {
  export const SelectionDisplayer = Refinement.selectionDisplayer;
  export const SelectionMaker = Refinement.selectionMaker;
}
