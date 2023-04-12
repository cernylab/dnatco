import React from 'react';
import { Common } from './common';
import { getCifValue } from './util';
import {
    EmptySelectionPieces, EmptyStructureSelection,
    InvalidAtom, InvalidChain, InvalidModelIndex, InvalidStepId, InvalidResidue,
    SelectionDisplayer, SelectedPieces,
    StructureSelection, StructureSelectionFromViewer, StructureSelectionSwitching
} from './structure-selection';
import { ViewsList } from './views-list';
import { Register } from './views/register';
import { DynamicSplitView } from '../common/dynamic-split-view';
import { WithSubscriptions } from '../service/with-subscriptions';
import { ViewerInterop, ViewerApi } from '../../viewer/viewer-interop';
import { Em3dReconstruction } from '../../cif/categories/em-3d-reconstruction';
import { Exptl } from '../../cif/categories/experimental';
import { Refine } from '../../cif/categories/refine';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { objKeys } from '../../util';
import { EventsKeeper } from '../../util/events-keeper';
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
    'rscc-plot': { caption: 'RSCC/RMSD plot', visualizer: true },
    'angles-lengths': { caption: 'Bond Lengths & Angles', visualizer: true },
};
const AnnotationViews: ViewType[] = ['assigned-ntcs', 'structure-info', 'downloads'];
const ValidationViews: ViewType[] = ['confals-rmsds', 'step-torsions', 'similarity-plot', 'rscc-plot', 'angles-lengths'];
const RefinementViews: ViewType[] = ['connectivity-plot', 'refmac-restraints', 'phenix-restraints', 'mmb-commands-file', 'change-ntcs'];

function masterModeViews(mode: MasterMode): [id: string, item: { caption: string }][] {
    switch (mode) {
    case 'annotation':
        return AnnotationViews.map((view) => [view, { caption: AvailableViews[view].caption }]);
    case 'validation':
        return ValidationViews.map((view) => [view, { caption: AvailableViews[view].caption }]);
    case 'refinement':
        return RefinementViews.map((view) => [view, { caption: AvailableViews[view].caption }]);
    }
}

const ExcludeModelIndex = ['modelIndex'] as (keyof StructureSelection)[];
const ExcludeModelIndexAndChain = ['modelIndex', 'chain'] as (keyof StructureSelection)[];

interface State {
    activeViews: {
        annotation: typeof AnnotationViews[number];
        validation: typeof ValidationViews[number];
        refinement: typeof RefinementViews[number];
    };
    selectedCustomNtCSet: string;
    initializationError?: string;
}
export class MainScreen extends WithSubscriptions<MainScreen.Props, State> {
    private ek = new EventsKeeper();
    private scrollableElemRef = React.createRef<HTMLDivElement>();
    private structureSelection: StructureSelection = {
        modelIndex: InvalidModelIndex,
        chain: InvalidChain,
        steps: [] as StructureSelection['steps'],
        residues: [] as StructureSelection['residues'],
        atoms: [] as StructureSelection['atoms'],
    }

    readonly changeSelection = async (pieces: SelectedPieces, displayer: SelectionDisplayer) => {
        await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStructures());

        this.structureSelection.steps = [...pieces.steps];
        this.structureSelection.residues = [...pieces.residues];
        this.structureSelection.atoms = [...pieces.atoms];

        await displayer(pieces, this.props.dnatcofication, this.props.viewerInterop, this.state.selectedCustomNtCSet);

