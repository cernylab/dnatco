import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import Plot from 'react-plotly.js';
import { View } from '../view';
import { listOfChains, makeStepSelection } from '../../util';
import { ComboBox } from '../../../common/combo-box';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { BasePushButton } from '../../../common/push-button';
import { Constants } from '../../../dnatco/constants';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { valueToSemaphore } from '../../util';
import { colorToRgb, rgbToHex } from '../../../util';
import { sequence } from '../../../../util';
import { ViewerApi } from '../../../../viewer/viewer-interop';

const PlotData = {
    x: new Array<number>(),
    y: new Array<number>(),
    colors: new Array<string>(),
    tags: new Array<string>(),
};
type PlotData = typeof PlotData;

interface State {
    chain: string;
    model: number;
    stepId: number;
    previousStepId: number;
    nextStepId: number;
}
export class ConnectivityPlot extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            chain: '',
            model: this.props.dnatcofication.data.structures[0].models[0].num,
            stepId: -1,
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
                <div style={{ color }}>(None)</div>,
                <div style={{ color }}>(-)</div>
            ];
        }

        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
        return [
            <div style={{ color }}>{step.name}</div>,
            <div style={{ color }}>({step.NtC})</div>
        ];
    }

    private stepsOptions() {
        const model = this.state.model;
        const chain = this.state.chain !== '' ? this.state.chain : void 0;

        const opts: { caption: string, value: string }[] = [{ caption: '-', value: '' }];
        for (const s of StepsMapper.segment(this.props.dnatcofication, model, chain))
            opts.push({ caption: s.name, value: s.id.toString() });

        return opts;
    }

    private switchStep(stepName: string) {
        const selection = makeStepSelection(this.props.dnatcofication, stepName);
        if (selection)
            this.props.viewerInterop.api.command(ViewerApi.Commands.SelectStep(selection.current, selection.prev, selection.next));
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.forceUpdate());

        this.subscribe(
            this.props.viewerInterop.events.stepDeselected,
            () => {
                this.setState({
                    ...this.state,
                    stepId: -1,
                    previousStepId: -1,
                    nextStepId: -1,
                })
            }
        );
        this.subscribe(
            this.props.viewerInterop.events.stepSelected,
            sel => {
                const step = StepsMapper.byName(this.props.dnatcofication, sel.name);
                if (step)
                    this.setState({ ...this.state, stepId: step.id });
            }
        );

        if (this.props.viewerInterop.ready()) {
            const sel = this.props.viewerInterop.api.query('selected-step');
            if (sel.name !== '') {
                const step = StepsMapper.byName(this.props.dnatcofication, sel.name);
                if (step)
                    this.setState({ ...this.state, stepId: step.id });
            }
        }
    }

    componentDidUpdate(_prevProps: View.Props, prevState: State) {
        if (this.state.model !== prevState.model) {
            this.setState({
                ...this.state,
                chain: '',
                stepId: -1,
                previousStepId: -1,
                nextStepId: -1,
            });
            this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());
        } else if (this.state.chain !== prevState.chain) {
            this.setState({
                ...this.state,
                stepId: -1,
                previousStepId: -1,
                nextStepId: -1,
            });
            this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());
        } else if (this.state.stepId !== prevState.stepId) {
            if (this.state.stepId === -1) {
                this.setState({
                    ...this.state,
                    previousStepId: -1,
                    nextStepId: -1,
                });
            } else {
                const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, this.state.stepId);

                this.setState({
                    ...this.state,
                    previousStepId: previous,
                    nextStepId: next,
                });
            }
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        let simPlotData = PlotData;
        let prevConnPlotData = PlotData;
        let nextConnPlotData = PlotData;
        if (this.state.stepId !== -1) {
            const stepIdx = StepsMapper.idToIndex(this.props.dnatcofication, this.state.stepId);
            simPlotData = this.similarityPlotData(stepIdx);
            prevConnPlotData = this.connectivityPlotData(stepIdx, 'previous');
            nextConnPlotData = this.connectivityPlotData(stepIdx, 'next');
        }

        return (
            <div>
                <NamedList>
                    <NamedListItem name='Model'>
                        <ComboBox
                            value={this.state.model.toString()}
                            options={[
                                { caption: 'All', value: '' },
                                ...sequence(1, Dnatcofication.Structure.numberOfModels(this.props.dnatcofication)).map(n => {
                                    const s = n.toString();
                                    return { caption: s, value: s };
                                })
                            ]}
                            onChange={v => {
                                this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
                                this.setState({ ...this.state, model: parseInt(v) });
                            }}
                        />
                    </NamedListItem>
                    <NamedListItem name='Chain'>
                        <ComboBox
                            value={this.state.chain}
                            options={[
                                { value: '', caption: 'All' },
                                ...listOfChains(this.state.model, this.props.dnatcofication.data.structures[0]),
                            ]}
                            onChange={v => {
                                if (v === this.state.chain)
                                    return;
                                this.setState({ ...this.state, chain: v })}
                            }
                        />
                    </NamedListItem>
                    <NamedListItem name='Step'>
                        <ComboBox
                            value={this.state.stepId === -1 ? '' : this.state.stepId.toString()}
                            options={this.stepsOptions()}
                            onChange={v => {
                                if (v === '') return;
                                const stepId = parseInt(v);
                                const step = StepsMapper.byId(this.props.dnatcofication, stepId);
                                this.switchStep(step.name);
                                this.setState({ ...this.state, stepId });
                            }}
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
                                    if (this.state.previousStepId !== -1) {
                                        const step = StepsMapper.byId(this.props.dnatcofication, this.state.previousStepId);
                                        this.switchStep(step.name);
                                    }
                                }}
                                onMouseEnter={e => e.currentTarget.classList.add('rdo-prevnext-active')}
                                onMouseLeave={e => e.currentTarget.classList.remove('rdo-prevnext-active')}
                            >
                                <span style={{ fontWeight: 'bold', color: 'white' }}>Previous step</span>
                                {this.stepDescription(this.state.previousStepId, 'white')}
                            </BasePushButton>
                            <div className='rdo-prevcurrnext'>
                                <span style={{ fontWeight: 'bold' }}>Current step</span>
                                {this.stepDescription(this.state.stepId, 'black')}
                            </div>
                            <BasePushButton
                                className='rdo-prevcurrnext'
                                style={{ backgroundColor: rgbToHex(colorToRgb(Constants.NextStepColor)) }}
                                onClick={() => {
                                    if (this.state.nextStepId !== -1) {
                                        const step = StepsMapper.byId(this.props.dnatcofication, this.state.nextStepId);
                                        this.switchStep(step.name);
                                    }
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
