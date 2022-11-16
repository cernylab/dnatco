import  React from 'react';
import { Validation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { InvalidChain, InvalidModelIndex, InvalidStepId } from '../../structure-selection';
import { View } from '../view';
import { DynamicTableDownloadBar } from '../../common';
import { SingleStepInfo } from '../../single-step-info';
import { Constants } from '../../constants';
import { valueToSemaphore } from '../../util';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import {
    NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary,
    NdbStructNtcStepParameters
} from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';

function confalToColor(rmsd: number): React.CSSProperties  {
    const clr = valueToSemaphore(rmsd, Constants.GreenConfal, Constants.GreenRMSD);
    return { backgroundColor: `rgb(${clr.r},${clr.g},${clr.b})` };
}

function rmsdToColor(rmsd: number): React.CSSProperties  {
    const clr = valueToSemaphore(rmsd, Constants.GreenRMSD, Constants.RedRMSD);
    return { backgroundColor: `rgb(${clr.r},${clr.g},${clr.b})` };
}

export class ConfalsRmsds extends View<View.Props> {
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const params = this.props.dnatcofication.table(NdbStructNtcStepParameters);

        const { PDB_model_number, label_asym_id_1, name } = steps;
        const {
            assigned_NtC, assigned_CANA, closest_NtC, closest_CANA,
            confal_score, cartesian_rmsd_closest_NtC_representative
        } = summary;
        const {
            tor_delta_1, tor_epsilon_1, tor_zeta_1,
            tor_alpha_2, tor_beta_2, tor_gamma_2,
            tor_delta_2, tor_chi_1, tor_chi_2,
            tor_NCCN, dist_CC, dist_NN
        } = params;

        const stepColumn: DynamicTable.Column<string> = {
            name: 'Step', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center', notSortable: true,
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
        const confalColumn: DynamicTable.Column<number> = {
            name: 'Confal', cells: new Array<DynamicTable.Cell<number>>(), alignment: 'center', cellStyle: confalToColor,
            tooltip: <div>Score of similarity between the analyzed step and the assigned NtC class; values between 0 (no match) to 100 (perfect match)</div>,
        };
        const rmsdColumn: DynamicTable.Column<number> = {
            name: 'RMSD', cells: new Array<DynamicTable.Cell<number>>(), alignment: 'center', cellStyle: rmsdToColor,
            tooltip: <div>RMSD between the analyzed step and the closest NtC representative.</div>
        };
        const torsionsColumn: DynamicTable.Column<string> = {
            name: '?', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center', notSortable: true, noData: true,
            tooltip: <div>Hover over the <span className='rdo-emphasize'>[?]</span> to get details about torsions and distances.</div>,
        };

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row);
            if (selectedModelNum !== -1 && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain !== undefined && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const NtC = Cif.Column.value(assigned_NtC, row)!;

            stepColumn.cells.push({ data: Cif.Column.value(name, row)!, tag });
            ntcColumn.cells.push({
                data :Cif.Column.value(assigned_NtC, row)!,
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
                tag,
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
                tag,
            });
            confalColumn.cells.push({ data: Cif.Column.value(confal_score, row)!, tag });
            rmsdColumn.cells.push({
                data: Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!,
                elem: <span>{Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!.toFixed(3)}</span>,
                tag
            });
            torsionsColumn.cells.push({
                data: '',
                tag,
                tooltip:
                    <Tooltip
                        tag='[?]'
                        delayMsec={300}
                    >
                        <SingleStepInfo
                            NtC={NtC}
                            delta1={Cif.Column.value(tor_delta_1, row)!}
                            epsilon1={Cif.Column.value(tor_epsilon_1, row)!}
                            zeta1={Cif.Column.value(tor_zeta_1, row)!}
                            alpha2={Cif.Column.value(tor_alpha_2, row)!}
                            beta2={Cif.Column.value(tor_beta_2, row)!}
                            gamma2={Cif.Column.value(tor_gamma_2, row)!}
                            delta2={Cif.Column.value(tor_delta_2, row)!}
                            chi1={Cif.Column.value(tor_chi_1, row)!}
                            chi2={Cif.Column.value(tor_chi_2, row)!}
                            mu={Cif.Column.value(tor_NCCN, row)!}
                            CC={Cif.Column.value(dist_CC, row)!}
                            NN={Cif.Column.value(dist_NN, row)!}
                        />
                    </Tooltip>,
            });
        }

        return new DynamicTable.Model([stepColumn, ntcColumn, canaColumn, confalColumn, rmsdColumn, torsionsColumn]);
    }

    renderAnalyzedSteps() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        return (
            <div>Classified: {Cif.Column.value(overall.num_classified, 0)}, Unclassified: {Cif.Column.value(overall.num_unclassified, 0)}</div>
        );
    }

    renderStepsTable() {
        const modelNum = this.props.structureSelection.modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[this.props.structureSelection.modelIndex].num
            : -1;
        this.tableModel = this.makeTableModel(modelNum, this.props.structureSelection.chain === InvalidChain ? void 0 : this.props.structureSelection.chain);
        const stepName = this.props.structureSelection.stepId === InvalidStepId ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.stepId).name;

        return (
            <div>
                <DynamicTableDownloadBar
                    filenameCsv={`${this.props.dnatcofication.identifyingName}_confals_rmsds.csv`}
                    filenameJson={`${this.props.dnatcofication.identifyingName}_confals_rmsds.json`}
                    model={this.tableModel}
                />

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
                />
            </div>
        );
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div>
                <NamedList>
                    <NamedListItem name='Models'>
                        {Dnatcofication.Structure.numberOfModels(this.props.dnatcofication)}
                    </NamedListItem>
                    <NamedListItem name='Analyzed steps'>
                        {this.renderAnalyzedSteps()}
                    </NamedListItem>
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
                {this.renderStepsTable()}
            </div>
        );
    }
}

export namespace ConfalsRmsds {
    export const StepSwitcher = Validation.switchStep;
}
