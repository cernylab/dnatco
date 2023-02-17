import React from 'react';
import * as RDC from 'react-dom/client';
import { GlobalConfig } from './global-config';
import { isPdbId } from './util';
import { Net } from './util/net';
import { isError } from './dnatco';
import { AnglesLengths, AnglesLengthsContext } from './dnatco/angles-lengths';
import { ClassificationContext } from './dnatco/classification-context';
import { ClassificationResources } from './dnatco/classification-resources';
import { Coordinates } from './dnatco/coordinates';
import { DensityMap } from './dnatco/density-map';
import { Dnatcofication, DnatcoficationData } from './dnatco/dnatcofication';
import { ListOfConformers } from './dnatco/list-of-conformers';
import { Step } from './dnatco/step';
import { StepsMapper } from './dnatco/steps-mapper';
import { UserRemoteDatabases } from './remote/db/register';
import { StaticDb } from './remote/db/static-db';
import { AboutTab } from './ui/about-tab';
import { DnatcoViewerTab } from './ui/dnatco-viewer-tab';
import { Footer } from './ui/footer';
import { ConformersTab } from './ui/conformers-tab';
import { NavigationBar } from './ui/navigation-bar';
import { StartTab } from './ui/start-tab';
import { Popup } from './ui/common/popup';
import { InProgress } from './ui/common/in-progress';
import { QuestionDialog } from './ui/common/question-dialog';
import { Constants } from './ui/dnatco/constants';
import { MainScreen } from './ui/dnatco/main-screen';
import { WithSubscriptions } from './ui/service/with-subscriptions';
import { formatErrorText } from './ui/util';
import { Search } from './remote/search';
import { BackgroundWorker, WorkerMessage } from './tasks/worker';
import { ViewerApi, ViewerInterop } from './viewer/viewer-interop';
import { Task } from './tasks/task';
import { Globals } from './globals';
import 'assets/conformers.csv';
// Image assets
import 'assets/imgs/elixir.png';
import 'assets/imgs/home.svg';
import 'assets/imgs/ibt.png';
import 'assets/imgs/info.svg';
import 'assets/imgs/magnifying-glass.svg';
import 'assets/imgs/list.svg';
import 'assets/imgs/task.svg';
import 'assets/imgs/loop.svg';
import 'assets/imgs/document.svg';
// Base assets
import 'assets/index.php';
import 'assets/rednatco.css';

const Params = {
    cifcode: '',
    stepName: '',
};

const TabsForModes = {
    nothing: {
        start: {
            icon: 'imgs/home.svg',
            caption: 'Home',
            enabled: true,
        },
        annotation: {
            icon: 'imgs/list.svg',
            caption: 'Annotation',
            enabled: false,
        },
        validation: {
            icon: 'imgs/task.svg',
            enabled: false,
            caption: 'Validation',
        },
        refinement: {
            icon: 'imgs/loop.svg',
            caption: 'Refinement',
            enabled: false,
        },
        'list-of-conformers': {
            icon: 'imgs/document.svg',
            caption: 'Conformers',
            enabled: true,
        },
        about: {
            icon: 'imgs/info.svg',
            caption: 'About',
            enabled: true,
        }
    },
    structure: {
        start: {
            icon: 'imgs/home.svg',
            caption: 'Home',
            enabled: true,
        },
        annotation: {
            icon: 'imgs/list.svg',
            caption: 'Annotation',
            enabled: true,
        },
        validation: {
            icon: 'imgs/task.svg',
            enabled: true,
            caption: 'Validation',
        },
        refinement: {
            icon: 'imgs/loop.svg',
            caption: 'Refinement',
            enabled: true,
        },
        'list-of-conformers': {
            icon: 'imgs/document.svg',
            caption: 'Conformers',
            enabled: true,
        },
        about: {
            icon: 'imgs/info.svg',
            caption: 'About',
            enabled: true,
        }
    },
    browse: {
        start: {
            icon: 'imgs/home.svg',
            caption: 'Home',
            enabled: true,
        },
        annotation: {
            icon: 'imgs/list.svg',
            caption: 'Annotation',
            enabled: true,
        },
        'list-of-conformers': {
            icon: 'imgs/document.svg',
            caption: 'Conformers',
            enabled: true,
        },
        about: {
            icon: 'imgs/info.svg',
            caption: 'About',
            enabled: true,
        }
    },

};

type TabKeys = ((keyof (typeof TabsForModes)['nothing']) | (keyof (typeof TabsForModes['structure'])) | (keyof (typeof TabsForModes['browse'])));

