import * as React from 'react';
import { ShadowedBox } from './common/shadowed-box';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { TextContainer } from './common/text-container';
import { GlobalConfig } from '../global-config';
import 'assets/html/contact.html';
import 'assets/html/downloads.html';
import 'assets/html/help.html';
import 'assets/html/how-to-cite.html';
import 'assets/html/versions.html';
// Images needed by Contacts content
import 'assets/imgs/ibt.png';
import 'assets/imgs/CAS_centred_logo_ENG_rgb.png';

const Tabs = [
    ['how-to-cite', { caption: 'How to cite' }],
    ['help', { caption: 'Help' }],
    ['version-history', { caption: 'Version history' }],
    ['downloads', { caption: 'Downloads' }],
    ['contact', { caption: 'Contact' }],
] as const;

function Contact() {
    return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/contact.html`} />;
}

function Downloads() {
    return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/downloads.html`} />;
}

function Help() {
    return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/help.html`} />;
}

function HowToCite() {
    return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/how-to-cite.html`} />;
}

function VersionHistory() {
    return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/versions.html`} />;
}

interface State {
    selected: typeof Tabs[number][0];
}
export class AboutTab extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            selected: 'how-to-cite',
        };
    }

    private renderTab() {
        switch (this.state.selected) {
        case 'contact': return <Contact />;
        case 'downloads': return <Downloads />;
        case 'help': return <Help />;
        case 'how-to-cite': return <HowToCite />;
        case 'version-history': return <VersionHistory />;
        }
    }

    render() {
        return (
            <div className='rdo-offset'>
                <ShadowedBox>
                    <div className='rdo-screen-with-side-panel' style={{ overflow: 'hidden' }}>
                        <SideSwitchingPanel
                            items={Tabs}
                            selectedItemId={this.state.selected}
                            onSwitched={id => this.setState({ ...this.state, selected: id})}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className='rdo-primary-caption'>
                                {Tabs.find((tab) => tab[0] === this.state.selected)![1].caption}
                            </div>
                            <div className='rdo-offset' style={{ overflow: 'hidden' }}>
                                {this.renderTab()}
                            </div>
                        </div>
                    </div>
                </ShadowedBox>
            </div>
        );
    }
}
