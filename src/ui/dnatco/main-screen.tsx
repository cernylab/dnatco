import React from 'react';
import { makeStepSelection } from './util';
import { InvalidChain, InvalidModelIndex, InvalidStepId, StructureSelection } from './structure-selection';
import { ViewsList } from './views-list';
import { Register } from './views/register';
import { DynamicSplitView } from '../common/dynamic-split-view';
import { WithSubscriptions } from '../service/with-subscriptions';
import { ViewerInterop, ViewerApi } from '../../viewer/viewer-interop';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { Filters } from 'viewer-filters';
import 'assets/molstar.js';
import 'assets/molstar.css';

export type MasterMode = 'annotation' | 'validation' | 'refinement';
type ViewType = keyof typeof Register.Views;

const AvailableViews = {
    'assigned-ntcs': { caption: 'Assigned NtCs', visualizer: true },
    'structure-info': { caption: 'Structure Info', visualizer: false },
    'confals-rmsds':  { caption: 'Confals & RMSDs', visualizer: true },
    'similarity-plot': { caption: 'Similarity plot', visualizer: true },
    'downloads': { caption: 'Downloads', visualizer: false },
    'step-torsions': { caption: 'Step torsions', visualizer: true },
    'refmac-restraints': { caption: 'REFMAC restraints', visualizer: false },
    'phenix-restraints': { caption: 'Phenix restraints', visualizer: false },
    'mmb-commands-file': { caption: 'MMB commands file', visualizer: false },
    'connectivity-plot': { caption: 'Connectivity plot', visualizer: true },
};
const AnnotationViews: ViewType[] = ['assigned-ntcs', 'structure-info', 'downloads'];
const ValidationViews: ViewType[] = ['confals-rmsds', 'step-torsions', 'similarity-plot'];
const RefinementViews: ViewType[] = ['connectivity-plot', 'refmac-restraints', 'phenix-restraints', 'mmb-commands-file'];

function masterModeViews(mode: MasterMode): { id: ViewType, caption: string }[] {
    switch (mode) {
    case 'annotation':
        return AnnotationViews.map(view => { return { id: view, caption: AvailableViews[view].caption }; } );
    case 'validation':
        return ValidationViews.map(view => { return { id: view, caption: AvailableViews[view].caption }; } );
    case 'refinement':
        return RefinementViews.map(view => { return { id: view, caption: AvailableViews[view].caption }; } );
    }
}

interface State {
    annotationView: typeof AnnotationViews[number];
    validationView: typeof ValidationViews[number];
    refinementView: typeof RefinementViews[number];
    structureSelection: StructureSelection;
    initializationError?: string;
}
export class MainScreen extends WithSubscriptions<MainScreen.Props, State> {
    readonly viewerChangeChain = async (chain: string) => {
        await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());

        if (chain === InvalidChain)
            this.props.viewerInterop.api.command(ViewerApi.Commands.Filter(Filters.Empty()));
        else {
            const filter = Filters.Slices([{ chain }]);
            this.props.viewerInterop.api.command(ViewerApi.Commands.Filter(filter));
        }

