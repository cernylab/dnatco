import React from 'react';
import * as RDC from 'react-dom/client';
import { GlobalConfig } from './global-config';
import { ClassificationResources } from './dnatco/classification-resources';
import { Dnatcofication, DnatcoficationData } from './dnatco/dnatcofication';
import { Reader } from './dnatco/reader';
import { Step } from './dnatco/step';
import { AboutTab } from './ui/about-tab';
import { BrowseConformersTab } from './ui/browse-conformers-tab';
import { DnatcoViewerTab } from './ui/dnatco-viewer-tab';
import { NavigationBar } from './ui/navigation-bar';
import { StartTab } from './ui/start-tab';
import { Popup } from './ui/common/popup';
import { InProgress } from './ui/common/in-progress';
import { WithSubscriptions } from './ui/service/with-subscriptions';
import { MainScreen } from './ui/dnatco/main-screen';
import { makeStepSelection } from './ui/dnatco/util';
import { Search } from './search/search';
import { BackgroundWorker, WorkerMessage } from './tasks/worker';
import { ViewerApi, ViewerInterop } from './viewer/viewer-interop';
import { Task } from './tasks/task';
import '../assets/index.php';
import '../assets/rednatco.css';

let clsfResData: ClassificationResources.Data;

type Mode = 'nothing'|'structure'|'browse';

const ModeTabs: Record<Mode, NavigationBar.Tabs[]> = {
    'nothing': ['start', 'about'],
    'structure': ['start', 'annotation', 'validation', 'refinement', 'about'],
    'browse': ['start', 'browse', 'annotation', 'about'],
}

interface State {
    mode: Mode;
    selectedTab: NavigationBar.Tabs;
    dnatcofierReady: boolean;
}
export class App extends WithSubscriptions<{}, State> {
    private dnatcofication = new Dnatcofication();
    private search = new Search();
    private ingestionInProgress = false;
    private viewerInterop = new ViewerInterop();

    constructor(props: Partial<App.Props>) {
        super(props);

        this.state = {
            mode: 'nothing',
            selectedTab: 'start',
            dnatcofierReady: false,
        };
    }

    private fromCustomStructure(coordsFile: File, densityMapFile: File|null, onSuccess: () => void) {
        const task: Task<{ coordsFile: File, densityMapFile: File|null, clsfResData: ClassificationResources.Data }> = {
            taskFunc: 'dnatco-from-custom-structure',
            payload: { coordsFile, densityMapFile, clsfResData },
            initialStatus: ''
        };

        this.loadStructure(task, onSuccess);
    }

    private fromPdbId(pdbId: string, db: Reader.SupportedDatabases, onSuccess: () => void) {
        const task: Task<{ pdbId: string, db: Reader.SupportedDatabases, localDbUrl: string, localDbGzipped: boolean, clsfResData: ClassificationResources.Data }> = {
            taskFunc: 'dnatco-from-pdb-id',
            payload: { pdbId, db, localDbUrl: GlobalConfig.data().localDbUrl, localDbGzipped: GlobalConfig.data().localDbGzipped, clsfResData },
            initialStatus: ''
        };

        this.loadStructure(task, onSuccess);
    }

    private async fromRawLink(link: string, onSuccess: () => void) {
        const task: Task<{ link: string, clsfResData: ClassificationResources.Data }> = {
            taskFunc: 'dnatco-from-raw-link',
            payload: { link, clsfResData },
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
                            <div className='rdo-error-text'>Cannot process structure</div>
                            <div className='rdo-error-text'>{data.finished.message ?? 'Unknown error'}</div>
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
                    onDoCustomStructure={(coordsFile, densityMapFile) => {
                        this.fromCustomStructure(
                            coordsFile,
                            densityMapFile,
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
                    dnatcofierReady={this.state.dnatcofierReady}
                />
            );
        case 'browse':
            return (
                <BrowseConformersTab
                    criteria={this.search.criteria}
                    onSearch={(criteria) => this.searchConformers(criteria)}
                    onStepSelected={(stepName) => this.showSearchResult(stepName)}
                    steps={this.search.results}
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
        default:
            return <AboutTab />
        }
    }

    private tabSwitched(tab: NavigationBar.Tabs) {
        this.setState({ ...this.state, selectedTab: tab });
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

            const sub = this.viewerInterop.events.structureLoaded.subscribe(() => {
                sub.unsubscribe();

                const selection = makeStepSelection(this.dnatcofication, stepName);
                if (selection) {
                    // Use an arbitrary delay to give Molstar some time to settle
                    // Not doing this may result in broken rendering
                    setTimeout(
                        () => this.viewerInterop.api.command(ViewerApi.Commands.SelectStep(selection.current, selection.prev, selection.next)),
                        200
                    );
                }
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
        ClassificationResources.load(
            './classification/clusters.csv',
            './classification/confals.csv',
            './classification/golden_steps.csv',
            './classification/nu_angles.csv'
        ).then((data) => {
            clsfResData = data;
            this.setState({ ...this.state, dnatcofierReady: true });
        }).catch(e => {
            Popup.create(
                <div className='rdo-error-text'>
                    <div>{e.toString()}</div>
                    <div>ReDNATCO cannot function when its engine fails to initialize. Try to refresh the page...</div>
                 </div>
            );
        });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div id='rdo-app'>
                <NavigationBar
                    onTabSwitched={tab => this.tabSwitched(tab)}
                    selected={this.state.selectedTab}
                    shown={ModeTabs[this.state.mode]}
                />
                <div className='rdo-tab-content-container'>
                    {this.renderTab()}
                </div>

                <div className='rdo-footer-gutter' />
                <div className='rdo-footer'>
                    <div className='rdo-footer-text'>© &lt; TBD &gt;</div>
                </div>
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
