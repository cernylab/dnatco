import React from 'react';
import { Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Common, niceStepName } from '../../common';
import { EmptyStructureSelection, InvalidChain, InvalidModelIndex, InvalidStepId, StructureSelection } from '../../structure-selection';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { IconButton } from '../../../common/push-button';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';

export class ChangeNtCs extends View<Refinement.Props> {
    static readonly unscrollableContainer = true;
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);

    constructor(props: Refinement.Props) {
        super(props);

        this.setTableModel(EmptyStructureSelection(props.dnatcofication));
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, label_asym_id_1, name } = steps;
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
            name: 'Custom NtC', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            notSortable: true,
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };

        const makeSelCell = this.props.selectedCustomNtCSet === ''
            ? () => <span>(Not changeable)</span>
            : (row: number) => {
                const step = Cif.Column.value(name, row)!;
                const computedNtC = Cif.Column.value(closest_NtC, row)!;
                const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, step);
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--h2-gap)' }}>
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
                                    src={`imgs/x.svg`}
                                    onClick={() => this.props.dnatcofication.customNtCs.deleteCustomNtC(this.props.selectedCustomNtCSet, step)}
                                    className='rdo-icon-text-button'
                                />
                            : <span />
                        }
                    </div>
                );
            };

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            if (selectedModelNum !== -1 && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name

            chainColumn.cells.push({ data: chain, tag });
            stepColumn.cells.push({
                data: tag,
                elem: niceStepName(_step),
                tag
            });
            computedNtCColumn.cells.push({
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

            customNtCColumn.cells.push({
                data: '',
                elem: makeSelCell(row),
            });
        }

        return new DynamicTable.Model([chainColumn, stepColumn, computedNtCColumn, customNtCColumn]);
    }

    private renderStepsTable() {
        const stepName = this.props.structureSelection.stepId === InvalidStepId ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.stepId).name;

        return (
            <DynamicTable
                model={this.tableModel}
                onCellClicked={(data, row, colName) => {
                    if (colName === 'Custom NtC')
                        return;

                    const cIdx = this.tableModel.columnNames.findIndex(cn => cn === 'Step');
                    if (cIdx === -1)
                        return;

                    const stepName = row[cIdx].data;
                    const stepId = StepsMapper.byName(this.props.dnatcofication, stepName)?.id ?? InvalidStepId;
                    if (stepId !== InvalidStepId)
                        this.props.switching.switchStepId(stepId);
                }}
                highlightedTag={stepName}
                scrollTainer={this.props.scrollableParent}
                style='wide'
            />
        );
    }

    private setTableModel(sel: StructureSelection) {
        const modelNum = sel.modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[this.props.structureSelection.modelIndex].num
            : InvalidModelIndex;
        this.tableModel = this.makeTableModel(modelNum, sel.chain === InvalidChain ? void 0 : sel.chain);
    }

    componentDidMount() {
        this.subscribe(
            this.props.dnatcofication.customNtCs.events.changed,
            () => this.forceUpdate()
        );

        this.subscribe(this.props.switching.events.modelSwitched, (sel) =>  this.setTableModel(sel));
        this.subscribe(this.props.switching.events.chainSwitched, (sel) =>  this.setTableModel(sel));

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
                                    onChange={this.props.switching.switchModel}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchChain}
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
                <div style={ Common.VScrollElement }>
                    <div className='rdo-scroll-vertically'>
                        {this.renderStepsTable()}
                    </div>
                </div>
            </div>
        );
    }
}

export namespace ChangeNtCs {
    export const StepSwitcher = Refinement.switchStep;
}
