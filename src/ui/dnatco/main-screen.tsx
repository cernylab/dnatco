import React from 'react';
import { useLocation, useNavigate, useRoutes, Navigate } from 'react-router';
import { Subject, Subscription } from 'rxjs';
import {
    EmptySelectionPieces,
    SelectionDisplayer, SelectedPieces,
    StructureSelectionFromViewer, StructureSelectionSwitching
} from './structure-selection';
import { ViewsList } from './views-list';
import { Register } from './views/register';
import { OutsideControl } from '../dnatco-viewer-tab';
import { DynamicSplitView } from '../common/dynamic-split-view';
import { ViewerInterop, ViewerApi } from '../../viewer/viewer-interop';
import { Em3dReconstruction } from '../../cif/categories/em-3d-reconstruction';
import { Exptl } from '../../cif/categories/experimental';
import { Refine } from '../../cif/categories/refine';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { Logger } from '../../log/logger';
import { navPath, objKeys } from '../../util';
import { getCifValue, Common } from '../../util/dnatco';
import {
    EmptyStructureSelection,
    InvalidAtom, InvalidChain, InvalidModelIndex, InvalidStepId, InvalidResidue,
    StructureSelection
} from '../../util/structure-selection';
import { GlobalConfig } from '../../global-config';
import { Filters } from 'viewer-filters';

// We are not referencing these assets anywhere in the code, we just need to pull them in
import 'assets/molstar.js';
import 'assets/molstar.css';

const MasterMode = ['annotation', 'validation', 'refinement'] as const;
export type MasterMode = typeof MasterMode[number];
type ViewId = keyof typeof Register.Views;

type DnatcoMode = {
    master: MasterMode,
    viewId: ViewId
};

const AvailableViews: Record<ViewId, { caption: string }> = {
    'assigned-ntcs': { caption: 'Assigned NtCs' },
    'structure-info': { caption: 'Structure Info' },
    'change-ntcs': { caption: 'Change NtCs' },
    'confals-rmsds':  { caption: 'Confals & RMSDs'},
    'similarity-plot': { caption: 'Similarity plot' },
    'downloads': { caption: 'Downloads' },
    'step-torsions': { caption: 'Step torsions' },
    'refmac-restraints': { caption: 'REFMAC restraints' },
    'phenix-restraints': { caption: 'Phenix restraints' },
    'mmb-commands-file': { caption: 'MMB commands file' },
    'connectivity-plot': { caption: 'Connectivity plot' },
    'rscc-plot': { caption: 'RSCC/RMSD plot' },
    'angles-lengths': { caption: 'Bond Lengths & Angles' },
};
const ViewsInMode: Record<MasterMode, [ViewId, Register.View<any>][]> = {
    'annotation': [
        ['assigned-ntcs', Register.Views['assigned-ntcs']],
        ['structure-info', Register.Views['structure-info']],
        ['downloads', Register.Views['downloads']],
    ],
    'refinement': [
        ['connectivity-plot', Register.Views['connectivity-plot']],
        ['refmac-restraints', Register.Views['refmac-restraints']],
        ['phenix-restraints', Register.Views['phenix-restraints']],
        ['mmb-commands-file', Register.Views['mmb-commands-file']],
        ['change-ntcs', Register.Views['change-ntcs']],
    ],
    'validation': [
        ['confals-rmsds', Register.Views['confals-rmsds']],
        ['step-torsions', Register.Views['step-torsions']],
        ['similarity-plot', Register.Views['similarity-plot']],
        ['rscc-plot', Register.Views['rscc-plot']],
        ['angles-lengths', Register.Views['angles-lengths']],
    ]
}

function masterModeViews(mode: MasterMode): [id: ViewId, item: { caption: string }][] {
    return ViewsInMode[mode].map(([viewId, _]) => [viewId, { caption: AvailableViews[viewId].caption }]);
}

const ExcludeModelIndex = ['modelIndex'] as (keyof StructureSelection)[];
const ExcludeModelIndexAndChain = ['modelIndex', 'chain'] as (keyof StructureSelection)[];

function locationToDnatcoMode(location: string): DnatcoMode {
    const segments = location.split('/');

    if (segments[1] !== 'app' && segments[2] !== 'dnatco')
        throw new Error(`Invalid route ${segments[1]}/${segments[2]}`);

    const master = segments[3];
    const viewId = segments[4];

    if (!master || !(MasterMode as Readonly<string[]>).includes(master))
        return { master: 'annotation', viewId: 'assigned-ntcs' };

    const viewsInMode = ViewsInMode[master as MasterMode];
    const view = viewsInMode.find(([id, _]) => id === viewId);

    const _viewId = (view ? viewId : viewsInMode[0][0]) as ViewId;

    return { master: master as MasterMode, viewId: _viewId };
}

