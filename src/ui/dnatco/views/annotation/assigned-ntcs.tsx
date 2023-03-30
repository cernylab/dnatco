import React from 'react';
import { Annotation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { SearchBox } from '../../search-box';
import { EmptyStructureSelection, InvalidChain, InvalidModelIndex, InvalidResidue, InvalidStepId, StructureSelection } from '../../structure-selection';
import { niceStepName, Common } from '../../common';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { IconButton } from '../../../common/push-button';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { parseIntStrict } from '../../../../util';
import { doDownload, FileTypes } from '../../../../util/downloader';
import { Serialization } from '../../../../util/serialization';
import { GlobalConfig } from '../../../../global-config';
import 'assets/imgs/info.svg';
import 'assets/imgs/info-inverse.svg';
import 'assets/imgs/magnifying-glass.svg';

export class AssignedNtCs extends View<View.Props> {
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
        onUseResult: (step) => this.props.switching.changeSelection(AssignedNtCs.SelectionMaker(step.id, InvalidResidue, this.props.structureSelection.steps, this.props.structureSelection.residues), AssignedNtCs.SelectionDisplayer),
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
            name: 'Step', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
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

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            if (selectedModelNum !== InvalidModelIndex && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name

            chainColumn.cells.push({ data: Cif.Column.value(auth_asym_id_1, row)!, tag });
            stepColumn.cells.push({
                data: tag,
                elem: niceStepName(_step, selectedModelNum === InvalidModelIndex),
                tag
            });
            ntcColumn.cells.push({
                data: Cif.Column.value(assigned_NtC, row)!,
                elem: (() => {
                    const assigned = Cif.Column.value(assigned_NtC, row)!;
                    return assigned === 'NANT'
                        ?
                            <Tooltip
                                tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_NtC, row)!}</span>}
                                delayMsec={300}
                            >
                                This step is unassigned. Closest NtC is shown instead.
                            </Tooltip>
                        : <span>{assigned}</span>;
                })(),
                tag
            });
            canaColumn.cells.push({
                data: Cif.Column.value(assigned_CANA, row)!,
                elem: (() => {
                    const assigned = Cif.Column.value(assigned_CANA, row)!;
                    return assigned === 'NAN'
                        ?
                            <Tooltip
                                tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_CANA, row)!}</span>}
                                delayMsec={300}
                            >
                                This step is unassigned. Closest CANA is shown instead.
                            </Tooltip>
                        : <span>{assigned}</span>;
                })(),
                tag
            });
        }

        return new DynamicTable.Model([chainColumn, stepColumn, ntcColumn, canaColumn]);
    }

    private modelNumFromIndex(modelIndex: number) {
        return modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[modelIndex].num
            : InvalidModelIndex;
    }

    private renderStepsTable() {
        const stepName = this.props.structureSelection.steps.length  === 0 ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.steps[0]).name;

        return (
            <DynamicTable
                model={this.tableModel}
                onCellClicked={(data, row, colName) => {
                    const cIdx = this.tableModel.columnNames.findIndex(cn => cn === 'Step');
                    if (cIdx === -1)
                        return;

                    const stepName = row[cIdx].data;
                    const stepId = StepsMapper.byName(this.props.dnatcofication, stepName)?.id ?? InvalidStepId;
                    if (stepId !== InvalidStepId)
                        this.props.switching.changeSelection(AssignedNtCs.SelectionMaker(stepId, InvalidResidue, this.props.structureSelection.steps, this.props.structureSelection.residues), AssignedNtCs.SelectionDisplayer);
                }}
                highlightedTag={stepName}
                scrollTainer={this.tableTainer.current ?? void 0}
                style='wide'
                download={{
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
                    ],
                    fileName: `${this.props.dnatcofication.identifyingName}_assigned_ntcs`,
                }}
            />
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
        const prefix = GlobalConfig.data().pathPrefix;
        const selfRef = React.createRef<HTMLDivElement>();

        return (
            <div style={{ ...Common.VScrollJail, position: 'relative' }} ref={selfRef}>
                <div className='rdo-view-caption'>Assigned NtCs</div>

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
                <div className='rdo-line-spacer' />

                <div style={ Common.VScrollElement } ref={this.tableTainer}>
                    <div className='rdo-scroll-vertically-with-scrollbar'>
                        {this.renderStepsTable()}
                    </div>
                </div>

                <div className='rdo-floating-search-icon-tainer' style={{ bottom: 'var(--x-gap)', right: 'var(--x-gap)' }}>
                    <IconButton
                        src={`${prefix}/imgs/magnifying-glass.svg`}
                        className='rdo-floating-search-icon rdo-pushbutton-border'
                        onClick={() => {
                            const tainer = selfRef.current;
                            if (!tainer || this.searchBoxOpen)
                                return;

                            this.searchBoxOpen = true;
                            SearchBox.create(tainer, this.SearchBoxProps);
                        }}
                    />
                </div>
            </div>
        );
    }
}

export namespace AssignedNtCs {
    export const SelectionDisplayer = Annotation.selectionDisplayer;
    export const SelectionMaker = Annotation.selectionMaker;
}
