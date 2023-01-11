import React from 'react';
import Plot from 'react-plotly.js';
import { Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidStepId } from '../../structure-selection';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Constants } from '../../../dnatco/constants';
import { getConnectivities, getStepsAtoms } from '../../../../dnatco/connectivity-similarity';
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
};
type PlotData = typeof PlotData;

interface State {
    previousStepId: number;
    nextStepId: number;
}
export class ConnectivityPlot extends View<Refinement.Props, State> {
    constructor(props: Refinement.Props) {
        super(props);

        this.state = {
            previousStepId: -1,
            nextStepId: -1,
        };
    }

    private connectivityPlotData(centerStepId: number, surroundingStepId: number, direction: 'previous' | 'next'): PlotData {
        const x = new Array<number>();
        const y = new Array<number>();
        const colors = new Array<string>();
        const tags = new Array<string>();

        if (surroundingStepId == InvalidStepId)
            return { x, y, colors, tags };

        const s = this.props.dnatcofication.data.steps.steps;

        const centerIdx = StepsMapper.idToIndex(this.props.dnatcofication, centerStepId);
        const surrIdx = StepsMapper.idToIndex(this.props.dnatcofication, surroundingStepId);

        const centerStep = Step.clone(s[centerIdx]); // We may need to modify the step props
        const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, centerStep.name);

        // getConnectivities() checks against closestNtC. We need to replace it with the user's choice
        // if there is a custom NtC set
        if (customNtC)
            centerStep.closestNtC = customNtC;

        const previous = direction == 'previous' ? [1] : [-1];
        const next = direction == 'next' ? [1] : [-1];

        const stepAtoms = getStepsAtoms([centerStep, s[surrIdx]], this.props.dnatcofication.data.cifData!);
        const _conns = getConnectivities([centerStep, s[surrIdx]], stepAtoms, previous, next);

        const conns = direction == 'previous' ? _conns.backward[0] : _conns.forward[0];
        if (conns) {
            const clr = rgbToHex(colorToRgb(direction == 'previous' ? Constants.PrevStepColor : Constants.NextStepColor));
            for (const ntc in conns) {
                const conn = conns[ntc];
                x.push(conn.C5PrimeDistance);
                y.push(conn.O3PrimeDistance);
                colors.push(clr);
                tags.push(ntc);
            }
        }

        // This is what "automatic memory management" looks like
        stepAtoms.delete();

        return { x, y, colors, tags };
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
                            text: data.tags,
                            textposition: 'top center',
                            type: 'scattergl',
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

    private similarityPlotData(stepIdx: number): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const similarities = this.props.dnatcofication.data.similarities[stepIdx];
        for (const ntc in similarities) {
            const simil = similarities[ntc];
            x.push(simil.rmsd);
            y.push(simil.euclideanDistance);
            const clr = valueToSemaphore(simil.rmsd, Constants.GreenRMSD, Constants.RedRMSD);
            colors.push(rgbToHex(clr));
            tags.push(ntc);
        }

        return { x, y, colors, tags };
    }

    componentDidMount() {
        if (this.props.structureSelection.stepId === InvalidStepId)
            this.setState({ ...this.state, previousStepId: InvalidStepId, nextStepId: InvalidStepId });
        else {
            const prevNext = StepsMapper.previousNextById(this.props.dnatcofication, this.props.structureSelection.stepId);
            this.setState({ ...this.state, previousStepId: prevNext.previousId, nextStepId: prevNext.nextId });
        }
    }

    componentDidUpdate(prevProps: View.Props, prevState: State) {
        if (this.props.structureSelection.stepId === prevProps.structureSelection.stepId)
            return;

        if (this.props.structureSelection.stepId === InvalidStepId)
            this.setState({ ...this.state, previousStepId: InvalidStepId, nextStepId: InvalidStepId });
        else {
            const prevNext = StepsMapper.previousNextById(this.props.dnatcofication, this.props.structureSelection.stepId);
            this.setState({ ...this.state, previousStepId: prevNext.previousId, nextStepId: prevNext.nextId });
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        let simPlotData = PlotData;
        let prevConnPlotData = PlotData;
        let nextConnPlotData = PlotData;
        if (this.props.structureSelection.stepId !== InvalidStepId) {
            simPlotData = this.similarityPlotData(this.props.structureSelection.stepId);
            prevConnPlotData = this.connectivityPlotData(this.props.structureSelection.stepId, this.state.previousStepId, 'previous');
            nextConnPlotData = this.connectivityPlotData(this.props.structureSelection.stepId, this.state.nextStepId, 'next');
        }

        const changeCustomNtC = (NtC: string) => {
            const stepId = this.props.structureSelection.stepId;
            if (this.props.selectedCustomNtCSet === '' || stepId === InvalidStepId)
                return;

            const step = StepsMapper.byId(this.props.dnatcofication, stepId);
            this.props.dnatcofication.customNtCs.setCustomNtC(
                this.props.selectedCustomNtCSet,
                step.name,
                NtC
            );

            console.log('Doing a thing');
        }

        const similMaxHints = axesMaximumHints(simPlotData.x, simPlotData.y, MinNumberOfPointsInPlot, Constants.DefaultSimilarityXRange[1], Constants.DefaultSimilarityYRange[1]);
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
                                    onChange={this.props.switching.switchModel}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchChain}
                        />
                    </NamedListItem>
                    <NamedListItem name='Step'>
                        <StepSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchStepId}
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
                                    text: simPlotData.tags,
                                    textposition: 'top center',
                                    type: 'scattergl',
                                },
                            ]}
                            layout={{
                                autosize: true,
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: {
                                    range: [
                                        Constants.DefaultSimilarityXRange[0],
                                        similMaxHints[0],
                                    ],
                                    title: 'Cartesian RMSD [Å]',
                                    automargin: true,
                                },
                                yaxis: {
                                    range: [
                                        Constants.DefaultSimilarityYRange[0],
                                        similMaxHints[1],
                                    ],
                                    title: 'Euclidean distance',
                                    automargin: true,
                                },
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
                            onClick={ev => {
                                const pt = ev.points[0];
                                if (pt) {
                                    // @ts-ignore
                                    changeCustomNtC(pt.text);
                                }
                            }}
                        />
                    </div>

                    <div className='rdo-secondary-caption'>Connectivity to previous residue</div>
                    {this.renderConnectivityPlot(prevConnPlotData, prevConnMaxHints)}

                    <div className='rdo-secondary-caption'>Connectivity to next residue</div>
                    {this.renderConnectivityPlot(nextConnPlotData, nextConnMaxHints)}
                </div>
            </div>
        );
    }
}

export namespace ConnectivityPlot {
    export const StepSwitcher = Refinement.switchStep;
}
