import React from 'react';
import { Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Colors } from '../../colors';
import { Common, niceStepName } from '../../common';
import { setDynamicTableModelColumns } from '../../util';
import { DynamicTable as DynamicTableComp } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { IconButton } from '../../../common/push-button';
import { Tooltip } from '../../../common/tooltip';
import { XImg } from '../../../../assets/images';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { NtC } from '../../../../dnatco/ntc';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { DynamicTable } from '../../../../util/dynamic-table';
import {
    EmptyStructureSelection,
    InvalidAtom, InvalidChain, InvalidModelIndex, InvalidResidue, InvalidStepId,
    StructureSelection
} from '../../../../util/structure-selection';

export class ChangeNtCs extends View<Refinement.Props> {
    static readonly unscrollableContainer = true;
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);
    private tableTainer = React.createRef<HTMLDivElement>();

    constructor(props: Refinement.Props) {
        super(props);

        this.setTableModel(EmptyStructureSelection(props.dnatcofication));
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, label_asym_id_1, auth_asym_id_1, name } = steps;
        const { assigned_NtC, closest_NtC } = summary;

        const chainColumn: DynamicTable.Column<string> = {
            name: 'Chain', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>PDB chain ID (author)</div>,
        };
        const stepColumn: DynamicTable.Column<string> = {
            name: 'Step', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            notSortable: true,
            tooltip: <div>Dinucleotide step identifier</div>,
        };
        const computedNtCColumn: DynamicTable.Column<string> = {
            name: 'Computed NtC', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };
        const customNtCColumn: DynamicTable.Column<string> = {
            name: 'Custom NtC', cells: new Array<DynamicTable.Cell<string>>(),
            notSortable: true,
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };

        const makeSelCell = this.props.selectedCustomNtCSet === ''
            ? () => <div style={{ height: '1.5em', textAlign: 'center' }}>(Not changeable)</div>
            : (row: number) => {
                const step = Cif.Column.value(name, row)!;
                const computedNtC = Cif.Column.value(closest_NtC, row)! as NtC.ValidClass; // closest_NtC will must always be something
                const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, step);
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 2em 1fr', gap: 'var(--h2-gap)', height: '1.5em' }}>
                        <Refinement.NtCSelector
                            value={customNtC ?? computedNtC}
                            onChanged={v => {
                                this.props.dnatcofication.customNtCs.setCustomNtC(
                                    this.props.selectedCustomNtCSet,
                                    step,
                                    v
                                );
                            }}
                        />
                        {customNtC
                            ?
                                <IconButton
                                    src={XImg}
                                    onClick={() => this.props.dnatcofication.customNtCs.deleteCustomNtC(this.props.selectedCustomNtCSet, step)}
                                    className='rdo-icon-text-button'
                                />
                            : <div />
                        }
                        <div />
                    </div>
                );
            };

        const columns = [chainColumn, stepColumn, computedNtCColumn, customNtCColumn];

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            if (selectedModelNum !== -1 && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const tags = [tag, tag, tag, void 0];
            const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name
            const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
            const computedNtC = Cif.Column.value(closest_NtC, row)!
            const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, tag);
            const modelCustomNtC = `${this.props.selectedCustomNtCSet}-${customNtC ? customNtC : computedNtC}`;

            setDynamicTableModelColumns(
                this.tableModel,
                row,
                columns,
                tags,
                [
                    Cif.Column.value(auth_asym_id_1, row)!,
                    tag,
                    assignedNtC,
                    modelCustomNtC,
                ],
                [
                    void 0,
                    () => niceStepName(_step),
                    () => (
                        assignedNtC === 'NANT'
                            ?
                                <Tooltip
                                    tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_NtC, row)!}</span>}
                                    delayMsec={300}
                                >
                                    This step is unassigned. Closest NtC is shown instead.
                                </Tooltip>
                            : <span>{assignedNtC}</span>
                    ),
                    () => <div style={{ width: '9em', margin: 'auto' }}>{makeSelCell(row)}</div>,
                ]
            );
        }

        return new DynamicTable.Model(columns);
    }

    private renderStepsTable() {
        const stepName = this.props.structureSelection.steps.length === 0 ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.steps[0]).name;

        return (
            <DynamicTableComp
                model={this.tableModel}
                onCellClicked={(data, row, colName) => {
                    if (colName === 'Custom NtC')
                        return;

                    const cIdx = this.tableModel.columnNames.findIndex(cn => cn === 'Step');
                    if (cIdx === -1)
                        return;

                    const stepName = row[cIdx].data;
                    const stepId = StepsMapper.byName(this.props.dnatcofication, stepName)?.id ?? InvalidStepId;
                    if (stepId !== InvalidStepId) {
                        const sel = ChangeNtCs.SelectionMaker(stepId, InvalidResidue, InvalidAtom, this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms, this.props.dnatcofication);
                        this.props.switching.changeSelection(sel, ChangeNtCs.SelectionDisplayer);
                    }
                }}
                highlightedTag={stepName}
                highlightColor={Colors.CurrentStep()}
                scrollTainer={this.tableTainer.current ?? void 0}
                style='wide'
                modelsAlwaysCompareFalse
            />
        );
    }

    private setTableModel(sel: StructureSelection) {
        const modelNum = sel.modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[sel.modelIndex].num
            : InvalidModelIndex;
        this.tableModel = this.makeTableModel(modelNum, sel.chain === InvalidChain ? void 0 : sel.chain);
    }

    componentDidMount() {
        this.subscribe(
            this.props.dnatcofication.customNtCs.events.setChanged,
            (update) => {
                if (update.set === this.props.selectedCustomNtCSet) {
                    const sel = this.props.structureSelection;
                    this.setTableModel(sel);
                    this.forceUpdate();
                }
            }
        );

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

    componentDidUpdate(prevProps: Refinement.Props) {
        if (this.props.selectedCustomNtCSet !== prevProps.selectedCustomNtCSet) {
            const sel = this.props.structureSelection;
            this.setTableModel(sel);
            this.forceUpdate();
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);

        return (
            <div style={ Common.VScrollJail }>
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

                <CustomNtCSets
                    customNtCs={this.props.dnatcofication.customNtCs}
                    selectedSet={this.props.selectedCustomNtCSet}
                    onSetChanged={this.props.onCustomNtCSetChanged}
                />

                <div className='rdo-line-spacer' />
                <div style={ Common.VScrollElement } ref={this.tableTainer}>
                    <div className='rdo-scroll-vertically-with-scrollbar'>
                        {this.renderStepsTable()}
                    </div>
                </div>
            </div>
        );
    }
}

export namespace ChangeNtCs {
    export const SelectionDisplayer = Refinement.selectionDisplayer;
    export const SelectionMaker = Refinement.selectionMaker;
}
