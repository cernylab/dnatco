import React from 'react';
import { ContourPlots } from './contour-plots';
import { Help } from './help';
import { SearchConformers } from './search-conformers';
import { DynamicTable as DynamicTableComp } from './common/dynamic-table';
import { InProgress } from './common/in-progress';
import { NamedList, NamedListItem } from './common/named-list';
import { Popup } from './common/popup';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { DownloadButtonComponent } from './dnatco/common';
import { Net } from '../browser-util/net';
import { doDownload } from '../browser-util/downloader';
import { ListOfConformers } from '../dnatco/list-of-conformers';
import { Step } from '../dnatco/step';
import { Search } from '../remote/search';
import { Common } from '../util/dnatco';
import { DynamicTable } from '../util/dynamic-table';
import { FileTypes } from '../util/file-type';
import { Serialization } from '../util/serialization';
import { browse } from '../help-tags';
import { arrowDown, arrowDownHover } from '../assets/images';

const Tabs = [
    ['browse-conformers', { caption: 'Conformers', title: 'Search PDB database for dinucleotide steps of given conformation (NtC)' }],
    ['base-pairs', { caption: 'Base pairs', title: 'Base pairs' }],
    ['table-of-conformers', { caption: 'Table of conformers', title: 'Table of conformers' }],
    ['contour-plots', { caption: 'Contour plots', title: 'RSCC vs. Cartesian rmsd' }],
    ['help', { caption: 'Help', title: 'Help' }],
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

function HelpTab() {

    const displayBrowse = browse.map(page => ({
        headline: page.headline,
        subHeadlineText: page.subHeadlineText,
        sections: page.sections.map(section => ({
            headline: section.headline,
            paragraphs: section.paragraphs
        }))
    }))

    return (
        <Help.Container>
            {displayBrowse.map((page:any, index:any) => (
                <>
                    <div key={index} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-700 text-18px mb-2 uppercase'>
                                {page.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            {page.subHeadlineText}
                        </div>
                    </div>
                    {page.sections.map((section:any, idx:any) => (
                        <div key={index + '-' + idx} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                            <div className='w-[25%]'>
                                <h3 className='font-700 text-18px mb-2 uppercase'>
                                    {section.headline}
                                </h3>
                            </div>
                            <div className='w-[75%] text-16px mb-2 text-justify'>
                                {section.paragraphs.map((item: any, itemIdx: any) => (
                                    <div key={itemIdx}>
                                        {item.type === 'paragraph' && (
                                            <>
                                                <p>{item.text}</p>
                                                <div className='h-3'></div>
                                            </>
                                        )}
                                        {item.type === 'image' && (
                                            <img src={item.url} alt={`Image ${itemIdx}`} className={`${item.width} my-4`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            ))}
        </Help.Container>
    )

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
                <div className='text-secondary-third'>
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
            <div>
                <div className='h-full mx-auto'>
                    <div style={{ display: 'grid', height: '100%', gridTemplateRows: 'auto auto 1fr', gridTemplateColumns: 'auto', rowGap: 'var(--x-gap)', columnGap: 'var(--x-gap)' }}>
                        <SearchConformers onDoSearch={this.searchConformers} />
                        {this.search.results.length > 0
                            ? <div className='rdo-secondary-caption'>{`Steps with NtC class ${this.search.criteria.NtC} (randomly selected ${this.search.results.length} steps from PDB database)`}</div>
                            : undefined
                        }
                        {this.search.results.length > 0 &&
                            <div className='overflow-hidden'>
                                <div className='rdo-scroll-vertically'>
                                    {this.renderStepsTable()}
                                </div>
                            </div>
                        }
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
                return <div className='text-secondary-third'>{`List of conformers failed to load: ${ListOfConformers.fail}`}</div>
            return <div>List of conformers is still loading...</div>
        }

        let totalDNACount = 0;
        let totalRNACount = 0;
        let totalGSCount = 0;

        return (
            <table className='rdo-list-of-conformers rdo-data-table-wide'>
                <thead>
                    <tr>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>NtC</th>
                        <th className='border-b border-solid border-primary-first border-r' rowSpan={2}>CANA</th>
                        <th className='border-b border-solid border-primary-first border-r' rowSpan={2}>Annotation</th>
                        <th className='border-r border-solid border-primary-first' colSpan={5}>Number of steps in</th>
                        <th className='border-b border-solid border-primary-first bg-[#FBEDDA]' rowSpan={2}>δ1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>ε1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>ζ1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>α2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>β2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>γ2</th>
                        <th className='border-b border-solid border-primary-first bg-[#FBEDDA]' rowSpan={2}>δ2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>χ1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>χ2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>μ</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>NN</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>C'C'</th>
                    </tr>
                    <tr>
                        <th className='border-b border-solid border-primary-first'>{'N\u00A0DNA'}</th>
                        <th className='border-b border-solid border-primary-first'>{'%\u00A0DNA'}</th>
                        <th className='border-b border-solid border-primary-first'>{'N\u00A0RNA'}</th>
                        <th className='border-r border-b border-solid border-primary-first'>{'%\u00A0RNA'}</th>
                        <th className='border-r border-b border-solid border-primary-first'>{'N\u00A0GS'}</th>
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
                                        'bg-[#FFDFD1]'
                                        :
                                        idx % 2 === 1
                                            ? 'bg-[#E6F4F8]' : ''
                                }
                                key={idx}
                            >
                                <td className='text-center'>{info.NtC}</td>
                                <td className='text-center border-r border-solid border-primary-first'>{info.CANA}</td>
                                <td className='border-r border-solid border-primary-first'>{info.description}</td>
                                <td className='text-right'>{fmtInt(info.countInDNA)}</td>
                                <td className='text-right'>{fmtFlt(info.percentInDNA)}</td>
                                <td className='text-right'>{fmtInt(info.countInRNA)}</td>
                                <td className='border-r border-solid border-primary-first text-right'>{fmtFlt(info.percentInRNA)}</td>
                                <td className='border-r border-solid border-primary-first text-right'>{fmtInt(info.countGS)}</td>
                                <td className={`text-right rdo-list-of-conformers-highlighted-${info.highlight ? 'row' : 'col'}`}>{fmtInt(info.delta1)}</td>
                                <td className='text-right'>{fmtInt(info.epsilon1)}</td>
                                <td className='text-right'>{fmtInt(info.zeta1)}</td>
                                <td className='text-right'>{fmtInt(info.alpha2)}</td>
                                <td className='text-right'>{fmtInt(info.beta2)}</td>
                                <td className='text-right'>{fmtInt(info.gamma2)}</td>
                                <td className={`text-right rdo-list-of-conformers-highlighted-${info.highlight ? 'row' : 'col'}`}>{fmtInt(info.delta2)}</td>
                                <td className='text-right'>{fmtInt(info.chi1)}</td>
                                <td className='text-right'>{fmtInt(info.chi2)}</td>
                                <td className='text-right'>{fmtInt(info.mu)}</td>
                                <td className='text-right'>{fmtFlt(info.NN)}</td>
                                <td className='text-right'>{fmtFlt(info.CC)}</td>
                            </tr>
                        );
                    })
                }
                    <tr>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-r border-solid border-primary-first border-t'></td>
                        <td className='border-r border-solid border-primary-first border-t'></td>
                        <td className='border-t border-solid border-primary-first text-right'>{fmtInt(totalDNACount)}</td>
                        <td className='border-t border-solid border-primary-first text-right'></td>
                        <td className='border-t border-solid border-primary-first text-right'>{fmtInt(totalRNACount)}</td>
                        <td className='border-r border-solid border-primary-first border-t text-right'></td>
                        <td className='border-r border-solid border-primary-first border-t text-right'>{fmtInt(totalGSCount)}</td>
                        <td className='border-t border-solid border-primary-first bg-[#FBEDDA]'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first bg-[#FBEDDA]'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                        <td className='border-t border-solid border-primary-first'></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>NtC</th>
                        <th className='border-b border-solid border-primary-first border-r' rowSpan={2}>CANA</th>
                        <th className='border-b border-solid border-primary-first border-r' rowSpan={2}>Annotation</th>
                        <th className='border-t border-solid border-primary-first'>{'N\u00A0DNA'}</th>
                        <th className='border-t border-solid border-primary-first'>{'%\u00A0DNA'}</th>
                        <th className='border-t border-solid border-primary-first'>{'N\u00A0RNA'}</th>
                        <th className='border-t border-solid border-primary-first'>{'%\u00A0RNA'}</th>
                        <th className='border-t border-r border-solid border-primary-first'>{'N\u00A0GS'}</th>
                        <th className='border-b border-solid border-primary-first bg-[#FBEDDA]' rowSpan={2}>δ1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>ε1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>ζ1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>α2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>β2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>γ2</th>
                        <th className='border-b border-solid border-primary-first bg-[#FBEDDA]' rowSpan={2}>δ2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>χ1</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>χ2</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>μ</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>NN</th>
                        <th className='border-b border-solid border-primary-first' rowSpan={2}>C'C'</th>
                    </tr>
                    <tr>
                        <th className='border-r' colSpan={5}>Number of steps in</th>
                    </tr>
                </thead>
            </table>
        );
    }

    render() {
        return (
            <div className='h-full mx-auto overflow-hidden' style={{ flex: 1 }}>
                <div style={{ display: 'grid', height: '100%', gridTemplateRows: '1fr auto', gridTemplateColumns: 'auto', rowGap: 'var(--x-gap)', columnGap: 'var(--x-gap)' }}>
                    <div className='overflow-hidden'>
                        <div className='rdo-scroll-vertically'>
                            {this.renderList()}
                        </div>
                    </div>
                    {ListOfConformers.has()
                        ?
                        <NamedList verticalPosition='center'>
                            <NamedListItem name='Download list'>
                                <div className='flex'>
                                    <DownloadButtonComponent
                                        title='CSV'
                                        defaultImage={arrowDown as string} 
                                        hoverImage={arrowDownHover as string}
                                        onClick={() => Net.serveFile('text/plain', ListOfConformers.raw, 'list_of_conformers.csv')}
                                    />
                                    <DownloadButtonComponent
                                        title='JSON'
                                        defaultImage={arrowDown as string} 
                                        hoverImage={arrowDownHover as string}
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
            selected: 'browse-conformers',
        };
    }

    private renderTab() {
        switch (this.state.selected) {
        case 'browse-conformers':
            return (
                <BrowseConformers />
            );
        case 'base-pairs':
            return (
                <>
                    <div className='bg-primary-first text-white p-3 mb-3 w-fit rounded-standart transition-all hover:bg-secondary-second hover:text-primary-first'>
                        <a
                            className='font-700'
                            href='https://basepairs.datmos.org/#tWW-A-A/'
                            target='_blank'>
                                Open base pairs
                        </a>
                    </div>
                    <div>You will be redirected to a new page by clicking on this button, and none of your work will be lost</div>
                </>
            );
        case 'table-of-conformers': return <TableOfConformers />;
        case 'contour-plots': return <ContourPlots />;
        case 'help': return <HelpTab />;
        }
    }

    render() {
        return (
            <div className='rdo-offset'>
                    <div className='rdo-screen-with-side-panel overflow-hidden h-full flex flex-col'>
                        <SideSwitchingPanel
                            items={Tabs}
                            selectedItemId={this.state.selected}
                            onSwitched={id => this.setState({ ...this.state, selected: id })}
                        />
                        <div className='flex flex-col overflow-hidden mx-4 mb-4'>
                            <div className=' text-22px uppercase font-700 mb-4'>
                                {Tabs.find((tab) => tab[0] === this.state.selected)![1].title}
                            </div>
                            <div className='overflow-scroll'>
                                {this.renderTab()}
                            </div>
                        </div>
                    </div>
            </div>
        );
    }
}

export namespace ConformersTab {
    export interface Props {
    }
}
