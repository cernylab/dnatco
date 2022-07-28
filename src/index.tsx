import React from 'react';
import * as RDC from 'react-dom/client';
import { GlobalConfig } from './global-config';
import { ClassificationResources } from './dnatco/classification-resources';
import { Dnatcofication, DnatcoficationData } from './dnatco/dnatcofication';
import { AboutTab } from './ui/about-tab';
import { DnatcoViewerTab } from './ui/dnatco-viewer-tab';
import { NavigationBar } from './ui/navigation-bar';
import { StartTab } from './ui/start-tab';
import { Popup } from './ui/common/popup';
import { InProgress } from './ui/common/in-progress';
import { WithSubscriptions } from './ui/service/with-subscriptions';
import { MainScreen } from './ui/dnatco/main-screen';
import { BackgroundWorker, WorkerMessage } from './tasks/worker';
import { Task } from './tasks/task';
import '../assets/index.html';
import '../assets/rednatco.css';

let clsfResData: ClassificationResources.Data;

interface State {
    haveStructure: boolean;
    selectedTab: NavigationBar.Tabs;
    dnatcofierReady: boolean;
}
export class App extends WithSubscriptions<Partial<App.Props>, State> {
    private dnatcofication = new Dnatcofication();
    private ingestionInProgress = false;

    constructor(props: Partial<App.Props>) {
        super(props);

        GlobalConfig.initialize(
            {
                isDevel: props.isDevel ?? false,
                pathPrefix: props.pathPrefix ?? '',
            }
        );

        this.state = {
            haveStructure: false,
            selectedTab: 'start',
            dnatcofierReady: false,
        };
    }

    private fromCustomStructure(coordsFile: File, densityMapFile: File|null) {
        const task: Task<{ coordsFile: File, densityMapFile: File|null, clsfResData: ClassificationResources.Data }> = {
            taskFunc: 'dnatco-from-custom-structure',
            payload: { coordsFile, densityMapFile, clsfResData },
            initialStatus: ''
        };

        this.loadStructure(task);
    }

    private fromPdbId(pdbId: string) {
        const task: Task<{ pdbId: string, clsfResData: ClassificationResources.Data }> = {
            taskFunc: 'dnatco-from-pdb-id',
            payload: { pdbId, clsfResData },
            initialStatus: ''
        };

        this.loadStructure(task);
    }

    private async fromRawLink(link: string) {
        const task: Task<{ link: string, clsfResData: ClassificationResources.Data }> = {
            taskFunc: 'dnatco-from-raw-link',
            payload: { link, clsfResData },
            initialStatus: ''
        };

        this.loadStructure(task);
    }

    private async loadStructure<P>(task: Task<P>) {
        if (this.ingestionInProgress)
            return void 0;

        this.ingestionInProgress = true;

        const inProgressDlg = await InProgress.create('Processing custom structure', 'Preparing', true);
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
                InProgress.update(inProgressDlg, 'Processing custom structure', data.status);
                this.ingestionInProgress = false;
            } else if (data.type === 'finished') {
                InProgress.dismiss(inProgressDlg);
                this.ingestionInProgress = false;

                if (data.finished.state === 'failed') {
                    Popup.create(
                        <>
                            <div className='rdo-error-text'>Cannot process custom structure</div>
                            <div className='rdo-error-text'>{data.finished.message ?? 'Unknown error'}</div>
                         </>
                    );
                } else if (data.finished.state === 'succeeded')
                    this.dnatcofication.setData(data.finished.data!);
                else if (data.finished.state === 'aborted')
                    worker.terminate();
            }
        }

    }

    private renderTab() {
        switch (this.state.selectedTab) {
        case 'start':
            return (
                <StartTab
                    onDoCustomStructure={(coordsFile, densityMapFile) => this.fromCustomStructure(coordsFile, densityMapFile)}
                    onDoPdbId={pdbId => this.fromPdbId(pdbId)}
                    onDoRawLink={link => this.fromRawLink(link)}
                    dnatcofierReady={this.state.dnatcofierReady}
                />
            );
        case 'annotation':
            return (
                <DnatcoViewerTab>
                    <MainScreen
                        dnatcofication={this.dnatcofication}
                        masterMode='annotation'
                    />
                </DnatcoViewerTab>
            );
        case 'validation':
            return (
                <DnatcoViewerTab>
                    <MainScreen
                        dnatcofication={this.dnatcofication}
                        masterMode='validation'
                    />
                </DnatcoViewerTab>
            );
        case 'refinement':
            return (
                <DnatcoViewerTab>
                    <MainScreen
                        dnatcofication={this.dnatcofication}
                        masterMode='refinement'
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

    componentDidMount() {
        this.subscribe(
            this.dnatcofication.events.structureChanged,
            (have: boolean) => {
                if (have)
                    this.setState({ ...this.state, haveStructure: have, selectedTab: have ? 'annotation' : 'start' });
            }
        );

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
                    <div>ReDNATCO cannon function when its engine fails to initialize. Try to refresh the page...</div>
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
                    disabled={this.state.haveStructure ? [] : ['annotation', 'validation', 'refinement']}
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

async function getConfig(): Promise<Partial<App.Props>> {
    try {
        return await (await fetch('./config.json')).json();
    } catch (e) {
        return {};
    }
}

async function bootstrap() {
    const config = await getConfig();

    const root = RDC.createRoot(document.getElementById('app')!);
    root.render(<App {...config} />);
}

bootstrap();