        this.structureSwitching.events.selectionChanged.next(this.structureSelection);
    }

    readonly switchChain = async (chain: string) => {
        await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStructures());

        if (chain === InvalidChain)
            this.props.viewerInterop.api.command(ViewerApi.Commands.Filter(Filters.Empty()));
        else {
            const model = this.props.dnatcofication.data.structures[0].models[this.structureSelection.modelIndex === InvalidModelIndex ? 0 : this.structureSelection.modelIndex];
            const filter = Filters.Slices([{ chain: model.chains.find((x) => x.name === chain)!.authName }]);
            this.props.viewerInterop.api.command(ViewerApi.Commands.Filter(filter));
        }

        // Invalidate step selection when switching chains
        const empty = EmptyStructureSelection(this.props.dnatcofication);
        for (const prop of objKeys(empty, ExcludeModelIndexAndChain)) {
            const v = empty[prop];
            (this.structureSelection[prop] as typeof v) = v;
        }
        this.structureSelection.chain = chain;

        this.structureSwitching.events.chainSwitched.next(this.structureSelection);
    }

    readonly switchModel = async (modelIndex: number) => {
        await this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStructures());
        await this.props.viewerInterop.api.command(ViewerApi.Commands.Filter(Filters.Empty()));

        if (modelIndex !== InvalidModelIndex) {
            const modelNum = this.props.dnatcofication.data.structures[0].models[modelIndex].num;
            await this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(modelNum));
        }

        // Invalidate chain and step selection when switching model
        const empty = EmptyStructureSelection(this.props.dnatcofication);
        for (const prop of objKeys(empty, ExcludeModelIndex)) {
            const v = empty[prop];
            (this.structureSelection[prop] as typeof v) = v;
        }
        this.structureSelection.modelIndex = modelIndex;

        this.structureSwitching.events.modelSwitched.next(this.structureSelection);
        this.structureSwitching.events.chainSwitched.next(this.structureSelection);
    }

    readonly structureSwitching: StructureSelectionSwitching = {
        changeSelection: this.changeSelection,
        switchChain: this.switchChain,
        switchModel: this.switchModel,
        events: {
            modelSwitched: this.ek.subject<StructureSelection>(),
            chainSwitched: this.ek.subject<StructureSelection>(),
            selectionChanged: this.ek.subject<StructureSelection>(),
        },
    }

    constructor(props: MainScreen.Props) {
        super(props);

        this.structureSelection = StructureSelectionFromViewer(this.props.viewerInterop, this.props.dnatcofication);

        this.state = {
            activeViews: {
                annotation: 'assigned-ntcs',
                validation: 'confals-rmsds',
                refinement: 'connectivity-plot',
            },
            selectedCustomNtCSet: '',
        }
    }

    private activeView() {
        return this.state.activeViews[this.props.masterMode];
    }

    private renderResolution() {
        const method = getCifValue(this.props.dnatcofication, Exptl, 'method');
        if (Common.MethodsWithCommonResolution.includes(method)) {
            return (
                <div>
                    <span className='rdo-emphasize'>Low:{'\u00A0'}</span><span>{getCifValue(this.props.dnatcofication, Refine, 'ls_d_res_low')?.toFixed(3) ?? 'N/A'}</span>
                    {',\u00A0'}
                    <span className='rdo-emphasize'>High:{'\u00A0'}</span><span>{getCifValue(this.props.dnatcofication, Refine, 'ls_d_res_high')?.toFixed(3) ?? 'N/A'}</span>
                </div>
            );
        } else if (method === 'electron microscopy') {
            return (
                <div>
                    <span className='rdo-emphasize'>EM:{'\u00A0'}</span><span>{getCifValue(this.props.dnatcofication, Em3dReconstruction, 'resolution')?.toFixed(3) ?? 'N/A'}</span>
                </div>
            );
        } else {
            return (
                <div>
                    <span className='rdo-emphasize'>N/A</span>
                </div>
            );
        }
    }

    private renderView() {
        const view = Register.Views[this.activeView()];
        const rendered = view.render({
            dnatcofication: this.props.dnatcofication,
            viewerInterop: this.props.viewerInterop,
            structureSelection: this.structureSelection,
            switching: this.structureSwitching,
            selectedCustomNtCSet: this.state.selectedCustomNtCSet,
            scrollableParent: this.scrollableElemRef.current ?? void 0,
            onCustomNtCSetChanged: (set: string) => {
                if (this.props.dnatcofication.customNtCs.exists(set) || set === '')
                    this.setState({ ...this.state, selectedCustomNtCSet: set });
            }
        });

        if (view.unscrollableContainer) {
            return (
                <div className='rdo-side-offset' style={{ overflow: 'hidden' }}>
                    {rendered}
                </div>
            );
        } else {
            return (
                <div className='rdo-side-offset' style={{ overflow: 'hidden' }}>
                    <div className='rdo-scroll-vertically' ref={this.scrollableElemRef}>
                        {rendered}
                    </div>
                </div>
            );
        }
    }

    private updateViewer() {
        const av = Register.Views[this.activeView()];
        const haveVisualizer = AvailableViews[this.activeView()].visualizer;

        if (haveVisualizer) {
            const pieces = {
                steps: this.structureSelection.steps,
                residues: this.structureSelection.residues,
                atoms: this.structureSelection.atoms,
                reconstruct: true,
            };
            this.changeSelection(pieces, av.selectionDisplayer);
            if (av.granularity !== 'dont-care')
                this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchSelectionGranularity(av.granularity));
            this.props.viewerInterop.api.command(ViewerApi.Commands.Freeze(false));
        } else {
            this.props.viewerInterop.api.command(ViewerApi.Commands.Freeze(true));
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

                const pieces = {
                    steps: this.structureSelection.steps,
                    residues: this.structureSelection.residues,
                    atoms: this.structureSelection.atoms,
                    reconstruct: false,
                };
                const displayer = Register.Views[this.activeView()].selectionDisplayer;
                displayer(pieces, this.props.dnatcofication, this.props.viewerInterop, this.state.selectedCustomNtCSet);
            }
        )

        this.props.viewerInterop.bind('rdo-id-molstar-container').then(() => {
            this.subscribe(
                this.props.viewerInterop.events.residueRequested,
                (residue) => {
                    const av = Register.Views[this.activeView()];
                    if (av.granularity !== 'residue')
                        return;

                    const r = StructureSelection.authToCifResidue(this.props.dnatcofication.data.structures[0], residue);
                    if (r) {
                        const pieces = Register.Views[this.activeView()].selectionMaker(
                            InvalidStepId, r , InvalidAtom,
                            this.structureSelection.steps, this.structureSelection.residues, this.structureSelection.atoms,
                            this.props.dnatcofication
                        );
                        this.changeSelection(pieces, Register.Views[this.activeView()].selectionDisplayer);
                    }
                }
            ),
            this.subscribe(
                this.props.viewerInterop.events.stepRequested,
                (name) => {
                    const av = Register.Views[this.activeView()];
                    if (av.granularity !== 'two-residues')
                        return;


                    const stepId = StepsMapper.byName(this.props.dnatcofication, name)?.id;
                    if (stepId !== undefined) {
                        const pieces = Register.Views[this.activeView()].selectionMaker(
                            stepId, InvalidResidue, InvalidAtom,
                            this.structureSelection.steps, this.structureSelection.residues, this.structureSelection.atoms,
                            this.props.dnatcofication
                        );
                        this.changeSelection(pieces, Register.Views[this.activeView()].selectionDisplayer);
                    }
                }
            );
            this.subscribe(
                this.props.viewerInterop.events.structuresDeselected,
                () => {
                    this.structureSelection.steps.splice(0, this.structureSelection.steps.length);
                    this.structureSelection.residues.splice(0, this.structureSelection.residues.length);
                    this.structureSelection.atoms.splice(0, this.structureSelection.atoms.length);

                    this.changeSelection(EmptySelectionPieces, Register.Views[this.activeView()].selectionDisplayer);
                }
            );

            this.subscribe(
                this.props.viewerInterop.events.ready,
                () => {
                    this.props.viewerInterop.loadStructure(
                        this.props.dnatcofication.rawCif(),
                        1,
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
                this.updateViewer();
            } else if (this.state.activeViews[this.props.masterMode] !== prevState.activeViews[this.props.masterMode]) {
                this.updateViewer();
            } else if (this.state.selectedCustomNtCSet !== prevState.selectedCustomNtCSet) {
                if (this.props.masterMode === 'refinement')
                    this.updateViewer();
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
                    <div className='rdo-structure-caption'>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', alignItems: 'center' }}>
                            <div className='rdo-structure-id'>
                                {this.props.dnatcofication.identifyingName}
                            </div>
                            <div className='rdo-structure-title'>
                               {this.props.dnatcofication.identifyingTitle}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 'var(--h-gap)' }}>
                            <div className='rdo-strong'>Resolution</div>
                            {this.renderResolution()}
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
