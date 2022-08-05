import * as React from 'react';
import { View } from './view';
import { makeStepSelection } from '../util';
import { ViewerApi } from '../../../viewer/viewer-interop';
import { ComboBox } from '../../common/combo-box';
import { DynamicTable } from '../../common/dynamic-table';
import { NamedList } from '../../common/named-list';
import { Cif } from '../../../cif';
import { NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { sequence } from '../../../util';

interface State {
    modelIndex: string;
    selectedStepName?: string;
}
export class AssignedNtCs extends View<View.Props, State> {
    private stepsTable: DynamicTable.Column<any>[] = [];

    constructor(props: View.Props) {
        super(props);

        this.state = {
            modelIndex: '',
        };
    }

    makeStepsTable() {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, label_asym_id_1, name } = steps;
        const { assigned_NtC, assigned_CANA } = summary;

        const modelColumn: DynamicTable.Column<number> = { name: 'Model', values: new Array<DynamicTable.CellValue<number>>(), alignment: 'center' };
        const chainColumn: DynamicTable.Column<string> = { name: 'Chain', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const stepColumn: DynamicTable.Column<string> = { name: 'Step', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center', };
        const ntcColumn: DynamicTable.Column<string> = { name: 'NtC', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const canaColumn: DynamicTable.Column<string> = { name: 'CANA', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };

        const onlyModelNum = this.state.modelIndex === '' ? undefined : parseInt(this.state.modelIndex);

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            const tag = Cif.Column.value(name, row)!;
            if (onlyModelNum === undefined || (onlyModelNum && onlyModelNum === modelNum)) {
                modelColumn.values.push({ data: modelNum, tag });
                chainColumn.values.push({ data: Cif.Column.value(label_asym_id_1, row)!, tag });
                stepColumn.values.push({ data: tag, tag });
                ntcColumn.values.push({ data: Cif.Column.value(assigned_NtC, row)!, tag });
                canaColumn.values.push({ data: Cif.Column.value(assigned_CANA, row)!, tag });
            }
        }

        return [modelColumn, chainColumn, stepColumn, ntcColumn, canaColumn];
    }

    renderAnalyzedSteps() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        return (
            <div>Classified: {Cif.Column.value(overall.num_classified, 0)}, Unclassified: {Cif.Column.value(overall.num_unclassified, 0)}</div>
        );
    }

    renderNucleicAcidChains() {
        if (this.state.modelIndex === '') {
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
            const index = parseInt(this.state.modelIndex);
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
        if (this.stepsTable.length === 0)
            this.stepsTable = this.makeStepsTable();

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
                                value={this.state.modelIndex}
                                onChange={v => {
                                    this.props.viewerInterop.api.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
                                    this.setState({ ...this.state, modelIndex: v });
                                }}
                            />
                        }
                    ]}
                />
                <div className='rdo-line-spacer' />
                {this.renderStepsTable()}
            </div>
        );
    }
}
