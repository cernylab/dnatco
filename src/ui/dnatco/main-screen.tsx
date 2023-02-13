import React from 'react';
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

const AvailableViews: Record<ViewType, { caption: string, visualizer: boolean }> = {
    'assigned-ntcs': { caption: 'Assigned NtCs', visualizer: true },
    'structure-info': { caption: 'Structure Info', visualizer: false },
    'change-ntcs': { caption: 'Change NtCs', visualizer: true },
    'confals-rmsds':  { caption: 'Confals & RMSDs', visualizer: true },
    'similarity-plot': { caption: 'Similarity plot', visualizer: true },
    'downloads': { caption: 'Downloads', visualizer: false },
    'step-torsions': { caption: 'Step torsions', visualizer: true },
    'refmac-restraints': { caption: 'REFMAC restraints', visualizer: false },
    'phenix-restraints': { caption: 'Phenix restraints', visualizer: false },
    'mmb-commands-file': { caption: 'MMB commands file', visualizer: false },
    'connectivity-plot': { caption: 'Connectivity plot', visualizer: true },
    'rscc-plot': { caption: 'RSCC plot', visualizer: true },
    'angles-lengths': { caption: 'Bond Angles & Lengths', visualizer: true },
};
const AnnotationViews: ViewType[] = ['assigned-ntcs', 'structure-info', 'downloads'];
const ValidationViews: ViewType[] = ['confals-rmsds', 'step-torsions', 'similarity-plot', 'rscc-plot', 'angles-lengths'];
const RefinementViews: ViewType[] = ['connectivity-plot', 'refmac-restraints', 'phenix-restraints', 'mmb-commands-file', 'change-ntcs'];

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
    activeViews: {
        annotation: typeof AnnotationViews[number];
        validation: typeof ValidationViews[number];
        refinement: typeof RefinementViews[number];
    };
    structureSelection: StructureSelection;
    selectedCustomNtCSet: string;
    initializationError?: string;
}
export class MainScreen extends WithSubscriptions<MainScreen.Props, State> {
    private scrollableElemRef = React.createRef<HTMLDivElement>();

