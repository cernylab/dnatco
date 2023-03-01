import React from 'react';
import { Annotation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidChain, InvalidModelIndex, InvalidStepId } from '../../structure-selection';
import { niceStepName, Common } from '../../common';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { doDownload, FileTypes } from '../../../../util/downloader';
import { Serialization } from '../../../../util/serialization';
import 'assets/imgs/info.svg';
import 'assets/imgs/info-inverse.svg';

export class AssignedNtCs extends View<View.Props> {
    static readonly unscrollableContainer = true;
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, label_asym_id_1, name } = steps;
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
                scrollTainer={this.props.scrollableParent}
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

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);

        return (
            <div style={ Common.VScrollJail }>
                <div className='rdo-view-caption'>Assigned NtCs</div>

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

                <div style={ Common.VScrollElement }>
                    <div className='rdo-scroll-vertically'>
                        {this.renderStepsTable()}
                    </div>
                </div>
            </div>
        );
    }
}

export namespace AssignedNtCs {
    export const StepSwitcher = Annotation.switchStep;
}
