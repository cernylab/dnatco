import React from 'react';
import ReactDOM from 'react-dom';
import { GlobalConfig } from './global-config';
import { Result, isError, isOk } from './dnatco';
import { Engine } from './dnatco/engine';
import { Dnatcofication } from './dnatco/dnatcofication';
import { AboutTab } from './ui/about-tab';
import { DnatcoViewerTab } from './ui/dnatco-viewer-tab';
import { NavigationBar } from './ui/navigation-bar';
import { StartTab } from './ui/start-tab';
import { WithSubscriptions } from './ui/service/with-subscriptions';
import { MainScreen } from './ui/dnatco/main-screen';
import '../assets/index.html';
import '../assets/rednatco.css';

interface State {
    haveStructure: boolean;
    selectedTab: NavigationBar.Tabs;
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
        };
    }

    private async fromCustomStructure(coordsFile: File, densityMapFile: File|null) {
        const result = await Engine.dnatcoifyCustom(coordsFile, densityMapFile);
        this.tryIngestCif(result);
    }

    private async fromPdbId(pdbId: string) {
        const result = await Engine.dnatcoifyPdbId(pdbId);
        this.tryIngestCif(result);
    }

    private async fromRawLink(link: string) {
        const result = await Engine.dnatcoifyLink(link);
        this.tryIngestCif(result);
    }

    private async loadStructure(ingestor: () => Promise<void>) {
        if (this.ingestionInProgress)
            return void 0;

        this.ingestionInProgress = true;

        try {
            await ingestor();
            this.ingestionInProgress = false;
            this.setState({ ...this.state, selectedTab: 'annotation' });
            return undefined;
        } catch (e) {
            this.ingestionInProgress = false;

            return (e as Error).toString();
        };
    }

    private tryIngestCif(result: Result<string>) {
        if (isOk(result)) {
            this.dnatcofication.ingest(result.data);
        } else if (isError(result)) {
            console.error(result.message);
        }
    }

    private renderTab() {
        switch (this.state.selectedTab) {
        case 'start':
            return (
                <StartTab
                    onDoCustomStructure={(coordsFile, densityMapFile) => this.loadStructure(async () => await this.fromCustomStructure(coordsFile, densityMapFile))}
                    onDoPdbId={pdbId => this.loadStructure(async () => await this.fromPdbId(pdbId))}
                    onDoRawLink={link => this.loadStructure(async () => await this.fromRawLink(link))}
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
            () => {
                const have = this.dnatcofication.haveStructure();
                if (have !== this.state.haveStructure)
                    this.setState({ ...this.state, haveStructure: have });
            }
        );
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

const ReDNATCO = {
    start: (config: Partial<App.Props>) => {
        ReactDOM.render(
            <App {...config} />,
            document.getElementById('app')
        );
    },
};

(window as any).ReDNATCO = ReDNATCO;