interface State {
    mode: keyof typeof TabsForModes;
    selectedTab: TabKeys;
    dnatcofierState: 'ready' | 'initializing' | 'failed';
}
export class App extends WithSubscriptions<{}, State> {
    private dnatcofication = new Dnatcofication();
    private search = new Search();
    private ingestionInProgress = false;
    private viewerInterop = new ViewerInterop();
    private initialSearchDone = false;

    constructor(props: Partial<App.Props>) {
        super(props);

        this.state = {
            mode: 'nothing',
            selectedTab: 'start',
            dnatcofierState: 'initializing',
        };
    }

    private goToStep(stepName: string) {
        const step = StepsMapper.byName(this.dnatcofication, stepName);
        if (step) {
            // Use an arbitrary delay to give Molstar some time to settle
            // Not doing this may result in broken rendering
            setTimeout(
                () => {
                    this.viewerInterop.api.command(ViewerApi.Commands.SelectStep(
                        ViewerApi.Payloads.StepSelection(stepName, { NtC: step.closestNtC, color: Constants.StepColor }),
                        void 0,
                        void 0
                    ));
                },
                200
            );
        }
    }

    private fromCustomStructure(coordsFile: File, densityMaps: { file: File, kind: DensityMap['kind'] }[], densityMapCoeffs: File|null, onSuccess: () => void) {
        const coordsType = Coordinates.guessType(coordsFile);
        if (coordsType === 'unknown') {
            Popup.create(
                <>
                    {formatErrorText('Cannot process structure')}
                    {formatErrorText('Cannot infer type of coordinates file')}
                </>
            );
            return;
        }

        const doTask = (coeffs: File|null) => {
           const task: Task<{ coords: {
                file: File, type: Coordinates['type'] },
                densityMaps: { file: File, kind: DensityMap['kind'] }[],
                densityMapCoeffs: File|null,
                clsfResData: ClassificationResources.Data
                alCtx: AnglesLengthsContext,
            }> = {
                taskFunc: 'dnatco-from-custom-structure',
                payload: {
                    coords: { file: coordsFile, type: coordsType },
                    densityMaps,
                    densityMapCoeffs: coeffs,
                    clsfResData: ClassificationContext.data(),
                    alCtx: AnglesLengths.context(),
                },
                initialStatus: ''
            };

            this.loadStructure(task, onSuccess);
        }

        if (densityMapCoeffs) {
            QuestionDialog.create({
                caption: 'Upload structure for external processing?',
                text: (
                    <div>
                        You attached a map coefficients file to the structure. {Globals.ProductName} can use this information to calculate additional validation information about the structure. To do this calculation, {Globals.ProductName} must upload your structure and the map coefficients to an external server for processing.
                        <div className='rdo-line-spacer' />
                        Is this okay?
                    </div>
                ),
                answers: [
                    { text: 'Yes', code: 1 },
                    { text: 'No', code: 0 },
                ],
                onAnswered: (code) => doTask(code === 1 ? densityMapCoeffs : null)
            });
        } else
            doTask(null);
    }

    private fromPdbId(pdbId: string, dbId: string, onSuccess: () => void) {
        const task: Task<{ pdbId: string, dbId: string, clsfResData: ClassificationResources.Data, alCtx: AnglesLengthsContext, userDatabases: StaticDb[] }> = {
            taskFunc: 'dnatco-from-pdb-id',
            payload: { pdbId, dbId, clsfResData: ClassificationContext.data(), alCtx: AnglesLengths.context(), userDatabases: UserRemoteDatabases._export() },
            initialStatus: ''
        };

        this.loadStructure(task, onSuccess);
    }

    private async fromRawLink(link: string, onSuccess: () => void) {
        const task: Task<{ link: string, clsfResData: ClassificationResources.Data, alCtx: AnglesLengthsContext }> = {
            taskFunc: 'dnatco-from-raw-link',
            payload: { link, clsfResData: ClassificationContext.data(), alCtx: AnglesLengths.context() },
            initialStatus: ''
        };

        this.loadStructure(task, onSuccess);
    }

