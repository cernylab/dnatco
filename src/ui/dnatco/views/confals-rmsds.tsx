import * as React from 'react';
import { View } from './view';
import { ViewerApi } from '../viewer-api';
import { rmsdToSemaphore } from '../util';
import { ComboBox } from '../../common/combo-box';
import { DynamicTable } from '../../common/dynamic-table';
import { NamedList } from '../../common/named-list';
import { NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { sequence } from '../../../util';

function rmsdToColor(rmsd: number): React.CSSProperties  {
    const clr = rmsdToSemaphore(rmsd);
    return { backgroundColor: `rgb(${clr.r},${clr.g},${clr.b})` };
}

interface State {
    modelIndex: string;
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
            <div>Classified: {overall.num_classified.value(0)}, Unclassified: {overall.num_unclassified.value(0)}</div>
        );
    }

    renderStepsTable() {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);

        const { PDB_model_number, name } = steps;
        const { assigned_NtC, assigned_CANA, confal_score, cartesian_rmsd_closest_NtC_representative } = summary;

        const stepColumn: DynamicTable.Column<string> = { name: 'Step', values: new Array<string>(), alignment: 'center', };
        const ntcColumn: DynamicTable.Column<string> = { name: 'NtC', values: new Array<string>(), alignment: 'center' };
        const canaColumn: DynamicTable.Column<string> = { name: 'CANA', values: new Array<string>(), alignment: 'center' };
        const confalColumn: DynamicTable.Column<number> = { name: 'Confal', values: new Array<number>(), alignment: 'center' };
        const rmsdColumn: DynamicTable.Column<number> = { name: 'RMSD', values: new Array<number>(), alignment: 'center', cellStyle: rmsdToColor };

        const onlyModelNum = this.state.modelIndex === '' ? undefined : parseInt(this.state.modelIndex);

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = PDB_model_number.value(row);
            if (onlyModelNum === undefined || (onlyModelNum && onlyModelNum === modelNum)) {
                stepColumn.values.push(name.value(row)!);
                ntcColumn.values.push(assigned_NtC.value(row)!);
                canaColumn.values.push(assigned_CANA.value(row)!);
                confalColumn.values.push(confal_score.value(row)!);
                rmsdColumn.values.push(cartesian_rmsd_closest_NtC_representative.value(row)!);
            }
        }

        return (
            <DynamicTable
                columns={[stepColumn, ntcColumn, canaColumn, confalColumn, rmsdColumn]}
                onCellClicked={(row, col, item) => {
                    if (col === 'Step')
                        this.props.viewerApi.command(ViewerApi.Commands.SelectStep(item));
                }}
            />
        );
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
                                    this.props.viewerApi.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
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
