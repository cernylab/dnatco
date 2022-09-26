import * as React from 'react';
import { View } from '../view';
import { SingleStepInfo } from '../../single-step-info';
import { listOfChains, makeStepSelection } from '../../util';
import { ViewerApi } from '../../../../viewer/viewer-interop';
import { ComboBox } from '../../../common/combo-box';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import {
    NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary,
    NdbStructNtcStepParameters
} from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { sequence } from '../../../../util';

interface State {
    model: string;
    chain: string;
    selectedStepName?: string;
}
export class AssignedNtCs extends View<View.Props, State> {
    private stepsTable: DynamicTable.Column<any>[] = [];

    constructor(props: View.Props) {
        super(props);

        this.state = {
            model: '',
            chain: '',
        };
    }

    makeStepsTable(selectedModelNum: number|undefined, selectedChain: string|undefined) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const params = this.props.dnatcofication.table(NdbStructNtcStepParameters);

        const { PDB_model_number, label_asym_id_1, name } = steps;
        const { assigned_NtC, assigned_CANA } = summary;
        const {
            tor_delta_1, tor_epsilon_1, tor_zeta_1,
            tor_alpha_2, tor_beta_2, tor_gamma_2,
            tor_delta_2, tor_chi_1, tor_chi_2,
            tor_NCCN, dist_CC, dist_NN
        } = params;

        const chainColumn: DynamicTable.Column<string> = { name: 'Chain', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const stepColumn: DynamicTable.Column<string> = { name: 'Step', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center', };
        const ntcColumn: DynamicTable.Column<string> = { name: 'NtC', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const canaColumn: DynamicTable.Column<string> = { name: 'CANA', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const torsionsColumn: DynamicTable.Column<string> = { name: '?', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center', notSortable: true };

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            if (selectedModelNum !== undefined && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain !== undefined && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const NtC = Cif.Column.value(assigned_NtC, row)!;

            chainColumn.values.push({ data: chain, tag });
            stepColumn.values.push({ data: tag, tag });
            ntcColumn.values.push({
                data: Cif.Column.value(assigned_NtC, row)!,
                tag
            });
            canaColumn.values.push({
                data: Cif.Column.value(assigned_CANA, row)!,
                tag
            });
            torsionsColumn.values.push({
                data: '',
                tag,
                tooltip:
                    <Tooltip tag='[?]'>
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

        return [chainColumn, stepColumn, ntcColumn, canaColumn, torsionsColumn];
    }

    renderAnalyzedSteps() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        return (
            <div>Classified: {Cif.Column.value(overall.num_classified, 0)}, Unclassified: {Cif.Column.value(overall.num_unclassified, 0)}</div>
        );
    }

    renderNucleicAcidChains() {
        if (this.state.model === '') {
            const list: JSX.Element[] = [];
            for (const index of sequence(1, Dnatcofication.Structure.numberOfModels(this.props.dnatcofication))) {
                const chains = Dnatcofication.Structure.nucleicAcidChains(this.props.dnatcofication, index);

                list.push(
                    <div key={index}>
                        {chains.length}
                        <div>({chains.join(', ')})</div>
                    </div>
                );
            }

            return list;
        } else {
            const index = parseInt(this.state.model);
            const chains = Dnatcofication.Structure.nucleicAcidChains(this.props.dnatcofication, index);

            return (
                <div>
                    {chains.length}
                    <div>({chains.join(', ')})</div>
                </div>
            );
        }
    }

    renderStepsTable() {
        if (this.stepsTable.length === 0) {
            // Make sure we have steps to draw
            const modelNum = this.state.model === '' ? undefined : parseInt(this.state.model);
            const chain = this.state.chain === '' ? undefined : this.state.chain;
            this.stepsTable = this.makeStepsTable(modelNum, chain);
        }

        return (
            <DynamicTable
                columns={this.stepsTable}
                onCellClicked={(row, col, item) => {
                    if (col === 'Step') {
                        const selection = makeStepSelection(this.props.dnatcofication, item);
                        if (selection)
                            this.props.viewerInterop.api.command(ViewerApi.Commands.SelectStep(selection.current, selection.prev, selection.next));
                    }
                }}
                highlightedTag={this.state.selectedStepName}
                scrollTainerId='rdo-main-screen-data-container'
            />
        );
    }

    componentDidMount() {
        this.subscribe(
            this.props.viewerInterop.events.stepDeselected,
            () => this.setState({ ...this.state, selectedStepName: undefined })
        );
        this.subscribe(
            this.props.viewerInterop.events.stepSelected,
            (sel) => {
                this.setState({ ...this.state, selectedStepName: sel.name});
            }
        );
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.stepsTable.length === 0);

        if (this.props.viewerInterop.ready()) {
            const step = this.props.viewerInterop.api.query('selected-step');
            if (step.name !== '')
                this.setState({ ...this.state, selectedStepName: step.name });
        }
    }

    componentDidUpdate(prevProps: View.Props, prevState: State) {
        const modelChanged = prevState.model !== this.state.model;
        const chainChanged = prevState.chain !== this.state.chain;
        if (modelChanged || chainChanged) {
            const modelNum = this.state.model === '' ? undefined : parseInt(this.state.model);
            const chain = this.state.chain === '' ? undefined : this.state.chain;
            this.stepsTable = this.makeStepsTable(modelNum, chain);

            if (modelChanged) {
                const n = parseInt(this.state.model);
                if (!isNaN(n))
                    this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(n));
            } else {
                if (this.state.chain !== '') {
                    this.props.viewerInterop.api.command(ViewerApi.Commands.DeselectStep());
                    // FIXME: We are not getting the "stepDeselected" event now.
                    this.setState({ ...this.state, selectedStepName: undefined });
                }
            }

            this.forceUpdate();
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div>
                <NamedList
                    items={[
                        { name: 'Models', value: Dnatcofication.Structure.numberOfModels(this.props.dnatcofication).toString() },
                        { name: 'NA chains', value: this.renderNucleicAcidChains() },
                        {
                            name: 'Analyzed steps',
                            value: this.renderAnalyzedSteps(),
                        },
                        {
                            name: 'Model',
                            value:
                                <ComboBox
                                    options={[
                                        { value: '', caption: 'All' },
                                        ...sequence(1, Dnatcofication.Structure.numberOfModels(this.props.dnatcofication)).map(v => {
                                        const s = v.toString();
                                        return { value: s, caption: s };
                                    })
                                ]}
                                value={this.state.model}
                                onChange={v => {
                                    if (v === this.state.model)
                                        return;
                                    this.setState({ ...this.state, model: v, chain: '' });
                                }}
                            />
                        },
                        {
                            name: 'Chain',
                            value:
                                <ComboBox
                                    options={[
                                        { value: '', caption: 'All' },
                                        ...listOfChains(this.state.model === '' ? undefined : parseInt(this.state.model), this.props.dnatcofication.data.structures[0]),
                                    ]}
                                    value={this.state.chain}
                                    onChange={v => {
                                        if (v === this.state.chain)
                                            return;
                                        this.setState({ ...this.state, chain: v });
                                    }}
                                />
                        },
                    ]}
                />
                <div className='rdo-line-spacer' />
                {this.renderStepsTable()}
            </div>
        );
    }
}
