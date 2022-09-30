import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import Plot from 'react-plotly.js';
import { View } from '../view';
import { makeStepSelection } from '../../util';
import { ComboBox } from '../../../common/combo-box';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { BasePushButton } from '../../../common/push-button';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { sequence } from '../../../../util';
import { ViewerApi } from '../../../../viewer/viewer-interop';

const ConnectivityXRange = [0, 0.5];
const ConnectivityYRange = [0, 0.5];
const NextColor = 'cyan';
const PrevColor = 'blue';

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
    plotData: PlotData;
}
export class ConnectivityPlot extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            chain: '',
            model: '',
            stepId: -1,
            previousStepId: -1,
            nextStepId: -1,
            plotData: PlotData,
        };
    }

    private fullDisplayUpdate(resetChain: boolean) {
        const steps = this.stepsOptions();
        const stepId = parseInt(steps[0]?.value) ?? -1;
        const stepIdx = stepId !== -1 ? StepsMapper.idToIndex(this.props.dnatcofication, stepId) : -1;
        const plotData = stepIdx !== -1 ? this.plotData(stepIdx) : PlotData;
        const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, stepId);

        const update: Partial<State> = { stepId, plotData, previousStepId: previous, nextStepId: next };
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

    private plotData(stepIdx: number): PlotData {
        const x = [];
        const y = [];
        const colors = [];
        const tags = [];

        const back = this.props.dnatcofication.data.connectivities.backward[stepIdx];
        const fwd = this.props.dnatcofication.data.connectivities.forward[stepIdx];

        if (back) {
            for (const ntc in back) {
                const conn = back[ntc];
                x.push(conn.C5PrimeDistance);
                y.push(conn.O3PrimeDistance);
                colors.push(PrevColor);
                tags.push(ntc);
            }
        }
        if (fwd) {
            for (const ntc in fwd) {
                const conn = fwd[ntc];
                x.push(conn.C5PrimeDistance);
                y.push(conn.O3PrimeDistance);
                colors.push(NextColor);
                tags.push(ntc);
            }
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
        const model = this.state.model !== '' ? parseInt(this.state.model) : void 0;
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
                    plotData: PlotData,
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
        if (this.state.model !== prevState.model)
            this.fullDisplayUpdate(true);
        else if (this.state.chain !== prevState.chain)
            this.fullDisplayUpdate(false);
        else if (this.state.stepId !== prevState.stepId && this.state.stepId !== -1) {
            const stepIdx = StepsMapper.idToIndex(this.props.dnatcofication, this.state.stepId);
            const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, this.state.stepId);

            this.setState({
                ...this.state,
                plotData: this.plotData(stepIdx),
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
                <NamedList>
                    <NamedListItem name='Model'>
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
                                this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
                                this.setState({ ...this.state, model: v });
                            }}
                        />
                    </NamedListItem>
                    <NamedListItem name='Chain'>
                        <ComboBox
                            value={this.state.chain}
                            options={this.naChainOptions()}
                            onChange={v => this.setState({ ...this.state, chain: v })}
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
                    <div className='rdo-plot-container'>
                        <Plot
                            data={[
                                {
                                    x: this.state.plotData.x,
                                    y: this.state.plotData.y,
                                    marker: { size: 10, color: this.state.plotData.colors },
                                    mode: 'text+markers',
                                    text: this.state.plotData.tags,
                                    textposition: 'top center',
                                    type: 'scattergl',
                                },
                            ]}
                            layout={{
                                autosize: true,
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

                    <div>
                        <div style={{ display: 'flex', marginRight: 'auto', maxWidth: '40em' }}>
                            <BasePushButton
                                className='rdo-prevcurrnext rdo-prevstep-bgcolor'
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
                                className='rdo-prevcurrnext rdo-nextstep-bgcolor'
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
