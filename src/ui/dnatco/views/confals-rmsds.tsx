import * as React from 'react';
import { View } from './view';
import { ViewerApi } from '../../../viewer/viewer-interop';
import { makeStepSelection, rmsdToSemaphore } from '../util';
import { ComboBox } from '../../common/combo-box';
import { DynamicTable } from '../../common/dynamic-table';
import { NamedList } from '../../common/named-list';
import { Cif } from '../../../cif';
import { NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { sequence } from '../../../util';

function rmsdToColor(rmsd: number): React.CSSProperties  {
    const clr = rmsdToSemaphore(rmsd);
    return { backgroundColor: `rgb(${clr.r},${clr.g},${clr.b})` };
}

interface State {
    modelIndex: string;
    selectedStepName?: string;
}
export class ConfalsRmsds extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            modelIndex: '',
        };
    }

    renderAnalyzedSteps() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        return (
            <div>Classified: {Cif.Column.value(overall.num_classified, 0)}, Unclassified: {Cif.Column.value(overall.num_unclassified, 0)}</div>
        );
    }

    renderStepsTable() {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, name } = steps;
        const { assigned_NtC, assigned_CANA, confal_score, cartesian_rmsd_closest_NtC_representative } = summary;

        const stepColumn: DynamicTable.Column<string> = { name: 'Step', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center', };
        const ntcColumn: DynamicTable.Column<string> = { name: 'NtC', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const canaColumn: DynamicTable.Column<string> = { name: 'CANA', values: new Array<DynamicTable.CellValue<string>>(), alignment: 'center' };
        const confalColumn: DynamicTable.Column<number> = { name: 'Confal', values: new Array<DynamicTable.CellValue<number>>(), alignment: 'center' };
        const rmsdColumn: DynamicTable.Column<number> = { name: 'RMSD', values: new Array<DynamicTable.CellValue<number>>(), alignment: 'center', cellStyle: rmsdToColor };

        const onlyModelNum = this.state.modelIndex === '' ? undefined : parseInt(this.state.modelIndex);

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row);
            const tag = Cif.Column.value(name, row)!;
            if (onlyModelNum === undefined || (onlyModelNum && onlyModelNum === modelNum)) {
                stepColumn.values.push({ data: Cif.Column.value(name, row)!, tag });
                ntcColumn.values.push({ data: Cif.Column.value(assigned_NtC, row)!, tag });
                canaColumn.values.push({ data: Cif.Column.value(assigned_CANA, row)!, tag });
                confalColumn.values.push({ data: Cif.Column.value(confal_score, row)!, tag });
                rmsdColumn.values.push({ data: Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!, tag });
            }
        }

        return (
            <DynamicTable
                columns={[stepColumn, ntcColumn, canaColumn, confalColumn, rmsdColumn]}
                onCellClicked={(row, col, item) => {
                    if (col === 'Step') {
                        const selection = makeStepSelection(this.props.dnatcofication, item);
                        if (selection)
                            this.props.viewerInterop.api.command(ViewerApi.Commands.SelectStep(selection.current, selection.prev, selection.next));
                    }
                }}
                highlightedTag={this.state.selectedStepName}
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
                                    this.props.viewerInterop.api!.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
                                    this.setState({ ...this.state, modelIndex: v })
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
