import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import Plot from 'react-plotly.js';
import { Refinement } from '../refinement/common';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidStepId } from '../../structure-selection';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { BasePushButton } from '../../../common/push-button';
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
export class ConnectivityPlot extends View<View.Props, State> {
    constructor(props: View.Props) {
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

    private stepDescription(stepId: number, color: StandardLonghandProperties['color']) {
        if (stepId === -1) {
            return [
                <div style={{ color }} key='name'>(None)</div>,
                <div style={{ color }} key='ntc'>(-)</div>
            ];
        }

        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
        return [
            <div style={{ color }} key='name'>{step.name}</div>,
            <div style={{ color }} key='ntc'>({step.NtC})</div>
        ];
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
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', marginRight: 'auto', maxWidth: '40em' }}>
                            <BasePushButton
                                className='rdo-prevcurrnext'
                                style={{ backgroundColor: rgbToHex(colorToRgb(Constants.PrevStepColor)) }}
                                onClick={() => {
                                    if (this.state.previousStepId !== InvalidStepId)
                                        this.props.switching.switchStepId(this.state.previousStepId);
                                }}
                                onMouseEnter={e => e.currentTarget.classList.add('rdo-prevnext-active')}
                                onMouseLeave={e => e.currentTarget.classList.remove('rdo-prevnext-active')}
                            >
                                <span style={{ fontWeight: 'bold', color: 'white' }}>Previous step</span>
                                {this.stepDescription(this.state.previousStepId, 'white')}
                            </BasePushButton>
                            <div className='rdo-prevcurrnext'>
                                <span style={{ fontWeight: 'bold' }}>Current step</span>
                                {this.stepDescription(this.props.structureSelection.stepId, 'black')}
                            </div>
                            <BasePushButton
                                className='rdo-prevcurrnext'
                                style={{ backgroundColor: rgbToHex(colorToRgb(Constants.NextStepColor)) }}
                                onClick={() => {
                                    if (this.state.nextStepId !== InvalidStepId)
                                        this.props.switching.switchStepId(this.state.previousStepId);
                                }}
                                onMouseEnter={e => e.currentTarget.classList.add('rdo-prevnext-active')}
                                onMouseLeave={e => e.currentTarget.classList.remove('rdo-prevnext-active')}
                            >
                                <span style={{ fontWeight: 'bold' }}>Next step</span>
                                {this.stepDescription(this.state.nextStepId, 'black')}
                            </BasePushButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export namespace ConnectivityPlot {
    export const StepSwitcher = Refinement.switchStep;
}
