import * as React from 'react';
import { ShadowedBox } from './common/shadowed-box';
import { NamedList } from './common/named-list';
import { PushButton } from './common/push-button';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { ListOfConformers } from '../dnatco/list-of-conformers';
import { Net } from '../util/net';

const Tabs = {
    'about-ntcs': 'About NtCs',
    'table-of-conformers': 'Table of conformers',
    'browse': 'Browse',
};
type TabId = keyof typeof Tabs;

const TabsOrder: TabId[] = [
    'about-ntcs',
    'table-of-conformers',
    'browse',
];

function fmtInt(n: number) {
    if (isNaN(n))
        return '-';
    let ns = n.toFixed(0);
    const L = ns.length;
    let rs = ns[L - 1];
    for (let idx = 1; idx < L; idx++) {
        if (idx % 3 === 0)
            rs = '\u00A0' + rs;
        rs = ns[L - idx - 1] + rs;
    }

    return rs;
}

function fmtFlt(f: number, n = 1) {
    if (isNaN(f))
        return '-';
    return f.toFixed(n);
}

class AboutNtCs extends React.Component {
    render() {
        return <div>...</div>
    }
}

class Browse extends React.Component {
    render() {
        return <div>...</div>
    }
}

class TableOfConformers extends React.Component {
    private renderList() {
        if (!ListOfConformers.has()) {
            if (ListOfConformers.failed())
                return <div className='rdo-error-text'>{`List of conformers failed to load: ${ListOfConformers.fail}`}</div>
            return <div>List of conformers is still loading...</div>
        }

        let totalDNACount = 0;
        let totalRNACount = 0;
        let totalGSCount = 0;

        return (
            <table className='rdo-list-of-conformers rdo-data-table-wide'>
                <thead>
                    <tr>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>Annotation</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>CANA</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>NtC</th>
                        <th className='rdo-list-of-conformers-rb' colSpan={5}>Number of steps in</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-highlighted-col' rowSpan={2}>δ1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>ε1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>ζ1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>α2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>β2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>γ2</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-highlighted-col' rowSpan={2}>δ2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>χ1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>χ2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>μ</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>NN</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>C'C'</th>
                    </tr>
                    <tr>
                        <th className='rdo-list-of-conformers-bb'>{'N\u00A0DNA'}</th>
                        <th className='rdo-list-of-conformers-bb'>{'%\u00A0DNA'}</th>
                        <th className='rdo-list-of-conformers-bb'>{'N\u00A0RNA'}</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-bb'>{'%\u00A0RNA'}</th>
                        <th className='rdo-list-of-conformers-rb rdo-list-of-conformers-bb'>{'N\u00A0GS'}</th>
                    </tr>
                </thead>
                <tbody>
                {
                    ListOfConformers.list.map((info, idx) => {
                        totalDNACount += info.countInDNA;
                        totalRNACount += info.countInRNA;
                        totalGSCount += info.countGS;

                        return (
                            <tr
                                className={
                                    info.highlight
                                        ?
                                        'rdo-list-of-conformers-highlighted-row'
                                        :
                                        idx % 2 === 1
                                            ? 'rdo-list-of-conformers-alternate-clr' : ''
                                }
                                key={idx}
                            >
                                <td className='rdo-list-of-conformers-rb'>{info.description}</td>
                                <td className='rdo-talgn-center'>{info.CANA}</td>
                                <td className='rdo-list-of-conformers-rb rdo-talgn-center'>{info.NtC}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.countInDNA)}</td>
                                <td className='rdo-talgn-right'>{fmtFlt(info.percentInDNA)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.countInRNA)}</td>
                                <td className='rdo-list-of-conformers-rb rdo-talgn-right'>{fmtFlt(info.percentInRNA)}</td>
                                <td className='rdo-list-of-conformers-rb rdo-talgn-right'>{fmtInt(info.countGS)}</td>
                                <td className={`rdo-talgn-right rdo-list-of-conformers-highlighted-${info.highlight ? 'row' : 'col'}`}>{fmtInt(info.delta1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.epsilon1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.zeta1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.alpha2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.beta2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.gamma2)}</td>
                                <td className={`rdo-talgn-right rdo-list-of-conformers-highlighted-${info.highlight ? 'row' : 'col'}`}>{fmtInt(info.delta2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.chi1)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.chi2)}</td>
                                <td className='rdo-talgn-right'>{fmtInt(info.mu)}</td>
                                <td className='rdo-talgn-right'>{fmtFlt(info.NN)}</td>
                                <td className='rdo-talgn-right'>{fmtFlt(info.CC)}</td>
                            </tr>
                        );
                    })
                }
                    <tr>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb rdo-talgn-right'>{fmtInt(totalDNACount)}</td>
                        <td className='rdo-list-of-conformers-tb rdo-talgn-right'></td>
                        <td className='rdo-list-of-conformers-tb rdo-talgn-right'>{fmtInt(totalRNACount)}</td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb rdo-talgn-right'></td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb rdo-talgn-right'>{fmtInt(totalGSCount)}</td>
                        <td className='rdo-list-of-conformers-tb rdo-list-of-conformers-highlighted-col'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb rdo-list-of-conformers-highlighted-col'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-tb'></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>Annotation</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>CANA</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>NtC</th>
                        <th className='rdo-list-of-conformers-tb '>{'N\u00A0DNA'}</th>
                        <th className='rdo-list-of-conformers-tb'>{'%\u00A0DNA'}</th>
                        <th className='rdo-list-of-conformers-tb'>{'N\u00A0RNA'}</th>
                        <th className='rdo-list-of-conformers-tb'>{'%\u00A0RNA'}</th>
                        <th className='rdo-list-of-conformers-tb rdo-list-of-conformers-rb'>{'N\u00A0GS'}</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-highlighted-col' rowSpan={2}>δ1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>ε1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>ζ1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>α2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>β2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>γ2</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-highlighted-col' rowSpan={2}>δ2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>χ1</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>χ2</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>μ</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>NN</th>
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>C'C'</th>
                    </tr>
                    <tr>
                        <th className='rdo-list-of-conformers-rb' colSpan={5}>Number of steps in</th>
                    </tr>
                </thead>
            </table>
        );
    }

    render() {
        return (
            <div className='rdo-width-limiter' style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ display: 'grid', height: '100%', gridTemplateRows: '1fr auto', gridTemplateColumns: 'auto', rowGap: 'var(--x-gap)', columnGap: 'var(--x-gap)' }}>
                    <div style={{ overflow: 'hidden' }}>
                        <div className='rdo-scroll-vertically'>
                            {this.renderList()}
                        </div>
                    </div>
                    {ListOfConformers.has()
                        ?
                        <NamedList
                            items={[
                                {
                                    name: 'Download list',
                                    value:
                                        <div style={{ display: 'grid', gridTemplateColumns: '6em 6em', columnGap: 'var(--h-gap)' }}>
                                            <PushButton
                                                caption='CSV'
                                                onClick={() => Net.serveFile('text/plain', ListOfConformers.raw, 'conformers.csv')}
                                            />
                                            <PushButton
                                                caption='JSON'
                                                onClick={() => Net.serveFile('application/json', JSON.stringify(ListOfConformers.list), 'conformers.json')}
                                            />
                                        </div>
                                }
                            ]}
                            vcentered={true}
                        />
                        :
                        <div />
                    }
                </div>
            </div>
        );
    }
}

interface State {
    selected: TabId;
}
export class ConformersTab extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            selected: 'table-of-conformers',
        };
    }

    private renderTab() {
        switch (this.state.selected) {
        case 'about-ntcs': return <AboutNtCs />;
        case 'browse': return <Browse />;
        case 'table-of-conformers': return <TableOfConformers />;
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
                            onSwitched={id => this.setState({ ...this.state, selected: id as TabId })}
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

