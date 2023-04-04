import React from 'react';
import Plot from 'react-plotly.js';
import { Validation } from './common';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { EmptySelectionPieces, InvalidAtom, InvalidResidue } from '../../structure-selection';
import { valueToSemaphore } from '../../util';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Constants } from '../../../dnatco/constants';
import { rgbToHex } from '../../../util';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';

const PlotData = {
    x: new Array<number>(),
    y: new Array<number>(),
    colors: new Array<string>(),
    tags: new Array<string>(),

    xSel: new Array<number>(),
    ySel: new Array<number>(),
    colorsSel: new Array<string>(),
    tagsSel: new Array<string>(),

};
type PlotData = typeof PlotData;

export class SimilarityPlot extends View<View.Props> {
    private plotData(stepId: number): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const xSel = [];
        const ySel = [];
        const colorsSel = [];
        const tagsSel = [];

        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
        const similarities = this.props.dnatcofication.getSimilarities(stepId);
        for (const ntc in similarities) {
            const simil = similarities[ntc];
            const clr = valueToSemaphore(simil.rmsd, Constants.GreenRMSD, Constants.RedRMSD);

            if (ntc === step.NtC) {
                xSel.push(simil.rmsd);
                ySel.push(simil.euclideanDistance);
                colorsSel.push(rgbToHex(clr));
                tagsSel.push(ntc);
            } else {
                x.push(simil.rmsd);
                y.push(simil.euclideanDistance);
                colors.push(rgbToHex(clr));
                tags.push(ntc);
            }
        }

        return { x, y, colors, tags, xSel, ySel, colorsSel, tagsSel };
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.chainSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.selectionChanged, () => this.forceUpdate());
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);

        let plotData;
        let step: Step|undefined = void 0;
        if (this.props.structureSelection.steps.length > 0) {
            const stepId = this.props.structureSelection.steps[0];
            plotData = this.plotData(stepId);
            step = StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.steps[0]);
        } else {
            plotData = PlotData;
        }

        return (
            <div>
                <div className='rdo-view-caption'>
                    Similarity of selected steps to NtC class averages
                </div>

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
                                    : SimilarityPlot.SelectionMaker(stepId, InvalidResidue, InvalidAtom, this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms, this.props.dnatcofication);
                                this.props.switching.changeSelection(sel, SimilarityPlot.SelectionDisplayer);
                            }}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='rdo-line-spacer' />
                <NamedList>
                    <NamedListItem name='Step NtC'>
                        {step
                            ? `${step.NtC} ${step.NtC === 'NANT' ? `(closest ${step.closestNtC})` : ''}`
                            : '-'
                        }
                    </NamedListItem>
                </NamedList>
                <div className='rdo-offset'>
                    <div className='rdo-plot-container'>
                        <Plot
                            data={[
                                {
                                    x: plotData.x,
                                    y: plotData.y,
                                    marker: { size: 10, color: plotData.colors },
                                    mode: 'text+markers',
                                    textposition: 'top center',
                                    text: plotData.tags,
                                    hovertemplate: '<i>RMSD</i>: %{x:.3f}, <i>ED</i>: %{y:.3f}<br />%{text}',
                                    type: 'scattergl',
                                    showlegend: false,
                                },
                                {
                                    x: plotData.xSel,
                                    y: plotData.ySel,
                                    marker: { size: 10, color: plotData.colorsSel, symbol: 'x' },
                                    mode: 'text+markers',
                                    textposition: 'top center',
                                    text: plotData.tagsSel,
                                    hovertemplate: 'RMSD: %{x:.3f}, ED: %{y:.3f}<br />%{text}',
                                    type: 'scattergl',
                                    showlegend: false,
                                },
                            ]}
                            layout={{
                                autosize: true,
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { range: Constants.DefaultSimilarityXRange, title: 'Cartesian RMSD [Å]', automargin: true },
                                yaxis: { range: Constants.DefaultSimilarityYRange, title: 'Euclidean distance', automargin: true },
                                plot_bgcolor: 'white',
                                paper_bgcolor: 'white',
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
                </div>
            </div>
        );
    }
}

export namespace SimilarityPlot {
    export const SelectionDisplayer = Validation.selectionDisplayer;
    export const SelectionMaker = Validation.selectionMaker;
}
