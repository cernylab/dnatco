import React from 'react';
import Plot from 'react-plotly.js';
import { Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidStepId } from '../../structure-selection';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Constants } from '../../../dnatco/constants';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { valueToSemaphore } from '../../util';
import { colorToRgb, rgbToHex } from '../../../util';

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

    private connectivityPlotData(stepIdx: number, direction: 'previous' | 'next'): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const clr = rgbToHex(colorToRgb(direction === 'next' ? Constants.NextStepColor : Constants.PrevStepColor));
        const conns = direction === 'next' ? this.props.dnatcofication.data.connectivities.forward[stepIdx] : this.props.dnatcofication.data.connectivities.backward[stepIdx];
        if (conns) {
            for (const ntc in conns) {
                const conn = conns[ntc];
                x.push(conn.C5PrimeDistance);
                y.push(conn.O3PrimeDistance);
                colors.push(clr);
                tags.push(ntc);
            }
        }

        return { x, y, colors, tags };
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
        let simPlotData = PlotData;
        let prevConnPlotData = PlotData;
        let nextConnPlotData = PlotData;
        if (this.props.structureSelection.stepId !== InvalidStepId) {
            const stepIdx = StepsMapper.idToIndex(this.props.dnatcofication, this.props.structureSelection.stepId);
            simPlotData = this.similarityPlotData(stepIdx);
            prevConnPlotData = this.connectivityPlotData(stepIdx, 'previous');
            nextConnPlotData = this.connectivityPlotData(stepIdx, 'next');
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
        }

        return (
            <div>
                <NamedList>
                    <NamedListItem name='Model'>
                        <ModelSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchModel}
                        />
                    </NamedListItem>
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

                <div className='rdo-offset'>
                    <div className='rdo-secondary-caption'>Similarity plot</div>
                    <div className='rdo-plot-container'>
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
                                xaxis: { range: Constants.DefaultSimilarityXRange, title: 'Cartesian RMSD [Å]', automargin: true },
                                yaxis: { range: Constants.DefaultSimilarityYRange, title: 'Euclidean distance', automargin: true },
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
                    <div className='rdo-plot-container'>
                        <Plot
                            data={[
                                {
                                    x: prevConnPlotData.x,
                                    y: prevConnPlotData.y,
                                    marker: { size: 10, color: prevConnPlotData.colors },
                                    mode: 'text+markers',
                                    text: prevConnPlotData.tags,
                                    textposition: 'top center',
                                    type: 'scattergl',
                                },
                            ]}
                            layout={{
                                autosize: true,
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { range: Constants.DefaultConnectivityXRange, title: 'C5 distance [Å]', automargin: true },
                                yaxis: { range: Constants.DefaultConnectivityYRange, title: 'O3 distance [Å]', automargin: true },
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

                    <div className='rdo-secondary-caption'>Connectivity to next residue</div>
                    <div className='rdo-plot-container'>
                        <Plot
                            data={[
                                {
                                    x: nextConnPlotData.x,
                                    y: nextConnPlotData.y,
                                    marker: { size: 10, color: nextConnPlotData.colors },
                                    mode: 'text+markers',
                                    text: nextConnPlotData.tags,
                                    textposition: 'top center',
                                    type: 'scattergl',
                                },
                            ]}
                            layout={{
                                autosize: true,
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { range: Constants.DefaultConnectivityXRange, title: 'C5 distance [Å]', automargin: true },
                                yaxis: { range: Constants.DefaultConnectivityYRange, title: 'O3 distance [Å]', automargin: true },
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
                </div>
            </div>
        );
    }
}

export namespace ConnectivityPlot {
    export const StepSwitcher = Refinement.switchStep;
}
