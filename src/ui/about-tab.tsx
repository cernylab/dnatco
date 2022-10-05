import * as React from 'react';
import { NamedList, NamedListItem } from './common/named-list';
import { ShadowedBox } from './common/shadowed-box';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { TextContainer } from './common/text-container';
import { Tooltip } from './common/tooltip';
import { GlobalConfig } from '../global-config';
import { WasmSupport } from 'jsllka';
import '../../assets/html/contact.html';
import '../../assets/html/downloads.html';
import '../../assets/html/help.html';
import '../../assets/html/how-to-cite.html';
import '../../assets/html/versions.html';
// Images needed by Contacts content
import '../../assets/imgs/ibt.png';
import '../../assets/imgs/CAS_centred_logo_ENG_rgb.png';

const Tabs = {
    'how-to-cite': 'How to cite',
    help: 'Help',
    'version-history': 'Version history',
    downloads: 'Downloads',
    contact: 'Contact',
    technical: 'Technical', // This will probably get removed in the release version
};
type TabId = keyof typeof Tabs;

const TabsOrder: TabId[] = [
    'how-to-cite', 'help', 'downloads', 'contact', 'version-history', 'technical'
];

class Contact extends React.Component {
    render() {
        return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/contact.html`} />;
    }
}

class Downloads extends React.Component {
    render() {
        return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/downloads.html`} />;
    }
}

class Help extends React.Component {
    render() {
        return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/help.html`} />;
    }
}

class HowToCite extends React.Component {
    render() {
        return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/how-to-cite.html`} />;
    }
}

class Technical extends React.Component {
    render() {
        return (
            <div className='rdo-section-caption'>
                Supported browser features
                <div className='rdo-offset'>
                    <NamedList horizontalPosition='center'>
                        <NamedListItem name='WebAssembly'>
                            <span>
                                {WasmSupport.wasm ? 'Yes' : <span className='rdo-error-text'>No</span>}
                                {'\u00A0'}
                                <Tooltip
                                    tag='[?]'
                                >
                                    <div style={{ maxWidth: '25em' }}>
                                        WebAssembly support allows the browser to use a compiled variant of the DNATCO library which offers better performance.
                                        In the absence of WebAssembly support, plain JavaScript version of the library will be used instead.
                                    </div>
                                </Tooltip>
                            </span>
                        </NamedListItem>
                        <NamedListItem name='WebAssembly SIMD'>
                            <span>
                                {WasmSupport.simd ? 'Yes' : <span className='rdo-error-text'>No</span>}
                                {'\u00A0'}
                                <Tooltip
                                    tag='[?]'
                                >
                                    <div style={{ maxWidth: '25em' }}>
                                        WebAssembly SIMD support allows the browser to use a variant of the DNATCO library that makes use of SIMD (Single Instruction, Multiple Data) instructions. SIMD instructions
                                        can speed up some mathematical operations that manipulate with large sets of numbers.
                                    </div>
                                </Tooltip>
                            </span>
                        </NamedListItem>
                    </NamedList>
                </div>
            </div>
        );
    }
}

class VersionHistory extends React.Component {
    render() {
        return <TextContainer assetUrl={`${GlobalConfig.data().pathPrefix}/html/versions.html`} />;
    }
}

interface State {
    selected: keyof typeof Tabs;
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
        case 'technical': return <Technical />;
        }
    }

    render() {
        return (
            <div className='rdo-offset'>
                <ShadowedBox>
                    <div className='rdo-screen-with-side-panel' style={{ overflow: 'hidden' }}>
                        <SideSwitchingPanel
                            items={TabsOrder.map(id => ({ id: id, caption: Tabs[id] }))}
                            selectedItem={this.state.selected}
                            onSwitched={id => this.setState({ ...this.state, selected: id as keyof typeof Tabs })}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className='rdo-primary-caption'>
                                {Tabs[this.state.selected]}
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