    private async loadStructure<P>(task: Task<P>, onSuccess: () => void) {
        if (this.ingestionInProgress)
            return void 0;

        this.ingestionInProgress = true;

        const inProgressDlg = await InProgress.create('Processing structure', 'Preparing', true);
        const worker = BackgroundWorker<DnatcoficationData, P>();
        worker.onerror = (ev) => {
            worker.terminate();
            InProgress.dismiss(inProgressDlg);
            this.ingestionInProgress = false;

            Popup.create(
                <>
                    {formatErrorText('Cannot process structure')}
                    {formatErrorText(`Internal error: ${ev.error?.message ?? 'Unspecified error'}`)}
                </>
            );
        }

        worker.onmessage = (ev: MessageEvent<WorkerMessage.Out<DnatcoficationData>>) => {
            const data = ev.data;

            if (data.type === 'worker-ready') {
                InProgress.bindAbort(inProgressDlg, () => {
                    worker.terminate();
                    InProgress.dismiss(inProgressDlg);
                    this.ingestionInProgress = false;
                });

                worker.postMessage({ type: 'start-task', task });
            } else if (data.type === 'status-changed') {
                InProgress.update(inProgressDlg, 'Processing structure', data.status);
                this.ingestionInProgress = false;
            } else if (data.type === 'finished') {
                InProgress.dismiss(inProgressDlg);
                this.ingestionInProgress = false;

                if (data.finished.state === 'failed') {
                    Popup.create(
                        <>
                            {formatErrorText('Cannot process structure')}
                            {formatErrorText(data.finished.message ?? 'Unspecified error')}
                         </>
                    );
                } else if (data.finished.state === 'succeeded') {
                    this.dnatcofication.setData(data.finished.data!);
                    onSuccess();
                } else if (data.finished.state === 'aborted')
                    worker.terminate();
            }
        }
    }

    private renderTab() {
        switch (this.state.selectedTab) {
        case 'start':
            return (
                <StartTab
                    onDoCustomStructure={(coordsFile, densityMaps, densityMapCoeffs) => {
                        this.fromCustomStructure(
                            coordsFile,
                            densityMaps,
                            densityMapCoeffs,
                            () => this.setState({ ...this.state, mode: 'structure', selectedTab: 'annotation' })
                        )
                    }}
                    onDoPdbId={(pdbId, db) => {
                        this.fromPdbId(
                            pdbId,
                            db,
                            () => this.setState({ ...this.state, mode: 'structure', selectedTab: 'annotation' })
                        )
                    }}
                    onDoRawLink={link => {
                        this.fromRawLink(
                            link,
                            () => this.setState({ ...this.state, mode: 'structure', selectedTab: 'annotation' })
                        )
                    }}
                    onDoSearchConformers={(options) => this.searchConformers(options)}
                    dnatcofierState={this.state.dnatcofierState}
                />
            );
        case 'annotation':
            return (
                <DnatcoViewerTab>
                    <MainScreen
                        dnatcofication={this.dnatcofication}
                        masterMode='annotation'
                        viewerInterop={this.viewerInterop}
                    />
                </DnatcoViewerTab>
            );
        case 'validation':
            return (
                <DnatcoViewerTab>
                    <MainScreen
                        dnatcofication={this.dnatcofication}
                        masterMode='validation'
                        viewerInterop={this.viewerInterop}
                    />
                </DnatcoViewerTab>
            );
        case 'refinement':
            return (
                <DnatcoViewerTab>
                    <MainScreen
                        dnatcofication={this.dnatcofication}
                        masterMode='refinement'
                        viewerInterop={this.viewerInterop}
                    />
                </DnatcoViewerTab>
            );
        case 'list-of-conformers':
            return (
                <ConformersTab
                    criteria={this.search.criteria}
                    onSearch={(criteria) => this.searchConformers(criteria)}
                    onStepSelected={(stepName) => this.showSearchResult(stepName)}
                    steps={this.search.results}
                />
            );
        default:
            return <AboutTab />
        }
    }

    private tabSwitched(tk: TabKeys) {
        if (this.state.mode === 'nothing' && ['annotation', 'validation', 'refinement'].includes(tk)) {
            Popup.create(
                <div>
                    No structure is loaded. Please load a structure on the <i>Home</i> tab to activate these tabs.
                </div>
            );
        } else
            this.setState({ ...this.state, selectedTab: tk });
    }

    private async searchConformers(criteria: Search.Criteria) {
        const inProgressDlg = await InProgress.create('Searching...', '', true);
        const p = Search.requestSearch(criteria.NtC, criteria.maxCount, criteria.redundant, criteria.largeStructures);

        InProgress.bindAbort(inProgressDlg, () => p.aborter.abort());

        const resp = await Search.resolveSearch(p);

        InProgress.dismiss(inProgressDlg);

        if (resp.success === false) {
            Popup.create(
                <div className='rdo-error-text'>
                    {resp.message ?? 'Search failed'}
                </div>
            );
        } else {
            this.search.setResults(resp.payload, criteria);
            if (this.search.haveResults())
                this.showSearchResult(this.search.results[0].name)
        }
    }

