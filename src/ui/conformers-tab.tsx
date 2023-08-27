import React from 'react';
import { ContourPlots } from './contour-plots';
import { Help } from './help';
import { SearchConformers } from './search-conformers';
import { DynamicTable as DynamicTableComp } from './common/dynamic-table';
import { InProgress } from './common/in-progress';
import { NamedList, NamedListItem } from './common/named-list';
import { Popup } from './common/popup';
import { ShadowedBox } from './common/shadowed-box';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { DownloadButton } from './dnatco/common';
import { DefinitionNewTrans2Img } from '../assets/images';
import { Net } from '../browser-util/net';
import { doDownload } from '../browser-util/downloader';
import { ListOfConformers } from '../dnatco/list-of-conformers';
import { Step } from '../dnatco/step';
import { Search } from '../remote/search';
import { Common } from '../util/dnatco';
import { DynamicTable } from '../util/dynamic-table';
import { FileTypes } from '../util/file-type';
import { Serialization } from '../util/serialization';

const Tabs = [
    ['about-ntcs', { caption: 'About NtCs', title: 'About NtCs' }],
    ['table-of-conformers', { caption: 'Table of conformers', title: 'Table of conformers' }],
    ['browse-conformers', { caption: 'Browse', title: 'Search PDB database for dinucleotide steps of given conformation (NtC)' }],
    ['contour-plots', { caption: 'Contour plots', title: '' }],
] as const;

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

function AboutNtCs() {
    return (
        <Help.Container>
            <div className='rdo-page'>
                <div className='rdo-paragraph-caption'>NtC alphabet</div>
                <div className='rdo-paragraph'>
                    The NtC structural alphabet describes DNA/RNA backbone conformations using
                    96 distinct dinucleotide conformers. These dinucleotide conformers are
                    assigned based on the values of 12 backbone torsion and distance parameters
                    (Figure 1).
                </div>

                <div className='rdo-image-tainer'>
                    <img className='rdo-image' src={DefinitionNewTrans2Img} />
                    <div>
                        Figure 1. Dinucleotide step with the 12 parameters <br /> (backbone torsions shown in gray, distances in blue) <br /> that define the NtC conformational class.
                    </div>
                </div>

                <div className='rdo-paragraph-caption'>NtC naming</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            The names of the NtC conformer classes consist of four characters (e.g. BB00 or ZZ1S).
                        </li>
                        <li>
                            Names containing "A", "B", "Z" as the first and/or second character imply
                            a dinucleotide with stacked bases <br /> and with first/second nucleotide in an A-, B-, or Z-like conformation.
                        </li>
                        <li>
                            Names starting with "IC" correspond to steps with InterCalated bases.
                        </li>
                        <li>
                            Names starting with "OP" correspond to steps with OPen bases.
                        </li>
                        <li>
                            Names containing "S" at 3rd or 4th position imply that the 1st or 2nd base, respectively, is in syn orientation.
                        </li>
                        <li>
                            Conformationally extreme conformers are not assigned to any of the above;
                            these steps formally represent the 97th conformer named NANT.
                        </li>
                    </ul>
                </div>
            </div>
        </Help.Container>
    );
}

class BrowseConformers extends React.Component {
    private search = new Search();

    private renderStepsTable() {
        const names: DynamicTable.Column<string> = { name: 'Name', cells: new Array<DynamicTable.Cell<string>>() };
        const CANAs: DynamicTable.Column<string> = { name: 'CANA', cells: new Array<DynamicTable.Cell<string>>() };
        const NtCs: DynamicTable.Column<string> = { name: 'NtC', cells: new Array<DynamicTable.Cell<string>>() };
        const confals: DynamicTable.Column<number> = { name: 'Confal', cells: new Array<DynamicTable.Cell<number>>() };
        const rmsds: DynamicTable.Column<number> = { name: 'RMSD', cells: new Array<DynamicTable.Cell<number>>() };
        const resolutions: DynamicTable.Column<number> = { name: 'Resolution [\u00C5]', cells: new Array<DynamicTable.Cell<number>>() };
        const haveMaps: DynamicTable.Column<string> = { name: 'Map', cells: new Array<DynamicTable.Cell<string>>() };

        for (const step of this.search.results) {
            names.cells.push({
                data: step.name,
                elem: <div className='rdo-found-conformers-stepname-cell'>{step.name}</div>
            });
            CANAs.cells.push({ data: step.CANA });
            NtCs.cells.push({ data: step.NtC });
            confals.cells.push({ data: step.confal });
            rmsds.cells.push({
                data: step.rmsd,
                elem: <span>{step.rmsd.toFixed(2)}</span>,
            });
            resolutions.cells.push({
                data: step.resolution ?? 0,
                elem: <span>{step.resolution?.toFixed(4) ?? Common.NA}</span>
            });
            haveMaps.cells.push({ data: 'N' });
        }

        const model = new DynamicTable.Model([names, CANAs, NtCs, confals, rmsds, resolutions, haveMaps]);
        const download = this.search.results.length > 0
            ? {
                downloaders: [
                    {
                        caption: 'CSV',
                        download: function(fileNameStem, model) {
                            const text = Serialization.dynamicTable(model, 'csv');
                            doDownload(fileNameStem, text, this.fileType);
                        },
                        fileType: FileTypes.csv,
                    },
                    {
                        caption: 'JSON',
                        download: function(fileNameStem, model) {
                            const text = Serialization.dynamicTable(model, 'json');
                            doDownload(fileNameStem, text, this.fileType);
                        },
                        fileType: FileTypes.json,
                    },
                ] as DynamicTable.Downloader[],
                fileName: `search_${this.search.criteria.NtC}_count_${this.search.criteria.maxCount}_${this.search.criteria.largeStructures ? 'with' : 'without'}_large_${this.search.criteria.redundant ? 'with' : 'without'}_redundant`,
            }
            : undefined;

        return (
            <div>
                <DynamicTableComp
                    model={model}
                    style='wide'
                    download={download}
                    onCellClicked={(data, row, colName) => {
                        if (colName !== 'Name')
                            return;

                        const pdbId = Step.nameToPdbId(data);
                        const redirectTo = `${window.location.origin}?cifcode=${pdbId}&stepName=${data}`;

                        Net.openLink(redirectTo, true);
                    }}
                />
            </div>
        );
    }