function Inner(props: {
    mode: DnatcoMode,
    onCustomNtCSetChanged: (set: string) => void,
    dnatcofication: Dnatcofication,
    viewerInterop: ViewerInterop,
    structureSelection: StructureSelection,
    switching: StructureSelectionSwitching,
    selectedCustomNtCSet: string,
}) {
    const navigate = useNavigate();
    const views = masterModeViews(props.mode.master);
    const routeElems = ViewsInMode[props.mode.master].map(([viewId, view]) => ({
        path: viewId as string,
        element: <ViewWrapper view={view} {...props} />
    }));
    routeElems.push({
        path: '*',
        element: <ViewWrapper
            view={ViewsInMode[props.mode.master][0][1]}
            {...props}
        />
    });

    const view = ViewsInMode[props.mode.master].find(([viewId, _]) => props.mode.viewId === viewId)![1];
    const routes = useRoutes(routeElems);

    return (
        <>
            <ViewsList
                views={views}
                onSwitchView={viewId => navigate(`/app/dnatco/${props.mode.master}/${viewId}`)}
                selected={props.mode.viewId}
            />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <StructureCaption d={props.dnatcofication} />
                <DynamicSplitView
                    containerClass='rdo-view-visualizer-container'
                    visible={view.visualizer ? 'both' : 'first'}
                    first={routes}
                    second={
                        <div className='rdo-offset' style={{ marginLeft: 0, overflow: 'hidden' }}>
                            <div id='rdo-id-molstar-container' style={{ height: '100%', position: 'relative' }} />
                        </div>
                    }
                    orientation='horizontal'
                    onAdjustDone={() => {
                        const tryRedraw = (attempt: number) => {
                            const maxAttempts = 3;
                            if (attempt === maxAttempts)
                                return;

                            if (props.viewerInterop.ready())
                                props.viewerInterop.api.command(ViewerApi.Commands.Redraw());
                            else {
                                Logger.log(Logger.Severity.Warning, `Viewer was not ready on attempt ${attempt + 1}`);
                                setTimeout(() => tryRedraw(attempt + 1), 100);
                            }
                        };

                        // The viewer may not be ready right away, allow it some time to settle
                        // before we tell it to draw itself.
                        tryRedraw(0);
                    }}
                    initialSplit={0.4}
                />
            </div>
        </>
    );
}

