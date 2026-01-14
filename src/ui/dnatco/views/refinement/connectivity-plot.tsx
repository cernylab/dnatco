import React from 'react';
import Plot from 'react-plotly.js';
import { getNtC, Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { PlotPointsLegend } from '../../plot-points-legend';
import { EmptySelectionPieces } from '../../structure-selection';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Cif } from '../../../../cif';
import { AtomSite } from '../../../../cif/categories/atom-site';
import { Colors } from '../../../dnatco/colors';
import { Constants } from '../../../dnatco/constants';
import { calculateConnectivities } from '../../../../dnatco/connectivity-similarity';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { NtC } from '../../../../dnatco/ntc';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { axesMaximumHints } from '../../util';
import { colorToRgb, rgbToHex } from '../../../../util/colors';
import { objKeys } from '../../../../util';
import { valueToSemaphore } from '../../../../util/semaphore';
import { InvalidModelIndex, InvalidChain, InvalidAtom, InvalidResidue, InvalidStepId, StructureSelection } from '../../../../util/structure-selection';

import { InputDialog } from "../../../common/input-dialog";
import { DynamicTable } from "../../../../util/dynamic-table";
import { ChangeNtCs } from "./change-ntcs";
import { DynamicTable as DynamicTableComp } from "../../../common/dynamic-table";
import { NdbStructNtcStep, NdbStructNtcStepSummary } from "../../../../cif/categories/ndb-struct-ntc";
import { setDynamicTableModelColumns } from "../../util";
import { niceStepName } from "../../common";
import { Tooltip } from "../../../common/tooltip";

const MinNumberOfPointsInPlot = 10;
const CellBgAlpha = 0.5;

function rmsdToColor(rmsd: number): React.CSSProperties {
    const clr = valueToSemaphore(rmsd, Constants.GreenRMSD, Constants.RedRMSD);
    return { backgroundColor: `rgba(${clr.r},${clr.g},${clr.b},${CellBgAlpha})` };
}

const PlotData = {
    x: new Array<number>(),
    y: new Array<number>(),
    colors: new Array<string>(),
    tags: new Array<string>(),

    xSel: new Array<number>(),
    ySel: new Array<number>(),
    colorsSel: new Array<string>(),
    tagsSel: new Array<string>(),

    xComputed: new Array<number>(),
    yComputed: new Array<number>(),
    colorsComputed: new Array<string>(),
    tagsComputed: new Array<string>(),
};
type PlotData = typeof PlotData;

export class ConnectivityPlot extends View<Refinement.Props> {
    private connectivityPlotData(centerStepId: number, surroundingStepId: number, direction: 'previous' | 'next'): PlotData {
        const x = new Array<number>();
        const y = new Array<number>();
        const colors = new Array<string>();
        const tags = new Array<string>();

        const xSel = new Array<number>();
        const ySel = new Array<number>();
        const colorsSel =new Array<string>();
        const tagsSel = new Array<string>();

        const xComputed = new Array<number>();
        const yComputed = new Array<number>();
        const colorsComputed =new Array<string>();
        const tagsComputed = new Array<string>();

        if (surroundingStepId == InvalidStepId) {
            return {
                x, y, colors, tags,
                xSel, ySel, colorsSel, tagsSel,
                xComputed, yComputed, colorsComputed, tagsComputed
            };
        }

        const s = this.props.dnatcofication.data.steps.steps;

        const centerIdx = StepsMapper.idToIndex(this.props.dnatcofication, centerStepId);
        const centerStep = Step.clone(s[centerIdx]); // We may need to modify the step props
        const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, centerStep.name);

        // calculateConnectivities() checks against closestNtC. We need to replace it with the user's choice
        // if there is a custom NtC set
        if (customNtC)
            centerStep.closestNtC = customNtC;

        const prevStepIdx = direction == 'previous' ? this.props.dnatcofication.data.steps.previous[centerIdx] : -1;
        const nextStepIdx = direction == 'next' ? this.props.dnatcofication.data.steps.next[centerIdx] : -1;

        const { backward, forward } = calculateConnectivities(
            centerStep,
            prevStepIdx !== -1 ? this.props.dnatcofication.data.steps.steps[prevStepIdx] : void 0,
            nextStepIdx !== -1 ? this.props.dnatcofication.data.steps.steps[nextStepIdx] : void 0,
            Cif.File.table(this.props.dnatcofication.data.cifData!, AtomSite, 0)
        );