    searchConformers = async (criteria: Search.Criteria) => {
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
            this.forceUpdate();
        }
    }

    render() {
        return (
            <div className='rdo-offset'>
                <div className='rdo-width-limiter'>
                    <div style={{ display: 'grid', height: '100%', gridTemplateRows: 'auto auto 1fr', gridTemplateColumns: 'auto', rowGap: 'var(--x-gap)', columnGap: 'var(--x-gap)' }}>
                        <SearchConformers onDoSearch={this.searchConformers} />
                        {this.search.results.length > 0
                            ? <div className='rdo-secondary-caption'>{`Steps with NtC class ${this.search.criteria.NtC} (randomly selected ${this.search.results.length} steps from PDB database)`}</div>
                            : undefined
                        }
                        <div style={{ overflow: 'hidden' }}>
                            <div className='rdo-scroll-vertically'>
                                {this.renderStepsTable()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>NtC</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>CANA</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>Annotation</th>
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
                                <td className='rdo-talgn-center'>{info.NtC}</td>
                                <td className='rdo-talgn-center rdo-list-of-conformers-rb'>{info.CANA}</td>
                                <td className='rdo-list-of-conformers-rb'>{info.description}</td>
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
                        <td className='rdo-list-of-conformers-tb'></td>
                        <td className='rdo-list-of-conformers-rb rdo-list-of-conformers-tb'></td>
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
                        <th className='rdo-list-of-conformers-bb' rowSpan={2}>NtC</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>CANA</th>
                        <th className='rdo-list-of-conformers-bb rdo-list-of-conformers-rb' rowSpan={2}>Annotation</th>
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
                        <NamedList verticalPosition='center'>
                            <NamedListItem name='Download list'>
                                <div style={{ display: 'grid', gridTemplateColumns: '6em 6em 1fr', columnGap: 'var(--h2-gap)' }}>
                                    <DownloadButton
                                        caption='CSV'
                                        onClick={() => Net.serveFile('text/plain', ListOfConformers.raw, 'list_of_conformers.csv')}
                                    />
                                    <DownloadButton
                                        caption='JSON'
                                        onClick={() => Net.serveFile('application/json', JSON.stringify(ListOfConformers.list), 'list_of_conformers.json')}
                                    />
                                </div>
                            </NamedListItem>
                        </NamedList>
                        :
                        <div />
                    }
                </div>
            </div>
        );
    }
}

interface State {
    selected: typeof Tabs[number][0];
}
export class ConformersTab extends React.Component<ConformersTab.Props, State> {
    constructor(props: ConformersTab.Props) {
        super(props);

        this.state = {
            selected: 'table-of-conformers',
        };
    }

    private renderTab() {
        switch (this.state.selected) {
        case 'about-ntcs': return <AboutNtCs />;
        case 'browse-conformers':
            return (
                <BrowseConformers />
            );
        case 'table-of-conformers': return <TableOfConformers />;
        case 'contour-plots': return <ContourPlots />;
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
                            onSwitched={id => this.setState({ ...this.state, selected: id })}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className='rdo-primary-caption'>
                                {Tabs.find((tab) => tab[0] === this.state.selected)![1].title}
                            </div>
                            <div className='rdo-offset' style={{ overflow: 'scroll' }}>
                                {this.renderTab()}
                            </div>
                        </div>
                    </div>
                </ShadowedBox>
            </div>
        );
    }
}

export namespace ConformersTab {
    export interface Props {
    }
}