        // Invalidate step selection when switching chains
        const structureSelection = { ...this.state.structureSelection, chain, stepId: InvalidStepId };
        this.setState({ ...this.state, structureSelection });
    }

    readonly viewerChangeModel = async (modelIndex: number) => {
        await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());
        await this.props.viewerInterop.api.command(ViewerApi.Commands.Filter(Filters.Empty()));

        if (modelIndex !== InvalidModelIndex) {
            const modelNum = this.props.dnatcofication.data.structures[0].models[modelIndex].num;
            await this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(modelNum));
        }

        // Invalidate chain and step selection when switching model
        const structureSelection = { ...this.state.structureSelection, modelIndex, chain: InvalidChain, stepId: InvalidStepId };
        this.setState({ ...this.state, structureSelection });
    }

    readonly viewerChangeStepId = async (stepId: number) => {
        if (stepId === InvalidStepId)
            await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());
        else {
            // TODO: Prev and next step display must be optional
            const selection = makeStepSelection(this.props.dnatcofication, stepId);
            await this.props.viewerInterop.api.command(ViewerApi.Commands.SelectStep(selection.current.name, selection.previous?.name, selection.next?.name));
        }

        const structureSelection = { ...this.state.structureSelection, stepId };
        this.setState({ ...this.state, structureSelection });
    }

    readonly viewerSwitching = {
        changeChain: this.viewerChangeChain,
        changeModel: this.viewerChangeModel,
        changeStepId:  this.viewerChangeStepId,
    }

    constructor(props: MainScreen.Props) {
        super(props);

        const structureSelection = StructureSelection(this.props.viewerInterop, this.props.dnatcofication);

        this.state = {
            annotationView: 'assigned-ntcs',
            validationView: 'confals-rmsds',
            refinementView: 'connectivity-plot',
            structureSelection,
        }
    }

    private renderView() {
        switch (this.props.masterMode) {
        case 'annotation':
            return Register.Views[this.state.annotationView]({
                dnatcofication: this.props.dnatcofication,
                viewerInterop: this.props.viewerInterop,
                structureSelection: this.state.structureSelection,
                switching: this.viewerSwitching,
            });
        case 'validation':
            return Register.Views[this.state.validationView]({
                dnatcofication: this.props.dnatcofication,
                viewerInterop: this.props.viewerInterop,
                structureSelection: this.state.structureSelection,
                switching: this.viewerSwitching,
            });
        case 'refinement':
            return Register.Views[this.state.refinementView]({
                dnatcofication: this.props.dnatcofication,
                viewerInterop: this.props.viewerInterop,
                structureSelection: this.state.structureSelection,
                switching: this.viewerSwitching,
            });
        }
    }

    private selectedView() {
        switch (this.props.masterMode) {
        case 'annotation':
            return this.state.annotationView;
        case 'validation':
            return this.state.validationView;
        case 'refinement':
            return this.state.refinementView;
        }
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.forceUpdate());

        this.props.viewerInterop.bind('rdo-id-molstar-container').then(() => {
            this.subscribe(
                this.props.viewerInterop.events.stepRequested,
                (name) => {
                    const stepId = StepsMapper.byName(this.props.dnatcofication, name)?.id ?? InvalidStepId;
                    if (stepId !== InvalidStepId) {
                        const selection = makeStepSelection(this.props.dnatcofication, stepId);
                        this.props.viewerInterop.api.command(ViewerApi.Commands.SelectStep(selection.current.name, selection.previous?.name, selection.next?.name));
                    }
                }
            );
            this.subscribe(
                this.props.viewerInterop.events.stepDeselected,
                () => {
                    const sel = { ...this.state.structureSelection, stepId: InvalidModelIndex };
                    this.setState({ ...this.state, structureSelection: sel });
                }
            );
            this.subscribe(
                this.props.viewerInterop.events.stepSelected,
                (v) => {
                    const name = v.name;
                    const stepId = StepsMapper.byName(this.props.dnatcofication, name)?.id ?? InvalidStepId;
                    const sel = { ...this.state.structureSelection, stepId };
                    this.setState({ ...this.state, structureSelection: sel });
                }
            );
            this.subscribe(
                this.props.viewerInterop.events.ready,
                () => this.props.viewerInterop.loadStructure(this.props.dnatcofication.rawCif())
            );
        }).catch(e => {
            this.setState({ ...this.state, initializationError: e.toString() });
        });
    }

    componentDidUpdate(prevProps: MainScreen.Props) {
        if (this.props.viewerInterop.ready()) {
            if (this.props.masterMode !== prevProps.masterMode)
                this.props.viewerInterop.api.command(ViewerApi.Commands.Redraw());
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
        this.props.viewerInterop.unbind();
    }

    render() {
        if (this.state.initializationError) {
            return (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className='rdo-error-text'>
                        Something went wrong during initialization of the interactive viewer. You may try to reload the page and try again...<br />
                        {this.state.initializationError}
                    </div>
                </div>
            );
        }

        return (
            <div className='rdo-dnatco-main-screen'>
                <ViewsList
                    views={masterModeViews(this.props.masterMode)}
                    onSwitchView={id => {
                        switch (this.props.masterMode) {
                        case 'annotation':
                            this.setState({ ...this.state, annotationView: id });
                            break;
                        case 'validation':
                            this.setState({ ...this.state, validationView: id });
                            break;
                        case 'refinement':
                            this.setState({ ...this.state, refinementView: id });
                            break;
                        }
                    }}
                    selected={this.selectedView()}
                />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div>
                        <div className='rdo-primary-caption'>
                            {this.props.dnatcofication.identifyingName}
                        </div>
                        <div className='rdo-secondary-caption'>
                           {this.props.dnatcofication.identifyingTitle}
                        </div>
                    </div>
                    <DynamicSplitView
                        containerClass='rdo-view-visualizer-container'
                        visible={AvailableViews[this.selectedView()].visualizer ? 'both' : 'first'}
                        first={
                            <div className='rdo-offset' style={{ overflow: 'hidden' }}>
                                <div className='rdo-scroll-vertically'>
                                    {this.renderView()}
                                </div>
                            </div>
                        }
                        second={
                            <div className='rdo-offset'>
                                <div id='rdo-id-molstar-container' style={{ height: '100%', position: 'relative' }} />
                            </div>
                        }
                        orientation='horizontal'
                        onAdjustDone={() => this.props.viewerInterop.api.command(ViewerApi.Commands.Redraw())}
                    />
                </div>
            </div>
        );
    }
}

export namespace MainScreen {
    export interface Props {
        dnatcofication: Dnatcofication;
        masterMode: MasterMode;
        viewerInterop: ViewerInterop;
    }
}