    private showSearchResult(stepName: string) {
        try {
            const pdbId = Step.nameToPdbId(stepName);
            if (!pdbId) {
                console.warn(`${stepName} contains invalid PDB ID`);
                return;
            }

            const sub = this.viewerInterop.events.structureLoaded.subscribe(() => {
                sub.unsubscribe();
                this.goToStep(stepName);
            });

            this.fromPdbId(
                pdbId,
                'rcsb',
                () => this.setState({ ...this.state, mode: 'browse', selectedTab: 'annotation' })
            );
        } catch (e) {
            console.warn(`${stepName} is not a valid step name`);
        }
    }

    componentDidMount() {
        ClassificationContext.initialize(
            './classification/clusters.csv',
            './classification/confals.csv',
            './classification/golden_steps.csv',
            './classification/nu_angles.csv'
        ).then(retval => {
            if (retval === undefined)
                this.setState({ ...this.state, dnatcofierState: 'ready' });
            else {
                this.setState({ ...this.state, dnatcofierState: 'failed' });
                Popup.create(
                    <div className='rdo-error-text'>
                        <div>Classification context - {retval}</div>
                        <div>{Globals.ProductName} cannot function when its engine fails to initialize. Try to refresh the page...</div>
                    </div>
                );
            }

            AnglesLengths.initialize().then(res => {
                if (isError(res)) {
                    this.setState({ ...this.state, dnatcofierState: 'failed' });
                    Popup.create(
                        <div className='rdo-error-text'>
                            <div>Angles and lengths - {res.message}</div>
                            <div>{Globals.ProductName} cannot function when its engine fails to initialize. Try to refresh the page...</div>
                        </div>
                    );
                } else
                    this.setState({ ...this.state, dnatcofierState: 'ready' });
            }).catch(e => {
                // We should not really get here but let's catch just in case
                this.setState({ ...this.state, dnatcofierState: 'failed' });
                Popup.create(
                    <div className='rdo-error-text'>
                        <div>Angles and lengths - {e.toString()}</div>
                        <div>{Globals.ProductName} cannot function when its engine fails to initialize. Try to refresh the page...</div>
                    </div>
                );
            });
        }).catch(e => {
            // We should not really get here but let's catch just in case
            this.setState({ ...this.state, dnatcofierState: 'failed' });
            Popup.create(
                <div className='rdo-error-text'>
                    <div>Classification context - {e.toString()}</div>
                    <div>{Globals.ProductName} cannot function when its engine fails to initialize. Try to refresh the page...</div>
                </div>
            );
        });

        ListOfConformers.load('./conformers.csv');
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    componentDidUpdate() {
        if (this.state.dnatcofierState === 'ready' && !this.initialSearchDone) {
            // Make sure that we don't do this again no matter how the search goes
            this.initialSearchDone = true;

            const params = Net.paramsFromUrl(Params);
            if (params.cifcode) {
                if (!isPdbId(params.cifcode)) {
                    console.warn(`${params.cifcode} is not a valid PDB ID`);
                    return;
                }

                if (params.stepName) {
                    const name = params.stepName;
                    const sub = this.viewerInterop.events.structureLoaded.subscribe(() => {
                        sub.unsubscribe();
                        this.goToStep(name);
                    });
                }

                this.fromPdbId(
                    params.cifcode,
                    'rcsb',
                    () => this.setState({ ...this.state, mode: 'structure', selectedTab: 'annotation' })
                );
            }
        }
    }

    render() {
        return (
            <div id='rdo-app'>
                <NavigationBar
                    onTabSwitched={tab => this.tabSwitched(tab as TabKeys)}
                    tabs={TabsForModes[this.state.mode]}
                    selectedTab={this.state.selectedTab}
                />
                <div className='rdo-tab-content-container' id='rdo-tab-content-container'>
                    {this.renderTab()}
                </div>
                <Footer />
            </div>
        );
    }
}

export namespace App {
    export interface Props {
        isDevel: boolean;
        pathPrefix: string;
    }
}

async function getConfig(): Promise<Record<string, any>> {
    try {
        return await (await fetch('./config.json')).json();
    } catch (e) {
        return {};
    }
}

async function bootstrap() {
    const config = await getConfig();

    GlobalConfig.initialize(config);

    const root = RDC.createRoot(document.getElementById('app')!);
    root.render(<App {...config} />);
}

bootstrap();
