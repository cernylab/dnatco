import React from 'react';
import Plot from 'react-plotly.js';
import { Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { EmptySelectionPieces, InvalidAtom, InvalidResidue, InvalidStepId } from '../../structure-selection';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Cif } from '../../../../cif';
import { AtomSite } from '../../../../cif/categories/atom-site';
import { Colors } from '../../../dnatco/colors';
import { Constants } from '../../../dnatco/constants';
import { calculateConnectivities } from '../../../../dnatco/connectivity-similarity';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { axesMaximumHints, valueToSemaphore } from '../../util';
import { colorToRgb, rgbToHex } from '../../../util';

const MinNumberOfPointsInPlot = 10;

const PlotData = {
    x: new Array<number>(),
    y: new Array<number>(),
    colors: new Array<string>(),
    tags: new Array<string>(),

    xSel: new Array<number>(),
    ySel: new Array<number>(),
    colorsSel: new Array<string>(),
    tagsSel: new Array<string>(),

    xOrig: new Array<number>(),
    yOrig: new Array<number>(),
    colorsOrig: new Array<string>(),
    tagsOrig: new Array<string>(),
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

        const xOrig = new Array<number>();
        const yOrig = new Array<number>();
        const colorsOrig =new Array<string>();
        const tagsOrig = new Array<string>();

        if (surroundingStepId == InvalidStepId) {
            return {
                x, y, colors, tags,
                xSel, ySel, colorsSel, tagsSel,
                xOrig, yOrig, colorsOrig, tagsOrig
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
            for (const ntc in conns) {
                const conn = conns[ntc];

                if (ntc === otherStepSelectedNtC) {
                    xSel.push(conn.C5PrimeDistance);
                    ySel.push(conn.O3PrimeDistance);
                    colorsSel.push(clr);
                    tagsSel.push(ntc);
                } else if (otherStep && ntc === otherStep.closestNtC) {
                    xOrig.push(conn.C5PrimeDistance);
                    yOrig.push(conn.O3PrimeDistance);
                    colorsOrig.push(clr);
                    tagsOrig.push(ntc);
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
            xOrig, yOrig, colorsOrig, tagsOrig
        };
    }

    private renderConnectivityPlot(data: PlotData, hints: [xMax: number, yMax: number]) {
        return (
            <div className='rdo-plot-container' style={{ flex: 1, minHeight: Constants.MinimumFlexiblePlotHeight }}>
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
                            type: 'scattergl',
                        },
                        {
                            x: data.xSel,
                            y: data.ySel,
                            marker: { size: 14, color: data.colorsSel, symbol: 'x' },
                            mode: 'text+markers',
                            hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                            text: data.tagsSel,
                            textposition: 'top center',
                            type: 'scattergl',
                            showlegend: false,
                        },
                        {
                            x: data.xOrig,
                            y: data.yOrig,
                            marker: { size: 14, color: data.colorsOrig, symbol: 'square' },
                            mode: 'text+markers',
                            hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                            text: data.tagsOrig,
                            textposition: 'top center',
                            type: 'scattergl',
                            showlegend: false,
                        },
                    ]}
                    layout={{
                        autosize: true,
                        dragmode: 'pan',
                        hovermode: 'closest',
                        xaxis: {
                            range: [
                                Constants.DefaultConnectivityXRange[0],
                                hints[0],
                            ],
                            title: 'C5 distance [Å]',
                            automargin: true,
                        },
                        yaxis: {
                            range: [
                                Constants.DefaultConnectivityYRange[0],
                                hints[1],
                            ],
                            title: 'O3 distance [Å]',
                            automargin: true,
                        },
                        margin: {
                            t: 0,
                            r: 25,
                        },
                        modebar: {
                            orientation: 'v',
                        }
                    }}
                    config={{
                        scrollZoom: true,
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
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

        const xOrig = [];
        const yOrig = [];
        const colorsOrig = [];
        const tagsOrig = [];

        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
        const similarities = this.props.dnatcofication.getSimilarities(stepId);
        const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, step.name);
        const selectedNtC = customNtC ?? step.closestNtC;

        for (const ntc in similarities) {
            const simil = similarities[ntc];
            const clr = valueToSemaphore(simil.rmsd, Constants.GreenRMSD, Constants.RedRMSD);

            if (ntc === selectedNtC) {
                xSel.push(simil.rmsd);
                ySel.push(simil.euclideanDistance);
                colorsSel.push(rgbToHex(clr));
                tagsSel.push(ntc);
            } else if (ntc === step.closestNtC) {
                xOrig.push(simil.rmsd);
                yOrig.push(simil.euclideanDistance);
                colorsOrig.push(rgbToHex(clr));
                tagsOrig.push(ntc);
            } else {
                x.push(simil.rmsd);
                y.push(simil.euclideanDistance);
                colors.push(rgbToHex(clr));
                tags.push(ntc);
            }
        }

        return {
            x, y, colors, tags,
            xSel, ySel, colorsSel, tagsSel,
            xOrig, yOrig, colorsOrig, tagsOrig
        };
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.chainSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.selectionChanged, () => this.forceUpdate());
        this.subscribe(this.props.dnatcofication.customNtCs.events.changed, (update) => {
            if (update.set === this.props.selectedCustomNtCSet)
                this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
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

        const changeCustomNtC = (NtC: string) => {
            const stepId = this.props.structureSelection.steps[0];
            if (this.props.selectedCustomNtCSet === '' || stepId === undefined)
                return;

            const step = StepsMapper.byId(this.props.dnatcofication, stepId);
            this.props.dnatcofication.customNtCs.setCustomNtC(
                this.props.selectedCustomNtCSet,
                step.name,
                NtC
            );
        }

        const prevConnMaxHints = axesMaximumHints(prevConnPlotData.x, prevConnPlotData.y, MinNumberOfPointsInPlot, Constants.DefaultConnectivityXRange[1], Constants.DefaultConnectivityYRange[1]);
        const nextConnMaxHints = axesMaximumHints(nextConnPlotData.x, nextConnPlotData.y, MinNumberOfPointsInPlot, Constants.DefaultConnectivityXRange[1], Constants.DefaultConnectivityYRange[1]);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <NamedList sizing='min-content' rowSpacing='half'>
                {
                    numModels > 1
                        ? <NamedListItem name='Model'>
                                <ModelSelect
                                    dnatcofication={this.props.dnatcofication}
                                    structureSelection={this.props.structureSelection}
                                    switching={this.props.switching}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            switching={this.props.switching}
                        />
                    </NamedListItem>
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

                <div className='rdo-line-spacer' />

                <CustomNtCSets
                    customNtCs={this.props.dnatcofication.customNtCs}
                    selectedSet={this.props.selectedCustomNtCSet}
                    onSetChanged={this.props.onCustomNtCSetChanged}
                />

                <div className='rdo-line-spacer' />

                <div className='rdo-offset' style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className='rdo-secondary-caption'>Similarity plot</div>
                    <div className='rdo-plot-container' style={{ flex: 1, minHeight: Constants.MinimumFlexiblePlotHeight }}>
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
                                    type: 'scattergl',
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
                                    type: 'scattergl',
                                    showlegend: false,
                                },
                                {
                                    x: simPlotData.xOrig,
                                    y: simPlotData.yOrig,
                                    marker: { size: 14, color: simPlotData.colorsOrig, symbol: 'square' },
                                    mode: 'text+markers',
                                    hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                                    text: simPlotData.tagsOrig,
                                    textposition: 'top center',
                                    type: 'scattergl',
                                    showlegend: false,
                                },
                            ]}
                            layout={{
                                autosize: true,
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { title: 'Cartesian RMSD [Å]', automargin: true },
                                yaxis: { title: 'Euclidean distance', automargin: true },
                                plot_bgcolor: 'white',
                                paper_bgcolor: 'white',
                                margin: {
                                    t: 0,
                                    r: 25,
                                },
                                modebar: {
                                    orientation: 'v',
                                },
                                uirevision: 'true',
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

                    <div className='rdo-secondary-caption'>Connectivity to previous step</div>
                    {this.renderConnectivityPlot(prevConnPlotData, prevConnMaxHints)}

                    <div className='rdo-secondary-caption'>Connectivity to next step</div>
                    {this.renderConnectivityPlot(nextConnPlotData, nextConnMaxHints)}
                </div>
            </div>
        );
    }
}

export namespace ConnectivityPlot {
    export const SelectionDisplayer = Refinement.selectionDisplayer;
    export const SelectionMaker = Refinement.selectionMaker;
}