function Resolution(props: { d: Dnatcofication }) {
    const method = getCifValue(props.d, Exptl, 'method');
    if (Common.MethodsWithCommonResolution.includes(method)) {
        return (
            <div>
                <span className='rdo-emphasize'>Low:{'\u00A0'}</span><span>{getCifValue(props.d, Refine, 'ls_d_res_low')?.toFixed(3) ?? 'N/A'}</span>
                {',\u00A0'}
                <span className='rdo-emphasize'>High:{'\u00A0'}</span><span>{getCifValue(props.d, Refine, 'ls_d_res_high')?.toFixed(3) ?? 'N/A'}</span>
            </div>
        );
    } else if (method === 'electron microscopy') {
        return (
            <div>
                <span className='rdo-emphasize'>EM:{'\u00A0'}</span><span>{getCifValue(props.d, Em3dReconstruction, 'resolution')?.toFixed(3) ?? 'N/A'}</span>
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

function StructureCaption(props: { d: Dnatcofication }) {
    return (
        <div className='rdo-structure-caption'>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', alignItems: 'center' }}>
                <div className='rdo-structure-id'>
                    {props.d.identifyingName}
                </div>
                <div className='rdo-structure-title'>
                   {props.d.identifyingTitle}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 'var(--h-gap)' }}>
                <div className='rdo-strong'>Resolution</div>
                <Resolution d={props.d} />
            </div>
        </div>
    );
}

function ViewWrapper<T extends keyof Register.PropsType>(props: {
    view: Register.View<T>
    dnatcofication: Dnatcofication,
    viewerInterop: ViewerInterop,
    structureSelection: StructureSelection,
    switching: StructureSelectionSwitching,
    selectedCustomNtCSet: string,
    onCustomNtCSetChanged: (set: string) => void,
}) {
    const scrollableElemRef = React.useRef<HTMLDivElement>(null);

    const rendered = props.view.render({
        dnatcofication: props.dnatcofication,
        viewerInterop: props.viewerInterop,
        structureSelection: props.structureSelection,
        switching: props.switching,
        selectedCustomNtCSet: props.selectedCustomNtCSet,
        scrollableParent: scrollableElemRef,
        onCustomNtCSetChanged: props.onCustomNtCSetChanged,
    });

    if (props.view.unscrollableContainer) {
        return (
            <div className='rdo-side-offset' style={{ overflow: 'hidden' }}>
                {rendered}
            </div>
        );
    } else {
        return (
            <div className='rdo-side-offset' style={{ overflow: 'hidden' }}>
                <div className='rdo-scroll-vertically' ref={scrollableElemRef}>
                    {rendered}
                </div>
            </div>
        );
    }
}

// See MainScreen below
export class SelectedNtCSetDumbWorkaroundWrapperDataClassMemoizableItem {
    constructor(public set: string) {
    }
}

export function MainScreen(props: {
    dnatcofication: Dnatcofication,
    viewerInterop: ViewerInterop,
    outsideControl: OutsideControl,
}) {
    if (props.dnatcofication.isEmpty())
        return <Navigate to='/app' />;

    const structureSelection = React.useMemo<StructureSelection>(() => StructureSelectionFromViewer(props.viewerInterop, props.dnatcofication), []);

    const changeSelection = async (pieces: SelectedPieces, displayer: SelectionDisplayer) => {
        await props.viewerInterop.api.command(ViewerApi.Commands.DeselectStructures());

        structureSelection.steps = [...pieces.steps];
        structureSelection.residues = [...pieces.residues];
        structureSelection.atoms = [...pieces.atoms];

        await displayer(pieces, props.dnatcofication, props.viewerInterop, selectedCustomNtCSet);

        structureSwitching.events.selectionChanged.next(structureSelection);
    }

    const switchChain = async (chain: string) => {
        await props.viewerInterop.api.command(ViewerApi.Commands.DeselectStructures());

        if (chain === InvalidChain)
            props.viewerInterop.api.command(ViewerApi.Commands.Filter(Filters.Empty()));
        else {
            const model = props.dnatcofication.data.structures[0].models[structureSelection.modelIndex === InvalidModelIndex ? 0 : structureSelection.modelIndex];
            const filter = Filters.Slices([{ chain: model.chains.find((x) => x.name === chain)!.authName }]);
            props.viewerInterop.api.command(ViewerApi.Commands.Filter(filter));
        }

        // Invalidate step selection when switching chains
        const empty = EmptyStructureSelection(props.dnatcofication);
        for (const prop of objKeys(empty, ExcludeModelIndexAndChain)) {
            const v = empty[prop];
            (structureSelection[prop] as typeof v) = v;
        }
        structureSelection.chain = chain;

        structureSwitching.events.chainSwitched.next(structureSelection);
    }

    const switchModel = async (modelIndex: number) => {
        await props.viewerInterop.api.command(ViewerApi.Commands.DeselectStructures());
        await props.viewerInterop.api.command(ViewerApi.Commands.Filter(Filters.Empty()));

        if (modelIndex !== InvalidModelIndex) {
            const modelNum = props.dnatcofication.data.structures[0].models[modelIndex].num;
            await props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(modelNum));
        }

        // Invalidate chain and step selection when switching model
        const empty = EmptyStructureSelection(props.dnatcofication);
        for (const prop of objKeys(empty, ExcludeModelIndex)) {
            const v = empty[prop];
            (structureSelection[prop] as typeof v) = v;
        }
        structureSelection.modelIndex = modelIndex;

        structureSwitching.events.modelSwitched.next(structureSelection);
        structureSwitching.events.chainSwitched.next(structureSelection);
    }

    const structureSwitching = React.useMemo<StructureSelectionSwitching>(() => ({
        changeSelection: changeSelection,
        switchChain: switchChain,
        switchModel: switchModel,
        events: {
            modelSwitched: new Subject<StructureSelection>(),
            chainSwitched: new Subject<StructureSelection>(),
            selectionChanged: new Subject<StructureSelection>(),
        },
    }), []);

    const updateViewer = (view: Register.View<any>, pieces: SelectedPieces, vi: ViewerInterop) => {
        if (view.visualizer) {
            changeSelection(pieces, view.selectionDisplayer);

            if (view.granularity !== 'dont-care')
                vi.api.command(ViewerApi.Commands.SwitchSelectionGranularity(view.granularity));
            vi.api.command(ViewerApi.Commands.Freeze(false));
        } else
            vi.api.command(ViewerApi.Commands.Freeze(true));
    }

    const location = useLocation();
    const navigate = useNavigate();

    const [initializationError, setInitializationError] = React.useState('');
    const [selectedCustomNtCSet, setSelectedCustomNtCSet] = React.useState('');
    const [dnatcoMode, setDnatcoMode] = React.useState(locationToDnatcoMode(location.pathname));

    /*
     * I would lie if I told you that I fully understand what is going on here but here is the deal.
     * When we initially set the value of "selectedCustomNtCSet" when the component mounts, this initial
     * value appears to get captured in the event handlers and any changes to it will not be visible.
     * To get around this we create a permanent helper object with a property "set" which we will update
     * every time the value of "selectedCustomNtCSet" changes. Since the handlers will capture a reference
     * to this object and not the values in it, this allows us to haxxor around this fun issue.
     * We also make sure that we give the helper object an appropriate name.
     */
    const dumb = React.useMemo(() => new SelectedNtCSetDumbWorkaroundWrapperDataClassMemoizableItem(selectedCustomNtCSet), []);

    React.useEffect(() => {
        const subs: Subscription[] = [];

        /*
         * BEWARE: We need to use the raw location from window.location and not the location from react-router hook.
         * Hook value gets stuck at its initial value in the event handlers.
         * We also need to use the "navPath()" helper to get the correct path because react-router abstracts away
         * the difference between "pathname" and "hash".
         * Sigh...
         */

        // There is no reasonable way how to force an update on functional components. Let's hope this hack works. Sigh...
        subs.push(props.dnatcofication.events.structureChanged.subscribe(() => navigate(location)));

        // Wire up changes in the custom NtC set
        subs.push(
            props.dnatcofication.customNtCs.events.setsCleared.subscribe(() => setSelectedCustomNtCSet(''))
        );
        subs.push(
            props.dnatcofication.customNtCs.events.setDeleted.subscribe((name) => {
                if (name === dumb.set) {
                    if (props.dnatcofication.customNtCs.isEmpty())
                        setSelectedCustomNtCSet('');
                    else
                        setSelectedCustomNtCSet(props.dnatcofication.customNtCs.sets()[0]);
                }
            }
        ));
        subs.push(
            props.dnatcofication.customNtCs.events.setRenamed.subscribe(({ oldName, newName }) => {
                if (dumb.set === oldName)
                    setSelectedCustomNtCSet(newName);
            }
        ));
        subs.push(
            props.dnatcofication.customNtCs.events.setChanged.subscribe(({ set, step }) => {
                if (set !== dumb.set)
                    return;

                const pieces = {
                    steps: structureSelection.steps,
                    residues: structureSelection.residues,
                    atoms: structureSelection.atoms,
                    reconstruct: false,
                };

                const mode = locationToDnatcoMode(navPath(window.location)); // See the BEWARE above
                const displayer = Register.Views[mode.viewId].selectionDisplayer;
                displayer(pieces, props.dnatcofication, props.viewerInterop, dumb.set);
            }
        ));

        subs.push(
            props.outsideControl.selectStep.subscribe((stepName) => {
                const mode = locationToDnatcoMode(navPath(window.location)); // See the BEWARE above
                const view = Register.Views[mode.viewId];

                const stepId = StepsMapper.byName(props.dnatcofication, stepName)?.id;
                if (stepId) {
                    const pieces = view.selectionMaker(
                        stepId, InvalidResidue, InvalidAtom,
                        [], [], [], // Discard any previously selected parts of the structure
                        props.dnatcofication
                    );
                    changeSelection(pieces, view.selectionDisplayer);
                }
            }
        ));

        props.viewerInterop.bind(
            'rdo-id-molstar-container',
            {
                highlightColor: GlobalConfig.data().highlightColor,
                highlightThickness: GlobalConfig.data().highlightThickness,
                hydogensInReferences: GlobalConfig.data().showHydrogensInReferences,
            }
        ).then(() => {
            subs.push(props.viewerInterop.events.residueRequested.subscribe((residue) => {
                const mode = locationToDnatcoMode(navPath(window.location)); // See the BEWARE above
                const view = Register.Views[mode.viewId];
                if (view.granularity !== 'residue')
                    return;

                const r = StructureSelection.authToCifResidue(props.dnatcofication.data.structures[0], residue);
                if (r) {
                    const pieces = view.selectionMaker(
                        InvalidStepId, r , InvalidAtom,
                        structureSelection.steps, structureSelection.residues, structureSelection.atoms,
                        props.dnatcofication
                    );
                    changeSelection(pieces, view.selectionDisplayer);
                }
            }));

            subs.push(props.viewerInterop.events.stepRequested.subscribe((name) => {
                const mode = locationToDnatcoMode(navPath(window.location)); // See the BEWARE above
                const view = Register.Views[mode.viewId];
                if (view.granularity !== 'two-residues')
                    return;

                const stepId = StepsMapper.byName(props.dnatcofication, name)?.id;
                if (stepId !== undefined) {
                    const pieces = view.selectionMaker(
                        stepId, InvalidResidue, InvalidAtom,
                        structureSelection.steps, structureSelection.residues, structureSelection.atoms,
                        props.dnatcofication
                    );
                    changeSelection(pieces, view.selectionDisplayer);
                }
            }));

            subs.push(props.viewerInterop.events.structuresDeselected.subscribe(() => {
                structureSelection.steps.splice(0, structureSelection.steps.length);
                structureSelection.residues.splice(0, structureSelection.residues.length);
                structureSelection.atoms.splice(0, structureSelection.atoms.length);

                const mode = locationToDnatcoMode(navPath(window.location)); // See the BEWARE above
                const view = Register.Views[mode.viewId];

                changeSelection(EmptySelectionPieces, view.selectionDisplayer);
            }));

            subs.push(props.viewerInterop.events.ready.subscribe(() => {
                props.viewerInterop.loadStructure(
                    props.dnatcofication.rawCif(),
                    1,
                    props.dnatcofication.data.densityMaps
                );
            }));
        }).catch((e) => {
            setInitializationError(e.toString());
        });

        return () => {
            subs.forEach((sub) => sub.unsubscribe());
            props.viewerInterop.unbind();
        };
    }, []);

    React.useEffect(() => {
        const newDnatcoMode = locationToDnatcoMode(location.pathname);

        if (props.viewerInterop.ready()) {
            // We don't have to update the viewer every single time when dnatcoMode changes.
            // Let's take advantage of the fact that we have the current and next value of dnatcoMode
            // available here and update the viewer right now, if needed

            const currentView = Register.Views[dnatcoMode.viewId];
            const nextView = Register.Views[newDnatcoMode.viewId];
            if (
                dnatcoMode.master !== newDnatcoMode.master ||
                currentView.visualizer !== nextView.visualizer ||
                currentView.selectionDisplayer !== nextView.selectionDisplayer
            ) {
                const wipeSelection = currentView.granularity !== nextView.granularity;
                const pieces = {
                    steps:  wipeSelection ? [] : [...structureSelection.steps],
                    residues: wipeSelection ? [] : [...structureSelection.residues],
                    atoms: wipeSelection ? [] : [...structureSelection.atoms],
                    reconstruct: wipeSelection,
                };

                updateViewer(nextView, pieces, props.viewerInterop);
            }
        }
        setDnatcoMode(newDnatcoMode);
    }, [location]);

    React.useEffect(() => {
        dumb.set = selectedCustomNtCSet; // Update the helper object first

        if (dnatcoMode.master === 'refinement') {
            const view = Register.Views[dnatcoMode.viewId];
            const pieces = {
                steps: [...structureSelection.steps],
                residues: [...structureSelection.residues],
                atoms: [...structureSelection.atoms],
                reconstruct: true,
            };
            updateViewer(view, pieces, props.viewerInterop);
        }
    }, [selectedCustomNtCSet]);

    if (initializationError) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className='rdo-error-text'>
                    Something went wrong during initialization of the interactive viewer. You may try to reload the page and try again...<br />
                    {initializationError}
                </div>
            </div>
        );
    }

    return (
        <div className='rdo-dnatco-main-screen'>
            <Inner
                mode={dnatcoMode}
                dnatcofication={props.dnatcofication}
                viewerInterop={props.viewerInterop}
                structureSelection={structureSelection}
                switching={structureSwitching}
                selectedCustomNtCSet={selectedCustomNtCSet}
                onCustomNtCSetChanged={(set: string) => {
                    if (props.dnatcofication.customNtCs.exists(set) || set === '')
                        setSelectedCustomNtCSet(set);
                }}
            />
        </div>
    );
}
