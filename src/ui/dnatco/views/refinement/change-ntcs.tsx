import React from 'react';
import { Refinement } from './common';
import { CustomNtCSets } from './custom-ntc-sets';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidChain, InvalidModelIndex, InvalidStepId } from '../../structure-selection';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { IconButton } from '../../../common/push-button';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { StepsMapper } from '../../../../dnatco/steps-mapper';

interface State {
}
export class ChangeNtCs extends View<Refinement.Props, State> {
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);

    constructor(props: Refinement.Props) {
        super(props);

        this.state = {
        };
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
        const computedNtcColumn: DynamicTable.Column<string> = {
            name: 'Computed NtC', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };
        const selectedNtcColumn: DynamicTable.Column<string> = {
            name: 'Selected NtC', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            notSortable: true,
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };

        const makeSelCell = this.props.selectedCustomNtCSet === ''
            ? () => <span>---</span>
            : (row: number) => {
                const step = Cif.Column.value(name, row)!;
                const computedNtC = Cif.Column.value(closest_NtC, row)!;
                const customNtC = this.props.dnatcofication.customNtCs.getCustomNtC(this.props.selectedCustomNtCSet, step);
                return (
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
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
                                    src=''
                                    onClick={() => this.props.dnatcofication.customNtCs.deleteCustomNtC(this.props.selectedCustomNtCSet, step)}
                                />
                            : void 0
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

            chainColumn.cells.push({ data: chain, tag });
            stepColumn.cells.push({ data: tag, tag });
            computedNtcColumn.cells.push({
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

            selectedNtcColumn.cells.push({
                data: '',
                elem: makeSelCell(row),
            });
        }

        return new DynamicTable.Model([chainColumn, stepColumn, computedNtcColumn, selectedNtcColumn]);
    }

    private renderStepsTable() {
        const modelNum = this.props.structureSelection.modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[this.props.structureSelection.modelIndex].num
            : InvalidModelIndex;
        this.tableModel = this.makeTableModel(modelNum, this.props.structureSelection.chain === InvalidChain ? void 0 : this.props.structureSelection.chain);
        const stepName = this.props.structureSelection.stepId === InvalidStepId ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.stepId).name;

        return (
            <DynamicTable
                model={this.tableModel}
                onCellClicked={(row, col, item) => {
                    if (col === 'Step') {
                        const stepId = StepsMapper.byName(this.props.dnatcofication, item)?.id ?? InvalidStepId;
                        if (stepId !== InvalidStepId)
                            this.props.switching.switchStepId(stepId);
                    }
                }}
                highlightedTag={stepName}
                scrollTainerId='rdo-main-screen-data-container'
            />
        );
    }

    componentDidMount() {
        this.subscribe(
            this.props.dnatcofication.customNtCs.events.changed,
            () => this.forceUpdate()
        );
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div>
                <NamedList>
                    <NamedListItem name='Model'>
                        <ModelSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchModel}
                        />
                    </NamedListItem>
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
                {this.renderStepsTable()}
            </div>
        );
    }
}

export namespace ChangeNtCs {
    export const StepSwitcher = Refinement.switchStep;
}
