import * as React from 'react';
import { ViewsList } from './views-list';
import { ViewerApi } from './viewer-api';
import { Register } from './views/register';
import { WithSubscriptions } from '../service/with-subscriptions';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import '../../../assets/molstar.js';
import '../../../assets/molstar.css';

export type MasterMode = 'annotation' | 'validation' | 'refinement';
type ViewType = keyof typeof Register.Views;

const AvailableViews = {
    'assigned-ntcs': { caption: 'Assigned NtCs', visualizer: true },
    'structure-info': { caption: 'Structure Info', visualizer: false },
    'confals-rmsds':  { caption: 'Confals & RMSDs', visualizer: true },
    'step-torsions': { caption: 'Step torsions', visualizer: true },
    'similarity-plots': { caption: 'Similarity plots', visualizer: false },
    'empty': { caption: 'Empty', visualizer: false },
};
const AnnotationViews = ['assigned-ntcs', 'structure-info'] as ViewType[];
const ValidationViews = ['confals-rmsds', 'step-torsions', 'similarity-plots'] as ViewType[];

function masterModeViews(mode: MasterMode): { id: ViewType, caption: string }[] {
    switch (mode) {
    case 'annotation':
        return AnnotationViews.map(view => { return { id: view, caption: AvailableViews[view].caption }; } );
    case 'validation':
        return ValidationViews.map(view => { return { id: view, caption: AvailableViews[view].caption }; } );
    case 'refinement':
        return [];
    }
}

interface State {
    annotationView: typeof AnnotationViews[number];
    validationView: typeof ValidationViews[number];
    refinementView: 'empty'
}
export class MainScreen extends WithSubscriptions<MainScreen.Props, State> {
    private viewerApi: ViewerApi.Api|undefined = undefined;

    constructor(props: MainScreen.Props) {
        super(props);

        this.state = {
            annotationView: 'assigned-ntcs',
            validationView: 'confals-rmsds',
            refinementView: 'empty',
        }
    }

    private renderView() {
        if (!this.viewerApi)
            return <div />;

        switch (this.props.masterMode) {
        case 'annotation':
            return Register.Views[this.state.annotationView]({ dnatcofication: this.props.dnatcofication, viewerApi: this.viewerApi });
        case 'validation':
            return Register.Views[this.state.validationView]({ dnatcofication: this.props.dnatcofication, viewerApi: this.viewerApi });
        case 'refinement':
            return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48pt', height: '80%' }}>&lt; Emoji of a fish with a hopeful face &gt;</div>;
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
        //@ts-ignore
        this.viewerApi = molstar.ReDNATCOMspApi.init('rdo-id-molstar-container', () => molstar.ReDNATCOMspApi.loadStructure(this.props.dnatcofication.rawCif()));

        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.forceUpdate());

        this.forceUpdate(); // Views are not displayed without the viewerApi object
    }

    componentDidUpdate(prevProps: MainScreen.Props) {
        if (this.viewerApi) {
            if (this.props.masterMode !== prevProps.masterMode)
                this.viewerApi.command(ViewerApi.Commands.Redraw());
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
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
                            this.setState({ ...this.state, refinementView: 'empty' });
                            break;
                        }
                    }}
                    selected={this.selectedView()}
                />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className='rdo-view-caption'>{AvailableViews[this.selectedView()].caption}</div>
                    <div className={`rdo-view-visualizer-container ${AvailableViews[this.selectedView()].visualizer ? 'rdo-view-visualizer-container-with-visualizer' : 'rdo-view-visualizer-container-without-visualizer'}`}>
                        <div className='rdo-offset' style={{ overflow: 'hidden' }}>
                            <div className='rdo-scroll-vertically'>
                                {this.renderView()}
                            </div>
                        </div>
                        <div className='rdo-offset'>
                            <div id='rdo-id-molstar-container' style={{ height: '100%', position: 'relative', visibility: AvailableViews[this.selectedView()].visualizer ? 'visible' : 'hidden' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export namespace MainScreen {
    export interface Props {
        dnatcofication: Dnatcofication;
        masterMode: MasterMode;
    }
}
