import React from 'react';
import { Annotation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { SearchBox } from '../../search-box';
import { Colors } from '../../colors';
import { niceStepName, Common } from '../../common';
import { setDynamicTableModelColumns } from '../../util';
import { DynamicTable as DynamicTableComp } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { searchIcon } from '../../../../assets/images';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { parseIntStrict } from '../../../../util';
import { DynamicTable } from '../../../../util/dynamic-table';
import {
    EmptyStructureSelection,
    InvalidAtom, InvalidChain, InvalidModelIndex, InvalidResidue, InvalidStepId,
    StructureSelection
} from '../../../../util/structure-selection';

export class MainFeatures extends View<View.Props> {
    static readonly unscrollableContainer = true;
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);
    private tableTainer = React.createRef<HTMLDivElement>();
    private searchBoxOpen = false;

    private readonly Searching: SearchBox.Searching<Step> = {
        onRenderResult: (step) => <div>{step.chainAuth} - {niceStepName(step, this.props.structureSelection.modelIndex === InvalidModelIndex)}</div>,
        onSearch: (prompt) => {
            const toks = prompt.split(' ').slice(0, 2);
            const resNoAuth = parseIntStrict(toks.length === 2 ? toks[1] : toks[0]);
            const chainAuth = toks.length === 2 ? toks[0] : void 0;

            if (isNaN(resNoAuth))
                return [];

            const modelIndex = this.props.structureSelection.modelIndex;
            const modelNum = this.modelNumFromIndex(modelIndex);
            const chain = this.props.structureSelection.chain;
            const filterFunc = (step: Step) => {
                return (modelIndex === InvalidModelIndex || step.model === modelNum) && (chain === InvalidChain || chain === step.chain);
            }

            const results = [];
            for (const step of this.props.dnatcofication.data.steps.steps.filter(x => filterFunc(x))) {
                if (step.resNo1Auth === resNoAuth) {
                    if (chainAuth) {
                        if (chainAuth === step.chain)
                            results.push(step);
                    } else
                        results.push(step);
                }
            }

            return results;
        },
        onUseResult: (step) => this.props.switching.changeSelection(
            MainFeatures.SelectionMaker(
                step.id, InvalidResidue, InvalidAtom,
                this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms,
                this.props.dnatcofication
            ),
            MainFeatures.SelectionDisplayer
        ),
    }

    private readonly SearchBoxProps: SearchBox.Props<Step> = {
        anchor: 'bottom-right',
        xOffset: 32,
        yOffset: 32,
        caption: 'Enter chain and residue no.',
        onClose: () => this.searchBoxOpen = false,
        searching: this.Searching,
    };

    constructor(props: View.Props) {
        super(props);

        this.setTableModel(EmptyStructureSelection(props.dnatcofication));
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, label_asym_id_1, auth_asym_id_1, name } = steps;
        const { assigned_NtC, assigned_CANA, closest_NtC, closest_CANA } = summary;

        const chainColumn: DynamicTable.Column<string> = {
            name: 'Chain', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>PDB chain ID (author)</div>,
        };
        const stepColumn: DynamicTable.Column<string> = {
            name: 'Dinucleotide', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            notSortable: true,
            tooltip: <div>Dinucleotide step identifier</div>,
        };
        const ntcColumn: DynamicTable.Column<string> = {
            name: 'NtC', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };
        const canaColumn: DynamicTable.Column<string> = {
            name: 'CANA', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div><span className='rdo-emphasize'>C</span>onformational <span className='rdo-emphasize'>A</span>lphabet of <span className='rdo-emphasize'>N</span>ucleic <span className='rdo-emphasize'>A</span>cids</div>,
        };

        const columns = [chainColumn, stepColumn, ntcColumn, canaColumn];

        const lastRow = steps._rowCount - 1;
        const lastNucleotide:string = Cif.Column.value(name, lastRow)!;
        const nucleotideCounts: { [ntc: string]: number } = {};

        const lastNucleotideSplit = lastNucleotide.split("_");
        const lastElement = lastNucleotideSplit[4]
        console.log('LAST ELEMENT ' + lastElement);

        let text = "";

        for (let row = 0; row < steps._rowCount; row++) {
            const nucleotide:string = Cif.Column.value(name, row)!;

            const parts = nucleotide.split("_");
            if (parts.length >= 3) {
                text = parts.slice(2, 3).join("_");
                console.log(text);
            }
        }

        for (let row = 0; row < steps._rowCount; row++) {
            nucleotideCounts[lastElement + text] = (nucleotideCounts[lastElement + text] || 0) + 1;
        }

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            if (selectedModelNum !== InvalidModelIndex && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const tags = columns.map(() => tag);
            const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name
            const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
            const assignedCANA = Cif.Column.value(assigned_CANA, row)!;

            //if (parts.length >= 3) {
            //    const text = parts.slice(2, 3).join("_");
            //    console.log(text);
            //} else (parts.length >= 3) 
            //    const text = parts.slice(2, 3).join("_");
            //    console.log(text);

            setDynamicTableModelColumns(
                this.tableModel,
                row,
                columns,
                tags,
                [
                    Cif.Column.value(auth_asym_id_1, row)!,
                    tag,
                    assignedNtC,
                    assignedCANA
                ],
                [
                    void 0,
                    () => niceStepName(_step, selectedModelNum === InvalidModelIndex),
                    () => (
                        assignedNtC === 'NANT'
                            ?
                                <Tooltip
                                    tag={<span className='text-secondary-third'>{Cif.Column.value(closest_NtC, row)!}</span>}
                                    delayMsec={300}
                                >
                                    This step is unassigned. Closest NtC is shown instead.
                                </Tooltip>
                            : <span>{assignedNtC}</span>
                    ),
                    () => (
                        assignedCANA === 'NAN'
                            ?
                                <Tooltip
                                    tag={<span className='text-secondary-third'>{Cif.Column.value(closest_CANA, row)!}</span>}
                                    delayMsec={300}
                                >
                                    This step is unassigned. Closest CANA is shown instead.
                                </Tooltip>
                            : <span>{assignedCANA}</span>
                    )
                ]
            );
        }

        return new DynamicTable.Model(columns);
    }

    private modelNumFromIndex(modelIndex: number) {
        return modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[modelIndex].num
            : InvalidModelIndex;
    }

    private renderStepsTable() {
        const stepName = this.props.structureSelection.steps.length  === 0 ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.steps[0]).name;

        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const { assigned_NtC, assigned_CANA } = summary;
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const { name } = steps;

        const lastRow = steps._rowCount - 1;
        const lastNucleotide:string = Cif.Column.value(name, lastRow)!;
        const nucleotideCounts: { [key: string]: number } = {};

        const lastNucleotideSplit = lastNucleotide.split("_");
        const lastElement = lastNucleotideSplit[4]

        let text: string[] = [];

        for (let row = 0; row < steps._rowCount; row++) {
            const nucleotide:string = Cif.Column.value(name, row)!;

            const parts = nucleotide.split("_");
            if (parts.length >= 3) {
                const part = parts.slice(2, 3).join("_");
                text.push(part);
            }
        }

        text.push(lastElement);

        text.forEach(element => {
            nucleotideCounts[element] = (nucleotideCounts[element] || 0) + 1;
        });


        const ntCCounts: { [ntc: string]: number } = {};
        const canaCounts: { [ntc: string]: number } = {};

        for (let row = 0; row < steps._rowCount; row++) {
            const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
            ntCCounts[assignedNtC] = (ntCCounts[assignedNtC] || 0) + 1;
        }

        for (let row = 0; row < steps._rowCount; row++) {
            const assignedCANA = Cif.Column.value(assigned_CANA, row)!;
            canaCounts[assignedCANA] = (canaCounts[assignedCANA] || 0) + 1;
        }

        return (
            <>
                <div className='justify-around hidden'>
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan={2} className='mb-4'>Statistics by NtC</th>
                                </tr>
                                <tr>
                                    <th>NtC</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(ntCCounts).map(([ntc, count], index, array) => (
                                    <tr key={ntc}>
                                        <td className={`border-r-[.1px] border-r-primary-first w-[7rem] text-center ${index === array.length - 1 ? ' border-b-0' : 'border-b-primary-first border-b-[.1px]'} `}>{ntc}</td>
                                        <td className={`${index === array.length - 1 ? ' border-b-0' : 'border-b-primary-first border-b-[.1px]'} w-[7rem] text-center`}>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan={2} className='mb-4'>Statistics by CANA</th>
                                </tr>
                                <tr>
                                    <th>CANA</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(canaCounts).map(([cana, count], index, array) => (
                                    <tr key={cana}>
                                        <td className={`border-r-[.1px] border-r-primary-first w-[7rem] text-center ${index === array.length - 1 ? ' border-b-0' : 'border-b-primary-first border-b-[.1px]'} `}>{cana}</td>
                                        <td className={`${index === array.length - 1 ? ' border-b-0' : 'border-b-primary-first border-b-[.1px]'} w-[7rem] text-center`}>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className=''>
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan={2} className='mb-4 p-4 text-20px'>Statistics by nucleotide</th>
                                </tr>
                                <tr>
                                    <th className='pb-2'>NtC</th>
                                    <th className='pb-2'>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(nucleotideCounts).map(([nucleotide, count], index, array) => (
                                    <tr key={nucleotide}>
                                        <td className='font-bold border-r-[.1px] py-1 px-7 border-primary-first w-[7rem] text-center border-t-primary-first border-t-[.1px]'>{nucleotide}</td>
                                        <td className='font-bold border-t-primary-first py-1 px-7 border-t-[.1px] w-[7rem] text-center'>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='hidden'>
                    <DynamicTableComp
                        model={this.tableModel}
                        onCellClicked={(data, row, colName) => {
                            const cIdx = this.tableModel.columnNames.findIndex(cn => cn === 'Step');
                            if (cIdx === -1)
                                return;

                            const stepName = row[cIdx].data;
                            const stepId = StepsMapper.byName(this.props.dnatcofication, stepName)?.id ?? InvalidStepId;
                            if (stepId !== InvalidStepId)
                                this.props.switching.changeSelection(
                                    MainFeatures.SelectionMaker(
                                        stepId, InvalidResidue, InvalidAtom,
                                        this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms,
                                        this.props.dnatcofication
                                    ),
                                    MainFeatures.SelectionDisplayer
                                );
                        }}
                        highlightedTag={stepName}
                        highlightColor={Colors.CurrentStep()}
                        scrollTainer={this.tableTainer.current ?? void 0}
                        style='wide'
                    />
                </div>
            </>
        );
    }

    private setTableModel(sel: StructureSelection) {
        const modelNum  = this.modelNumFromIndex(sel.modelIndex);
        this.tableModel = this.makeTableModel(
            modelNum,
            sel.chain === InvalidChain ? void 0 : sel.chain
        );
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.setTableModel(EmptyStructureSelection(this.props.dnatcofication)));
        this.subscribe(this.props.switching.events.modelSwitched, (sel) => {
            this.setTableModel(sel);
            this.forceUpdate();
        });
        this.subscribe(this.props.switching.events.chainSwitched, (sel) => {
            this.setTableModel(sel);
            this.forceUpdate();
        });
        this.subscribe(this.props.switching.events.selectionChanged, (sel) => {
            this.setTableModel(sel);
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        const selfRef = React.createRef<HTMLDivElement>();

        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const { assigned_NtC, assigned_CANA } = summary;
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);


        const ntCCounts: { [ntc: string]: number } = {};
        const canaCounts: { [ntc: string]: number } = {};

        for (let row = 0; row < steps._rowCount; row++) {
            const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
            ntCCounts[assignedNtC] = (ntCCounts[assignedNtC] || 0) + 1;
        }

        for (let row = 0; row < steps._rowCount; row++) {
            const assignedCANA = Cif.Column.value(assigned_CANA, row)!;
            canaCounts[assignedCANA] = (canaCounts[assignedCANA] || 0) + 1;
        }

        return (
            <div className='overflow-scroll h-full flex flex-col relative' ref={selfRef}>
                <div className='font-700 mb-2 p-2 text-center border-b border-primary-first'>Main features</div>

                <div className='hidden'>
                    <NamedList sizing='min-content' rowSpacing='half'>
                    {
                        numModels > 1
                            ? <NamedListItem name='Model'>
                                    <ModelSelect
                                        dnatcofication={this.props.dnatcofication}
                                        structureSelection={this.props.structureSelection}
                                        switching={this.props.switching}
                                    />
                                </NamedListItem>
                            : undefined
                    }
                        <NamedListItem name='Chain'>
                            <ChainSelect
                                dnatcofication={this.props.dnatcofication}
                                structureSelection={this.props.structureSelection}
                                switching={this.props.switching}
                            />
                        </NamedListItem>
                    </NamedList>
                </div>
                <div className='flex justify-evenly'>
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan={2} className='mb-4 p-4 text-20px'>Statistics by NtC</th>
                                </tr>
                                <tr>
                                    <th className='pb-2'>NtC</th>
                                    <th className='pb-2'>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(ntCCounts).map(([ntc, count]) => (
                                    <tr key={ntc}>
                                        <td className='font-bold border-r-[.1px] py-1 px-7 border-primary-first w-[7rem] text-center border-t-primary-first border-t-[.1px]'>{ntc}</td>
                                        <td className='font-bold border-t-primary-first py-1 px-7 border-t-[.1px] w-[7rem] text-center'>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan={2} className='mb-4 p-4 text-20px'>Statistics by CANA</th>
                                </tr>
                                <tr>
                                    <th className='pb-2'>CANA</th>
                                    <th className='pb-2'>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(canaCounts).map(([cana, count]) => (
                                    <tr key={cana}>
                                        <td className='font-bold border-r-[.1px] py-1 px-7 border-primary-first w-[7rem] text-center border-t-primary-first border-t-[.1px]'>{cana}</td>
                                        <td className='font-bold border-t-primary-first py-1 px-7 border-t-[.1px] w-[7rem] text-center'>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className=''>
                    <div className='rdo-secondary-caption hidden'>Table of assigned dinucleotide NtC conformers</div>
                    <div style={ Common.VScrollElement } ref={this.tableTainer}>
                        <div className='rdo-scroll-vertically-with-scrollbar'>
                            {this.renderStepsTable()}
                        </div>
                    </div>

                    <div className='rdo-floating-search-icon-tainer bottom-4 right-4 bg-primary-first rounded-standart absolute flex justify-center items-center opacity-0 hover:opacity-100 w-12 h-12'>
                        <div
                            className='rdo-floating-search-icon '
                            onClick={() => {
                                const tainer = selfRef.current;
                                if (!tainer || this.searchBoxOpen)
                                    return;

                                this.searchBoxOpen = true;
                                SearchBox.create(tainer, this.SearchBoxProps);
                            }}
                        >
                            <img src={searchIcon} className='w-5'/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export namespace MainFeatures {
    export const SelectionDisplayer = Annotation.selectionDisplayer;
    export const SelectionMaker = Annotation.selectionMaker;
}
