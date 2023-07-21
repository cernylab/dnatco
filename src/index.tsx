import React from 'react';
import * as RDC from 'react-dom/client';
import { useLocation, useNavigate, BrowserRouter, HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { Subject } from 'rxjs';
import { GlobalConfig } from './global-config';
import { Globals } from './globals';
import { isPdbId } from './util';
import { Net } from './util/net';
import { isError } from './dnatco';
import { AnglesLengths, AnglesLengthsContext } from './dnatco/angles-lengths';
import { ClassificationContext } from './dnatco/classification-context';
import { ClassificationResources } from './dnatco/classification-resources';
import { Fingerprint } from './dnatco/fingerprint';
import { Naval, NavalContext } from './dnatco/naval';
import { Coordinates } from './dnatco/coordinates';
import { DensityMap } from './dnatco/density-map';
import { Dnatcofication, DnatcoficationData } from './dnatco/dnatcofication';
import { ListOfConformers } from './dnatco/list-of-conformers';
import { UserRemoteDatabases, isBuiltIn } from './remote/db/register';
import { AboutTab } from './ui/about-tab';
import { Downloads } from './ui/dnatco/downloads';
import { DnatcoViewerTab, OutsideControl } from './ui/dnatco-viewer-tab';
import { Footer } from './ui/footer';
import { ConformersTab } from './ui/conformers-tab';
import { NavigationBar } from './ui/navigation-bar';
import { StartTab } from './ui/start-tab';
import { Email } from './ui/common/email';
import { InProgress } from './ui/common/in-progress';
import { Popup } from './ui/common/popup';
import { QuestionDialog } from './ui/common/question-dialog';
import { formatErrorText } from './ui/util';
import { BackgroundWorker, WorkerMessage } from './tasks/worker';
import { ViewerInterop } from './viewer/viewer-interop';
import { Task } from './tasks/task';
import { objKeys } from './util';
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
import 'assets/imgs/data-transfer-download.svg';
// Base assets
import 'assets/index.html';
import 'assets/rednatco.css';

const IsDnatcoNavigation = new RegExp('^\/app\/dnatco\/(annotation|refinement|validation|downloads)');

const Params = {
    cifcode: '',
    stepName: '',
    db: '',
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
        downloads: {
            icon: 'imgs/data-transfer-download.svg',
            caption: 'Downloads',
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
        downloads: {
            icon: 'imgs/data-transfer-download.svg',
            caption: 'Downloads',
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

function goToStep(stepName: string, outsideControl: OutsideControl) {
    // Use an arbitrary delay to give Molstar some time to settle
    // Not doing this may result in broken rendering
    setTimeout(
        () => outsideControl.selectStep.next(stepName),
        250,
    );
}

function locationToTab(appMode: keyof typeof TabsForModes, location: string) {
    const segments = location.split('/');
    const pri = segments[2];

    if (pri === 'dnatco')
        return segments[3];

    if (!pri || !(objKeys(TabsForModes[appMode]) as string[]).includes(pri))
        return 'start'; // This assumes that 'start' tab appears in all app modes

    return pri;
}

class DnatcoficationHandler {
    dnatcofication: Dnatcofication;
    ingestionInProgress: boolean;

    constructor() {
        this.dnatcofication = new Dnatcofication();
        this.ingestionInProgress = false;
    }

    fromCustomStructure(coordsFile: File, densityMaps: { file: File, kind: DensityMap['kind'] }[], densityMapCoeffs: File|null, onSuccess: () => void) {
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
                nvCtx: NavalContext,
            }> = {
                taskFunc: 'dnatco-from-custom-structure',
                payload: {
                    coords: { file: coordsFile, type: coordsType },
                    densityMaps,
                    densityMapCoeffs: coeffs,
                    clsfResData: ClassificationContext.data(),
                    alCtx: AnglesLengths.context(),
                    nvCtx: Naval.context(),
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
                        You attached a map coefficients file to the structure. {GlobalConfig.data().displayedProductName} can use this information to calculate additional validation information about the structure. To do this calculation, {GlobalConfig.data().displayedProductName} must upload your structure and the map coefficients to an external server for processing.
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

    fromPdbId(pdbId: string, dbId: string, onSuccess: () => void) {
        const task: Task<{ pdbId: string, dbId: string, clsfResData: ClassificationResources.Data, alCtx: AnglesLengthsContext, nvCtx: NavalContext }> = {
            taskFunc: 'dnatco-from-pdb-id',
            payload: { pdbId, dbId, clsfResData: ClassificationContext.data(), alCtx: AnglesLengths.context(), nvCtx: Naval.context() },
            initialStatus: ''
        };

        this. loadStructure(task, onSuccess);
    }

    fromRawLink(link: string, onSuccess: () => void) {
        const task: Task<{ link: string, clsfResData: ClassificationResources.Data, alCtx: AnglesLengthsContext, nvCtx: NavalContext }> = {
            taskFunc: 'dnatco-from-raw-link',
            payload: { link, clsfResData: ClassificationContext.data(), alCtx: AnglesLengths.context(), nvCtx: Naval.context() },
            initialStatus: ''
        };

        this.loadStructure(task, onSuccess);
    }

    private async loadStructure<P>(task: Task<P>, onSuccess: () => void) {
        if (this.ingestionInProgress)
            return void 0;

        this.ingestionInProgress = true;

        const tStart = performance.now();

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

                    const tEnd = performance.now();
                    console.log(`Total structure ingestion time was ${((tEnd - tStart) / 1000).toFixed(3)} sec`);

                    onSuccess();
                } else if (data.finished.state === 'aborted')
                    worker.terminate();
            }
        }
    }
}

type Initial = {
    pathname: string,
    search: string,
}

function App(props: { initial: Initial }) {
    const dh = React.useMemo(() => new DnatcoficationHandler(), []);
    const vi = React.useMemo(() => new ViewerInterop(), []);
    const outsideControl = React.useMemo(() => ({
        selectStep: new Subject<string>(),
    }), []);

    const [dnatcofierState, setDnatcofierState] = React.useState<'initializing' | 'ready' | 'failed'>('initializing');
    const [appMode, setAppMode] = React.useState<keyof typeof TabsForModes>('nothing');
    const [initialHandlingDone, setInitialHandlingDone] = React.useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        const prefix = GlobalConfig.data().pathPrefix;
        const FailMsg = <div>{GlobalConfig.data().displayedProductName} cannot function when its engine fails to initialize. Try to refresh the page...</div>

        ClassificationContext.initialize(
            `${prefix}/classification/clusters.csv`,
            `${prefix}/classification/confals.csv`,
            `${prefix}/classification/golden_steps.csv`,
            `${prefix}/classification/nu_angles.csv`,
            `${prefix}/classification/confal_percentiles.csv`
        ).then(retval => {
            if (retval === undefined) {
                Fingerprint.fingerprintFromUrls(`${prefix}/classification/golden_steps.csv`, `${prefix}/classification/order_of_steps.txt`).then(fprint => {
                    dh.dnatcofication.setParametersFingerprint(fprint, GlobalConfig.data().expectedParametersFingerprint);

                    AnglesLengths.initialize().then(res => {
                        if (isError(res)) {
                            setDnatcofierState('failed');
                            Popup.create(
                                <div className='rdo-error-text'>
                                    <div>Angles and lengths - {res.message}</div>
                                    {FailMsg}
                                </div>
                            );
                        } else {
                            Naval.initialize(
                                `${prefix}/naval/angle_restraints.csv`,
                                `${prefix}/naval/bond_restraints.csv`
                            ).then(res => {
                                if (isError(res)) {
                                    setDnatcofierState('failed');
                                    Popup.create(
                                        <div className='rdo-error-text'>
                                            <div>Naval - {res.message}</div>
                                            {FailMsg}
                                        </div>
                                    );
                                } else
                                    setDnatcofierState('ready');
                            }).catch(e => {
                                // We should not really get here but let's catch just in case
                                setDnatcofierState('failed');
                                Popup.create(
                                    <div className='rdo-error-text'>
                                        <div>Naval - {e.toString()}</div>
                                        {FailMsg}
                                    </div>
                                );
                            });
                        }
                    }).catch(e => {
                        // We should not really get here but let's catch just in case
                        setDnatcofierState('failed');
                        Popup.create(
                            <div className='rdo-error-text'>
                                <div>Angles and lengths - {e.toString()}</div>
                                {FailMsg}
                            </div>
                        );
                    });
                }).catch(e => {
                    setDnatcofierState('failed');
                    Popup.create(
                        <div className='rdo-error-text'>
                            <div>Failed to calculate fingerprint of classification parameters: {(e as Error).message}</div>
                            {FailMsg}
                        </div>
                    );
                })
            } else {
                setDnatcofierState('failed');
                Popup.create(
                    <div className='rdo-error-text'>
                        <div>Classification context - {retval}</div>
                        {FailMsg}
                    </div>
                );
            }
        }).catch(e => {
            // We should not really get here but let's catch just in case
            setDnatcofierState('failed');
            Popup.create(
                <div className='rdo-error-text'>
                    <div>Classification context - {e.toString()}</div>
                    {FailMsg}
                </div>
            );
        });

        ListOfConformers.load(`${prefix}/conformers.csv`);
    }, []);

    React.useEffect(() => {
        if (dnatcofierState !== 'ready' || initialHandlingDone)
            return;

        // Make sure we run this only once
        setInitialHandlingDone(true);

        const params = Net.paramsFromUrl(Params, props.initial.search);
        if (params.cifcode) {
            if (!isPdbId(params.cifcode)) {
                Popup.create(<div className='rdo-error-text'>{`${params.cifcode} is not a valid PDB ID`}</div>);
                return;
            }

            if (params.stepName) {
                const name = params.stepName;

                // This will not fire until we switch to one of the DNATCO tabs
                // because only those tabs can command the viewer to load a structure
                const sub = vi.events.structureLoaded.subscribe(() => {
                    sub.unsubscribe();
                    goToStep(name, outsideControl);
                });
            }

            const db = params.db ? params.db : GlobalConfig.data().primaryDatabase;

            dh.fromPdbId(
                params.cifcode,
                db,
                () => {
                    setAppMode('structure');
                    console.log(props.initial);
                    if (props.initial.pathname.search(IsDnatcoNavigation) !== -1)
                        navigate(props.initial.pathname);
                    else
                        navigate('/app/dnatco/annotation');
                }
            );
        }
    }, [dnatcofierState])

    return (
        <div id='rdo-app'>
            <NavigationBar
                onTabSwitched={tk => {
                    if (tk === 'start')
                        navigate('/app');
                    else {
                        if (['annotation', 'validation', 'refinement', 'downloads'].includes(tk)) {
                            if (appMode !== 'structure') {
                                Popup.create(
                                    <div>
                                        No structure is loaded. Please load a structure on the <span className='rdo-emphasize'>Home</span> tab to activate this tab.
                                    </div>
                                );
                                return;
                            } else
                                navigate(`/app/dnatco/${tk}`);
                        } else
                            navigate(`/app/${tk}`);
                    }
                }}
                tabs={TabsForModes[appMode]}
                selectedTab={locationToTab(appMode, location.pathname)}
            />
            <div className='rdo-tab-content-container' id='rdo-tab-content-container'>
                <Routes>
                    <Route
                        path='/app'
                    >
                        <Route
                            index
                            path=''
                            element=<StartTab
                                onDoCustomStructure={(coordsFile, densityMaps, densityMapCoeffs) => {
                                    if (dnatcofierState !== 'ready') return;

                                    dh.fromCustomStructure(
                                        coordsFile,
                                        densityMaps,
                                        densityMapCoeffs,
                                        () => {
                                            setAppMode('structure');
                                            navigate('/app/dnatco/annotation');
                                        }
                                    )
                                }}
                                onDoPdbId={(pdbId, db) => {
                                    if (dnatcofierState !== 'ready') return;

                                    dh.fromPdbId(
                                        pdbId,
                                        db,
                                        () => {
                                            setAppMode('structure');
                                            navigate('/app/dnatco/annotation');
                                        }
                                    )
                                }}
                                onDoRawLink={link => {
                                    if (dnatcofierState !== 'ready') return;

                                    dh.fromRawLink(
                                        link,
                                        () => {
                                            setAppMode('structure');
                                            navigate('/app/dnatco/annotation');
                                        }
                                    )
                                }}
                                dnatcofierState={dnatcofierState}
                            />
                        />
                        <Route
                            path='list-of-conformers'
                            element=<ConformersTab />
                        />
                        <Route
                            path='about'
                            element=<AboutTab />
                        />
                        <Route
                            path='dnatco'
                        >
                            <Route
                                path='annotation/*'
                                element=<DnatcoViewerTab
                                    dnatcofication={dh.dnatcofication}
                                    viewerInterop={vi}
                                    outsideControl={outsideControl}
                                />
                            />
                            <Route
                                path='validation/*'
                                element=<DnatcoViewerTab
                                    dnatcofication={dh.dnatcofication}
                                    viewerInterop={vi}
                                    outsideControl={outsideControl}
                                />
                            />
                            <Route
                                path='refinement/*'
                                element=<DnatcoViewerTab
                                    dnatcofication={dh.dnatcofication}
                                    viewerInterop={vi}
                                    outsideControl={outsideControl}
                                />
                            />
                            <Route
                                path='downloads'
                                element=<Downloads dnatcofication={dh.dnatcofication} />
                            />
                            <Route path='*' element={<Navigate to='annotation' />} />
                        </Route>
                    </Route>
                    <Route path='*' element={<Navigate to='/app' />} />
                </Routes>
            </div>
            <Footer />
        </div>
    );
}

function InitializationError(props: {e: Error}) {
    return (
        <div className='rdo-init-error-container'>
            <div className='rdo-init-error-frame'>
                <div className='rdo-init-error'>Application has failed to load because it is misconfigured. Please, report the error below to the site administrators.</div>
                <div className='rdo-init-error-message'>{props.e.message}</div>
                <span>
                    <div className='rdo-strong' style={{ textAlign: 'center'}}>Contact:</div>
                    <span style={{ display: 'flex', gap: '1em' }}>
                        {Globals.PrimaryContacts.map((c) => <Email email={c.email} subject='DNATCO misconfiguration error'><span style={{ color: 'black' }}>{c.name}</span></Email>)}
                    </span>
                </span>
            </div>
        </div>
    );
}

async function bootstrap() {
    const config = await GlobalConfig.fetchConfigFile();

    const root = RDC.createRoot(document.getElementById('app')!);
    try {
        const configData = GlobalConfig.load(config);
        for (const db of configData.userDatabases)
            UserRemoteDatabases.add(db);
        if (!(isBuiltIn(configData.primaryDatabase) || UserRemoteDatabases.exists(configData.primaryDatabase)))
            throw new Error(`Primary database ID "${configData.primaryDatabase}" is not known`);

        const initial = {
            hash: window.location.hash,
            pathname: window.location.pathname,
            search: window.location.search,
        };

        const app = configData.useHashRouter
            ? <HashRouter><App initial={initial} /></HashRouter>
            : <BrowserRouter><App initial={initial} /></BrowserRouter>;

        root.render(app);
    } catch (e) {
        root.render(<InitializationError e={e as Error} />);
    }
}

bootstrap();