    readonly switchChain = async (chain: string) => {
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

    readonly switchModel = async (modelIndex: number) => {
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

    readonly switchStepId = async (stepId: number) => {
        const switcher = Register.Views[this.activeView()].stepSwitcher;

        if (stepId === InvalidStepId)
            await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());
        else {
            if (switcher)
                await switcher(stepId, this.props.dnatcofication, this.props.viewerInterop, this.state.selectedCustomNtCSet);
        }

        const structureSelection = { ...this.state.structureSelection, stepId };
        this.setState({ ...this.state, structureSelection });
    }

    readonly viewerSwitching = {
        switchChain: this.switchChain,
        switchModel: this.switchModel,
        switchStepId:  this.switchStepId,
    }

    constructor(props: MainScreen.Props) {
        super(props);

        const structureSelection = StructureSelection(this.props.viewerInterop, this.props.dnatcofication);

        this.state = {
            activeViews: {
                annotation: 'assigned-ntcs',
                validation: 'confals-rmsds',
                refinement: 'connectivity-plot',
            },
            structureSelection,
            selectedCustomNtCSet: '',
        }
    }

    private activeView() {
        return this.state.activeViews[this.props.masterMode];
    }

    private renderView() {
        const view = Register.Views[this.activeView()];
        const rendered = view.render({
            dnatcofication: this.props.dnatcofication,
            viewerInterop: this.props.viewerInterop,
            structureSelection: this.state.structureSelection,
            switching: this.viewerSwitching,
            selectedCustomNtCSet: this.state.selectedCustomNtCSet,
            scrollableParent: this.scrollableElemRef.current ?? void 0,
            onCustomNtCSetChanged: (set: string) => {
                if (this.props.dnatcofication.customNtCs.exists(set) || set === '')
                    this.setState({ ...this.state, selectedCustomNtCSet: set });
            }
        });

        if (view.unscrollableContainer) {
            return (
                <div className='rdo-offset' style={{ overflow: 'hidden' }}>
                    {rendered}
                </div>
            );
        } else {
            return (
                <div className='rdo-offset' style={{ overflow: 'hidden' }}>
                    <div className='rdo-scroll-vertically' ref={this.scrollableElemRef}>
                        {rendered}
                    </div>
                </div>
            );
        }
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.forceUpdate());
        this.subscribe(
            this.props.dnatcofication.customNtCs.events.changed,
            ({ set, step }) => {
                if (this.props.dnatcofication.customNtCs.empty()) {
                    this.setState({ ...this.state, selectedCustomNtCSet: '' });
                    return;
                }

                if (!this.props.dnatcofication.customNtCs.exists(set)) {
                    // The set got deleted, switch to the first available custom set
                    this.setState({ ...this.state, selectedCustomNtCSet: this.props.dnatcofication.customNtCs.sets()[0] ?? '' });
                    return;
                }

                if (set !== this.state.selectedCustomNtCSet)
                    return;

                const sel = this.props.viewerInterop.api.query('selected-step');
                if (sel.selected) {
                    const displayedStep = StepsMapper.byName(this.props.dnatcofication, sel.selected.name);
                    if (displayedStep && displayedStep.name === step)
                        this.switchStepId(displayedStep.id);
                }
            }
        )

        this.props.viewerInterop.bind('rdo-id-molstar-container').then(() => {
            this.subscribe(
                this.props.viewerInterop.events.stepRequested,
                (name) => {
                    const stepId = StepsMapper.byName(this.props.dnatcofication, name)?.id ?? InvalidStepId;
                    this.switchStepId(stepId);
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
                () => {
                    this.props.viewerInterop.loadStructure(
                        this.props.dnatcofication.rawCif(),
                        this.props.dnatcofication.data.densityMaps
                    );
                }
            );
        }).catch(e => {
            this.setState({ ...this.state, initializationError: e.toString() });
        });
    }

    componentDidUpdate(prevProps: MainScreen.Props, prevState: State) {
        if (this.props.viewerInterop.ready()) {
            if (this.props.masterMode !== prevProps.masterMode) {
                this.props.viewerInterop.api.command(ViewerApi.Commands.Redraw()).then(() => {
                    if (this.state.structureSelection.stepId !== InvalidStepId)
                        this.switchStepId(this.state.structureSelection.stepId);
                })
            } else if (this.state.activeViews[this.props.masterMode] !== prevState.activeViews[this.props.masterMode]) {
                if (this.state.structureSelection.stepId !== InvalidStepId)
                    this.switchStepId(this.state.structureSelection.stepId);
            } else if (this.state.selectedCustomNtCSet !== prevState.selectedCustomNtCSet) {
                const sel = this.props.viewerInterop.api.query('selected-step');
                if (sel.selected) {
                    const displayedStep = StepsMapper.byName(this.props.dnatcofication, sel.selected.name);
                    if (displayedStep)
                        this.switchStepId(displayedStep.id);
                }
            }
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
                        const av = { ...this.state.activeViews };
                        av[this.props.masterMode] = id;
                        this.setState({ ...this.state, activeViews: { ...av } });
                    }}
                    selected={this.activeView()}
                />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', marginLeft: 'auto', marginRight: 'auto', alignItems: 'center' }}>
                        <div className='rdo-structure-id'>
                            {this.props.dnatcofication.identifyingName}
                        </div>
                        <div className='rdo-structure-title'>
                           {this.props.dnatcofication.identifyingTitle}
                        </div>
                    </div>
                    <DynamicSplitView
                        containerClass='rdo-view-visualizer-container'
                        visible={AvailableViews[this.activeView()].visualizer ? 'both' : 'first'}
                        first={this.renderView()}
                        second={
                            <div className='rdo-offset' style={{ marginLeft: 0, overflow: 'hidden' }}>
                                <div id='rdo-id-molstar-container' style={{ height: '100%', position: 'relative' }} />
                            </div>
                        }
                        orientation='horizontal'
                        onAdjustDone={() => this.props.viewerInterop.api.command(ViewerApi.Commands.Redraw())}
                        initialSplit={0.4}
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