        const conns = direction == 'previous' ? backward : forward;
        const otherStep = direction === 'previous'
            ? prevStepIdx !== -1
                ? s[prevStepIdx] : void 0
            : nextStepIdx !== -1
                ? s[nextStepIdx] : void 0;

        const otherStepSelectedNtC = otherStep
            ? this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, otherStep.name) ?? otherStep.closestNtC
            : void 0;

        if (conns) {
            const clr = rgbToHex(colorToRgb(direction == 'previous' ? Colors.PreviousStep() : Colors.NextStep()));
            for (const ntc of objKeys(conns)) {
                const conn = conns[ntc];

                if (ntc === otherStepSelectedNtC) {
                    xSel.push(conn.C5PrimeDistance);
                    ySel.push(conn.O3PrimeDistance);
                    colorsSel.push(clr);
                    tagsSel.push(ntc);
                } else if (otherStep && ntc === otherStep.closestNtC) {
                    xComputed.push(conn.C5PrimeDistance);
                    yComputed.push(conn.O3PrimeDistance);
                    colorsComputed.push(clr);
                    tagsComputed.push(ntc);
                } else {
                    x.push(conn.C5PrimeDistance);
                    y.push(conn.O3PrimeDistance);
                    colors.push(clr);
                    tags.push(ntc);
                }
            }
        }

        return {
            x, y, colors, tags,
            xSel, ySel, colorsSel, tagsSel,
            xComputed, yComputed, colorsComputed, tagsComputed
        };
    }

    private changeCustomNtC(ntc: string, targetStep: (stepId: number) => Step | undefined) {
        const stepId = this.props.structureSelection.steps[0];
        if (this.props.selectedCustomNtCSet === '' || stepId === undefined){
            InputDialog.create({
                caption: "Name of the new set",
                description: "You need to create a new set before assigning a custom NtC.",
                validator: (v) => {
                    if (v === "") return "Set must have a name";
                    return this.props.dnatcofication.customNtCs.exists(v)
                        ? `Set named ${v} already exists`
                        : void 0;
                },
                onAccepted: (v) => {
                    this.props.dnatcofication.customNtCs.addSet(v);
                    if (this.props.onCustomNtCSetChanged) {
                        this.props.onCustomNtCSetChanged(v);
                    }

                },
            });
            return;
        }

        const step = targetStep(stepId);
        if (step) {
            this.props.dnatcofication.customNtCs.setCustomNtC(
                this.props.selectedCustomNtCSet,
                step.name,
                ntc as NtC.ValidClass
            );
        }
    }

    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);
    private tableTainer = React.createRef<HTMLDivElement>();

    private renderSwitchButton = (direction: string) => (
        <button
            className={``}
            onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                this.setConnectivityMode(direction);
            }}
            title="Buttons"
        >
            {direction}
        </button>
    );

    private addRow(row: number, label: "Previous" | "Current" | "Next", columns: DynamicTable.Column<any>[], stepId: number){
        const _step = StepsMapper.byId(this.props.dnatcofication ,stepId);
        const tag = _step.name;
        const tags = [void 0, tag, tag, tag, void 0, void 0, void 0];
        const currentNtC = getNtC(this.props.dnatcofication, _step, this.props.selectedCustomNtCSet);
        const neighbors = StepsMapper.previousNextById(this.props.dnatcofication, _step.id);

        const centredStepId = this.props.structureSelection.steps[0];
        const centredStep = StepsMapper.byId(this.props.dnatcofication, centredStepId);
        const centredNtC = getNtC(this.props.dnatcofication, centredStep, this.props.selectedCustomNtCSet)

        const stepNew = Step.clone(_step);
        stepNew.closestNtC = currentNtC;

        const prevStep = (neighbors.previousId !== undefined && neighbors.previousId !== InvalidStepId)
            ? StepsMapper.byId(this.props.dnatcofication, neighbors.previousId)
            : void 0;

        const nextStep = (neighbors.nextId !== undefined && neighbors.nextId !== InvalidStepId)
            ? StepsMapper.byId(this.props.dnatcofication, neighbors.nextId)
            : void 0;

        const {backward, forward} = calculateConnectivities(
            stepNew,
            prevStep,
            nextStep,
            Cif.File.table(this.props.dnatcofication.data.cifData!, AtomSite, 0)
        )
        const currentRMSD = this.props.dnatcofication.getSimilarities(_step.id)?.[currentNtC]?.rmsd;
        const stepName = niceStepName(_step);

        let C5: any;
        let O3: any;
        if(label == "Previous"){
            //const nextNtC = StepsMapper.byId(this.props.dnatcofication, neighbors.nextId).NtC;
            C5 = forward?.[centredNtC]?.C5PrimeDistance;
            O3 = forward?.[centredNtC]?.O3PrimeDistance;
        } else if (label == "Next"){
            //const prevNtC = StepsMapper.byId(this.props.dnatcofication, neighbors.previousId).NtC;
            C5 = backward?.[centredNtC]?.C5PrimeDistance;
            O3 = backward?.[centredNtC]?.O3PrimeDistance;
        }

        setDynamicTableModelColumns(
            this.tableModel,
            row,
            columns,
            tags,
            [
                "",
                _step.chainAuth,
                _step.name,
                currentNtC,
                currentRMSD,
                C5,
                O3,
            ],
            [
                () => {
                    return(
                        <span>
                            {this.renderSwitchButton(label)}
                        </span>
                    )
                },
                void 0,
                () => ( <span>
                            {stepName}
                        </span>),
                () => currentNtC === "NANT" ? (
                    <Tooltip
                        tag={
                            <span className="text-secondary-third">
                                    {currentNtC}
                                </span>
                        }
                        delayMsec={300}
                    >
                        This step is unassigned.
                    </Tooltip>
                ) : (
                    <span>
                            {currentNtC}
                        </span>
                ),
                () => (
                    <span>
                          {currentRMSD!.toFixed(3)}
                        </span>
                ),
                () => {
                    return <span>{typeof C5 === 'number' ? C5.toFixed(3) : "-"}</span>;
                },
                () => {
                    return <span>{typeof O3 === 'number' ? O3.toFixed(3) : "-"}</span>;
                },
            ]
        )
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string){

        const buttonColumn: DynamicTable.Column<string> = {
            name: "Buttons",
            cells: new Array<DynamicTable.Cell<string>>(),
            alignment: "center",
            tooltip: <div>Buttons</div>,
            notSortable: true,
        }

        const chainColumn: DynamicTable.Column<string> = {
            name: "Chain",
            cells: new Array<DynamicTable.Cell<string>>(),
            alignment: "center",
            tooltip: <div>PDB chain ID (author)</div>,
            notSortable: true,
        };

        const stepColumn: DynamicTable.Column<string> = {
            name: "Step",
            cells: new Array<DynamicTable.Cell<string>>(),
            alignment: "center",
            tooltip: <div>Dinucleotide step identifier</div>,
            notSortable: true,
        };

        const NtCColumn: DynamicTable.Column<string> = {
            name: "NtC",
            cells: new Array<DynamicTable.Cell<string>>(),
            alignment: "center",
            tooltip: <div> NtC </div>,
            notSortable: true,
        };

        const rmsdColumn: DynamicTable.Column<number> = {
            name: "RMSD",
            cells: new Array<DynamicTable.Cell<number>>(),
            alignment: "center",
            cellStyle: rmsdToColor,
            tooltip: (
                <div>
                    RMSD between the analyzed step and the closest NtC representative.
                </div>
            ),
            notSortable: true,
        };

        const C5Column: DynamicTable.Column<number> = {
            name: "C5",
            cells: new Array<DynamicTable.Cell<number>>(),
            alignment: "center",
            cellStyle: rmsdToColor,
            tooltip: (
                <div>
                    C5.
                </div>
            ),
            notSortable: true,
        };

        const O3Column: DynamicTable.Column<number> = {
            name: "O3",
            cells: new Array<DynamicTable.Cell<number>>(),
            alignment: "center",
            cellStyle: rmsdToColor,
            tooltip: (
                <div>
                    O3.
                </div>
            ),
            notSortable: true,
        };

        const columns = [
            buttonColumn,
            chainColumn,
            stepColumn,
            NtCColumn,
            rmsdColumn,
            C5Column,
            O3Column,
        ];

        this.tableModel = new DynamicTable.Model([]);
        const _step = this.props.structureSelection.steps[0];
        const neighbors = StepsMapper.previousNextById(this.props.dnatcofication, _step);
        if(_step == undefined){return new DynamicTable.Model(columns);}
        if(neighbors.previousId !== undefined){
            this.addRow(0, "Previous", columns, neighbors.previousId);
        }
        this.addRow(1, "Current", columns, _step);
        if(neighbors.nextId !== undefined){
            this.addRow(2, "Next", columns, neighbors.nextId);
        }
        return new DynamicTable.Model(columns);
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

    private renderConnectivityPlot(data: PlotData, hints: [xMax: number, yMax: number], changeCustomNtC: (NtC: string) => void, uirev: string) {
        return (
            <div className='flex justify-center items-center' style={{ flex: 1, minHeight: Constants.MinimumFlexiblePlotHeight }}>
                <Plot
                    data={[
                        {
                            x: data.x,
                            y: data.y,
                            marker: { size: 10, color: data.colors },
                            mode: 'text+markers',
                            hovertemplate: '<i>C5</i>: %{x:.3f}, <i>O3</i>: %{y:.3f}<br />%{text}',
                            text: data.tags,
                            textposition: 'top center',
                            type: 'scatter',
                            showlegend: false,
                        },
                        {
                            x: data.xSel,
                            y: data.ySel,
                            marker: { size: 14, color: data.colorsSel, symbol: 'x' },
                            mode: 'text+markers',
                            hovertemplate: '<i>C5</i>: %{x:.3f}, <i>O3</i>: %{y:.3f}<br />%{text}',
                            text: data.tagsSel,
                            textposition: 'top center',
                            type: 'scatter',
                            showlegend: false,
                        },
                        {
                            x: data.xComputed,
                            y: data.yComputed,
                            marker: { size: 14, color: data.colorsComputed, symbol: 'square' },
                            mode: 'text+markers',
                            hovertemplate: '<i>C5</i>: %{x:.3f}, <i>O3</i>: %{y:.3f}<br />%{text}',
                            text: data.tagsComputed,
                            textposition: 'top center',
                            type: 'scatter',
                            showlegend: false,
                        },
                    ]}
                    layout={{
                        autosize: true,
                        dragmode: 'pan',
                        hovermode: 'closest',
                        xaxis: {
                            title: {
                                text: 'C5 distance [Å]',
                            },
                            range: [0, 2],
                            zeroline: true,
                            automargin: true
                        },
                        yaxis: {
                            title: {
                                text: 'O3 distance [Å]',
                            },
                            range: [0, 3],
                            zeroline: true,
                            automargin:true
                        },
                        margin: {
                            t: 0,
                            r: 25,
                        },
                        modebar: {
                            orientation: 'v',
                        },
                        uirevision: uirev,
                    }}
                    config={{
                        scrollZoom: true,
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                    onClick={ev => {
                        const pt = ev.points[0];
                        if (pt) {
                            // @ts-ignore
                            changeCustomNtC(pt.text);
                        }
                    }}
                />
            </div>
        );
    }

    private similarityPlotData(stepId: number): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const xSel = [];
        const ySel = [];
        const colorsSel = [];
        const tagsSel = [];

        const xComputed = [];
        const yComputed = [];
        const colorsComputed = [];
        const tagsComputed = [];

        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
        const similarities = this.props.dnatcofication.getSimilarities(stepId);
        const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, step.name);
        const selectedNtC = customNtC ?? step.closestNtC;

        if (similarities) {
            for (const ntc of objKeys(similarities)) {
                const simil = similarities[ntc];
                const clr = valueToSemaphore(simil.rmsd, Constants.GreenRMSD, Constants.RedRMSD);

                if (ntc === selectedNtC) {
                    xSel.push(simil.rmsd);
                    ySel.push(simil.euclideanDistance);
                    colorsSel.push(rgbToHex(clr));
                    tagsSel.push(ntc);
                } else if (ntc === step.closestNtC) {
                    xComputed.push(simil.rmsd);
                    yComputed.push(simil.euclideanDistance);
                    colorsComputed.push(rgbToHex(clr));
                    tagsComputed.push(ntc);
                } else {
                    x.push(simil.rmsd);
                    y.push(simil.euclideanDistance);
                    colors.push(rgbToHex(clr));
                    tags.push(ntc);
                }
            }
        }

        return {
            x, y, colors, tags,
            xSel, ySel, colorsSel, tagsSel,
            xComputed, yComputed, colorsComputed, tagsComputed
        };
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, (sel) => {this.setTableModel(sel); this.forceUpdate();});
        this.subscribe(this.props.switching.events.chainSwitched, (sel) => {this.setTableModel(sel); this.forceUpdate()});
        this.subscribe(this.props.switching.events.selectionChanged, (sel) => {this.setTableModel(sel);  this.forceUpdate()});
        this.subscribe(this.props.dnatcofication.customNtCs.events.setChanged, (update) => {
            if (update.set === this.props.selectedCustomNtCSet) {
                const sel = this.props.structureSelection;
                this.setTableModel(sel);
                this.forceUpdate();
            }
        });
        this.setTableModel(this.props.structureSelection);
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    state = {
        connectivityMode: 'Current',
    }

    setConnectivityMode = (mode: string) => {
        this.setState({ connectivityMode: mode});
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        const numChains = this.props.dnatcofication.data.steps.chains[0].size;
        let simPlotData = PlotData;
        let prevConnPlotData = PlotData;
        let nextConnPlotData = PlotData;
        if (this.props.structureSelection.steps.length > 0) {
            const step = this.props.structureSelection.steps[0];
            const prevNext = StepsMapper.previousNextById(this.props.dnatcofication, step);

            simPlotData = this.similarityPlotData(step);
            prevConnPlotData = this.connectivityPlotData(this.props.structureSelection.steps[0], prevNext.previousId, 'previous');
            nextConnPlotData = this.connectivityPlotData(this.props.structureSelection.steps[0], prevNext.nextId, 'next');
        }

        const changeCustomNtCPrev = (NtC: string) => {
            this.changeCustomNtC(NtC, (stepId: number) => {
                const refIdx = StepsMapper.idToIndex(this.props.dnatcofication, stepId);
                const idx = this.props.dnatcofication.data.steps.previous[refIdx] ?? -1;
                return idx === -1 ? void 0 : this.props.dnatcofication.data.steps.steps[idx];
            });
        }

        const changeCustomNtCNext = (NtC: string) => {
            this.changeCustomNtC(NtC, (stepId: number) => {
                const refIdx = StepsMapper.idToIndex(this.props.dnatcofication, stepId);
                const idx = this.props.dnatcofication.data.steps.next[refIdx] ?? -1;
                return idx === -1 ? void 0 : this.props.dnatcofication.data.steps.steps[idx];
            });
        }

        const prevConnMaxHints = axesMaximumHints(prevConnPlotData.x, prevConnPlotData.y, MinNumberOfPointsInPlot, Constants.DefaultConnectivityXRange[1], Constants.DefaultConnectivityYRange[1]);
        const nextConnMaxHints = axesMaximumHints(nextConnPlotData.x, nextConnPlotData.y, MinNumberOfPointsInPlot, Constants.DefaultConnectivityXRange[1], Constants.DefaultConnectivityYRange[1]);

        return (
            <div className='h-full'>
                <NamedList sizing='min-content' rowSpacing='half'>
                    {numModels > 1 && (
                        <NamedListItem name='Model'>
                            <ModelSelect
                                dnatcofication={this.props.dnatcofication}
                                structureSelection={this.props.structureSelection}
                                switching={this.props.switching}
                            />
                        </NamedListItem>
                    )}
                    {numChains > 1 && (
                        <NamedListItem name='Chain'>
                            <ChainSelect
                                dnatcofication={this.props.dnatcofication}
                                structureSelection={this.props.structureSelection}
                                switching={this.props.switching}
                            />
                        </NamedListItem>
                    )}
                    <NamedListItem name='Step'>
                        <StepSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            switching={this.props.switching}
                            onChange={(stepId) => {
                                const sel = stepId === -1
                                    ? EmptySelectionPieces
                                    : ConnectivityPlot.SelectionMaker(stepId, InvalidResidue, InvalidAtom, this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms, this.props.dnatcofication);
                                this.props.switching.changeSelection(sel, ConnectivityPlot.SelectionDisplayer);
                            }}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='h-4' />

                <CustomNtCSets
                    customNtCs={this.props.dnatcofication.customNtCs}
                    selectedSet={this.props.selectedCustomNtCSet}
                    onSetChanged={this.props.onCustomNtCSetChanged}
                />

                <div className='h-4' />

                <div className='rdo-offset flex flex-col flex-1'>
                    <PlotPointsLegend computed={true} />
                    <div className='rdo-secondary-caption'>Similarity plot</div>
                    <div className='flex justify-center items-center' style={{ flex: 1, minHeight: Constants.MinimumFlexiblePlotHeight }}>
                        <Plot
                            data={[
                                {
                                    x: simPlotData.x,
                                    y: simPlotData.y,
                                    marker: { size: 10, color: simPlotData.colors },
                                    mode: 'text+markers',
                                    hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                                    text: simPlotData.tags,
                                    textposition: 'top center',
                                    type: 'scatter',
                                    showlegend: false,
                                },
                                {
                                    x: simPlotData.xSel,
                                    y: simPlotData.ySel,
                                    marker: { size: 14, color: simPlotData.colorsSel, symbol: 'x' },
                                    mode: 'text+markers',
                                    hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                                    text: simPlotData.tagsSel,
                                    textposition: 'top center',
                                    type: 'scatter',
                                    showlegend: false,
                                },
                                {
                                    x: simPlotData.xComputed,
                                    y: simPlotData.yComputed,
                                    marker: { size: 14, color: simPlotData.colorsComputed, symbol: 'square' },
                                    mode: 'text+markers',
                                    hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                                    text: simPlotData.tagsComputed,
                                    textposition: 'top center',
                                    type: 'scatter',
                                    showlegend: false,
                                },
                            ]}
                            layout={{
                                autosize: true,
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { title: { text: 'Cartesian RMSD [Å]' }, automargin: true },
                                yaxis: { title: { text: 'Euclidean distance' }, automargin: true },
                                plot_bgcolor: 'white',
                                paper_bgcolor: 'white',
                                margin: {
                                    t: 0,
                                    r: 25,
                                },
                                modebar: {
                                    orientation: 'v',
                                },
                                uirevision: 'simil',
                            }}
                            config={{
                                scrollZoom: true,
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                            onClick={ev => {
                                const pt = ev.points[0];
                                if (pt) {
                                    this.changeCustomNtC(pt.text, (stepId) => StepsMapper.byId(this.props.dnatcofication, stepId));
                                }
                            }}
                        />
                    </div>

                    <div className="flex-1" ref={this.tableTainer}>
                        <div className="rdo-scroll-vertically-with-scrollbar">
                            {this.renderStepsTable()}
                        </div>
                    </div>

                    {(this.state.connectivityMode == 'Previous' &&
                        (<>
                            <div className='rdo-secondary-caption'>Connectivity to previous step</div>
                            {this.renderConnectivityPlot(prevConnPlotData, prevConnMaxHints, changeCustomNtCPrev, 'prev')}
                    </>))}
                    {(this.state.connectivityMode == 'Next' &&
                        (<>
                            <div className='rdo-secondary-caption'>Connectivity to next step</div>
                            {this.renderConnectivityPlot(nextConnPlotData, nextConnMaxHints, changeCustomNtCNext, 'next')}
                    </>))}
                    {(this.state.connectivityMode == 'Current' &&
                        (<>
                            <div className='rdo-secondary-caption'>Connectivity to previous step</div>
                            {this.renderConnectivityPlot(prevConnPlotData, prevConnMaxHints, changeCustomNtCPrev, 'prev')}
                            <div className='rdo-secondary-caption'>Connectivity to next step</div>
                            {this.renderConnectivityPlot(nextConnPlotData, nextConnMaxHints, changeCustomNtCNext, 'next')}
                    </>))}
                </div>
            </div>
        );
    }
}

export namespace ConnectivityPlot {
    export const SelectionDisplayer = Refinement.selectionDisplayer;
    export const SelectionMaker = Refinement.selectionMaker;
}
