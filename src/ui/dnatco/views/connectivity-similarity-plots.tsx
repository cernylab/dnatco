import React from 'react';
import Plot from 'react-plotly.js';
import { View } from './view';
import { ViewerApi } from '../viewer-api';
import { ComboBox } from '../../common/combo-box';
import { NamedList } from '../../common/named-list';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../dnatco/steps-mapper';
import { sequence } from '../../../util';
import { rgbToHex, rmsdToSemaphore } from '../../dnatco/util';

const ConnectivityXRange = [0, 0.5];
const ConnectivityYRange = [0, 0.5];
const SimilarityXRange = [0, 1.0];
const SimilarityYRange = [0, 100];

const PlotData = {
    x: new Array<number>(),
    y: new Array<number>(),
    colors: new Array<string>(),
    tags: new Array<string>(),
};
type PlotData = typeof PlotData;

interface State {
    chain: string;
    model: string;
    stepId: number;
    previousStepId: number;
    nextStepId: number;
    connectivityPlotData: PlotData;
    similarityPlotData: PlotData;
}
export class ConnectivitySimilarityPlots extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            chain: '',
            model: '',
            stepId: -1,
            previousStepId: -1,
            nextStepId: -1,
            connectivityPlotData: PlotData,
            similarityPlotData: PlotData,
        };
    }

    private connectivityPlotData(stepIdx: number): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const back = this.props.dnatcofication._connectivities.backward[stepIdx];
        const fwd = this.props.dnatcofication._connectivities.forward[stepIdx];

        if (back) {
            for (const ntc in back) {
                const conn = back[ntc];
                x.push(conn.C5PrimeDistance);
                y.push(conn.O3PrimeDistance);
                colors.push('blue');
                tags.push(ntc);
            }
        }
        if (fwd) {
            for (const ntc in fwd) {
                const conn = fwd[ntc];
                x.push(conn.C5PrimeDistance);
                y.push(conn.O3PrimeDistance);
                colors.push('cyan');
                tags.push(ntc);
            }
        }

        return { x, y, colors, tags };
    }

    private fullDisplayUpdate(resetChain: boolean) {
        const steps = this.stepsOptions();
        const stepId = parseInt(steps[0]?.value) ?? -1;
        const stepIdx = stepId !== -1 ? StepsMapper.idToIndex(this.props.dnatcofication, stepId) : -1;
        const connectivityPlotData = stepIdx !== -1 ? this.connectivityPlotData(stepIdx) : PlotData;
        const similarityPlotData = stepIdx !== -1 ? this.connectivityPlotData(stepIdx) : PlotData;
        const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, stepId);

        const update: Partial<State> = { stepId, connectivityPlotData, similarityPlotData, previousStepId: previous, nextStepId: next };
        if (resetChain)
            update.chain = '';

        this.setState({ ...this.state, ...update });
    }

    private naChainOptions() {
        const opts = [{ caption: 'All', value: '' }];

        if (this.state.model === '')
            return opts;

        for (const ch of Dnatcofication.Structure.nucleicAcidChains(this.props.dnatcofication, parseInt(this.state.model)))
            opts.push({ caption: ch, value: ch });

        return opts;
    }

    private similarityPlotData(stepIdx: number): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const similarities = this.props.dnatcofication._similarities[stepIdx];
        for (const ntc in similarities) {
            const simil = similarities[ntc];
            x.push(simil.rmsd);
            y.push(simil.euclideanDistance);
            const clr = rmsdToSemaphore(simil.rmsd);
            colors.push(rgbToHex(clr));
            tags.push(ntc);
        }

        return { x, y, colors, tags };
    }

    private stepDescription(stepId: number) {
        if (stepId === -1)
            return (<span>(None)</span>);

        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
        return (<span>{step.name} ({step.NtC})</span>);
    }

    private stepsOptions() {
        const model = this.state.model !== '' ? parseInt(this.state.model) : void 0;
        const chain = this.state.chain !== '' ? this.state.chain : void 0;

        const opts: { caption: string, value: string }[] = [];
        for (const s of StepsMapper.segment(this.props.dnatcofication, model, chain))
            opts.push({ caption: s.name, value: s.id.toString() });

        return opts;
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.forceUpdate());

        const steps = this.stepsOptions();
        const stepId = parseInt(steps[0].value);
        const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, stepId);
        if (steps.length > 0)
            this.setState({ ...this.state, stepId, previousStepId: previous, nextStepId: next });
    }

    componentDidUpdate(_prevProps: View.Props, prevState: State) {
        if (this.state.model !== prevState.model)
            this.fullDisplayUpdate(true);
        else if (this.state.chain !== prevState.chain)
            this.fullDisplayUpdate(false);
        else if (this.state.stepId !== prevState.stepId) {
            const stepIdx = StepsMapper.idToIndex(this.props.dnatcofication, this.state.stepId);
            const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, this.state.stepId);

            this.setState({
                ...this.state,
                connectivityPlotData: this.connectivityPlotData(stepIdx),
                similarityPlotData: this.similarityPlotData(stepIdx),
                previousStepId: previous,
                nextStepId: next,
            });
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div>
                <NamedList
                    items={[
                        {
                            name: 'Model',
                            value:
                                <ComboBox
                                    value={this.state.model}
                                    options={[
                                        { caption: 'All', value: '' },
                                        ...sequence(1, Dnatcofication.Structure.numberOfModels(this.props.dnatcofication)).map(n => {
                                            const s = n.toString();
                                            return { caption: s, value: s };
                                        })
                                    ]}
                                    onChange={v => {
                                        this.props.viewerApi.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
                                        this.setState({ ...this.state, model: v });
                                    }}
                                />
                        },
                        {
                            name: 'Chain',
                            value:
                                <ComboBox
                                    value={this.state.chain}
                                    options={this.naChainOptions()}
                                    onChange={v => this.setState({ ...this.state, chain: v })}
                                />
                        },
                        {
                            name: 'Step',
                            value:
                                <ComboBox
                                    value={this.state.stepId?.toString()}
                                    options={this.stepsOptions()}
                                    onChange={v => {
                                        const stepId = parseInt(v);
                                        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
                                        this.props.viewerApi.command(ViewerApi.Commands.SelectStep(step.name));
                                        this.setState({ ...this.state, stepId });
                                    }}
                                />
                        },
                    ]}
                />
                <div className='rdo-offset'>
                    <div className='rdo-plot-container'>
                        <Plot
                            data={[
                                {
                                    x: this.state.similarityPlotData.x,
                                    y: this.state.similarityPlotData.y,
                                    marker: { size: 10, color: this.state.similarityPlotData.colors },
                                    mode: 'text+markers',
                                    textposition: 'top center',
                                    text: this.state.similarityPlotData.tags,
                                    type: 'scattergl',
                                },
                            ]}
                            layout={{
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { range: SimilarityXRange, title: 'Cartesian RMSD [Å]' },
                                yaxis: { range: SimilarityYRange, title: 'Euclidean distance' },
                            }}
                            config={{
                                scrollZoom: true,
                            }}
                        />
                    </div>

                    <div className='rdo-plot-container'>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto' }}>
                            <div style={{ fontWeight: 'bold', backgroundColor: 'cyan' }}>Previous step</div><div>Current step</div><div style={{ fontWeight: 'bold', backgroundColor: 'blue', color: 'white' }}>Next step</div>
                            <div>
                                {this.stepDescription(this.state.previousStepId)}
                            </div>
                            <div>
                                {this.stepDescription(this.state.stepId)}
                            </div>
                            <div>
                                {this.stepDescription(this.state.nextStepId)}
                            </div>
                        </div>
                        <Plot
                            data={[
                                {
                                    x: this.state.connectivityPlotData.x,
                                    y: this.state.connectivityPlotData.y,
                                    marker: { size: 10, color: this.state.connectivityPlotData.colors },
                                    mode: 'text+markers',
                                    text: this.state.connectivityPlotData.tags,
                                    textposition: 'top center',
                                    type: 'scattergl',
                                },
                            ]}
                            layout={{
                                dragmode: 'pan',
                                hovermode: 'closest',
                                xaxis: { range: ConnectivityXRange, title: 'C5 distance [Å]' },
                                yaxis: { range: ConnectivityYRange, title: 'O3 distance [Å]' },
                            }}
                            config={{
                                scrollZoom: true,
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
