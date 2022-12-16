import React from 'react';
import Plot from 'react-plotly.js';
import { Validation } from './common';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidStepId } from '../../structure-selection';
import { valueToSemaphore } from '../../util';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Constants } from '../../../dnatco/constants';
import { rgbToHex } from '../../../util';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';

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
export class SimilarityPlots extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            previousStepId: -1,
            nextStepId: -1,
        };
    }

    private plotData(stepIdx: number): PlotData {
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

        let plotData = PlotData;
        if (this.props.structureSelection.stepId !== InvalidStepId) {
            const stepIdx = StepsMapper.idToIndex(this.props.dnatcofication, this.props.structureSelection.stepId);
            plotData = this.plotData(stepIdx);
        }

        return (
            <div>
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
                </div>
            </div>
        );
    }
}

export namespace SimilarityPlots {
    export const StepSwitcher = Validation.switchStep;
}
