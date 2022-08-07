import * as React from 'react';
import { DynamicTable } from './common/dynamic-table';
import { ShadowedBox } from './common/shadowed-box';
import { Search } from '../search/search';
import { SearchConformers } from './search-conformers';

export class BrowseConformersTab extends React.Component<BrowseConformersTab.Props> {
    private renderStepsTable() {
        const names: DynamicTable.Column<string> = { name: 'Name', values: new Array<DynamicTable.CellValue<string>>() };
        const CANAs: DynamicTable.Column<string> = { name: 'CANA', values: new Array<DynamicTable.CellValue<string>>() };
        const NtCs: DynamicTable.Column<string> = { name: 'NtC', values: new Array<DynamicTable.CellValue<string>>() };
        const confals: DynamicTable.Column<number> = { name: 'Confal', values: new Array<DynamicTable.CellValue<number>>() };
        const rmsds: DynamicTable.Column<number> = { name: 'RMSD', values: new Array<DynamicTable.CellValue<number>>() };
        const resolutions: DynamicTable.Column<number> = { name: 'Resolution [Å]', values: new Array<DynamicTable.CellValue<number>>() };
        const haveMaps: DynamicTable.Column<string> = { name: 'Map', values: new Array<DynamicTable.CellValue<string>>() };

        for (const step of this.props.steps) {
            names.values.push({ data: step.name });
            CANAs.values.push({ data: step.CANA });
            NtCs.values.push({ data: step.NtC });
            confals.values.push({ data: step.confal });
            rmsds.values.push({ data: step.rmsd });
            resolutions.values.push({ data: step.resolution });
            haveMaps.values.push({ data: 'N' });
        }

        return (
            <DynamicTable
                onCellClicked={(row, column, value) => this.props.onStepSelected(value)}
                columns={[names, CANAs, NtCs, confals, rmsds, resolutions, haveMaps]}
                style='wide'
            />
        );
    }

    render() {
        return (
            <div className='rdo-offset'>
                <ShadowedBox>
                    <div className='rdo-width-limiter'>
                        <div style={{ display: 'grid', height: '100%', gridTemplateRows: 'auto auto 1fr', gridTemplateColumns: 'auto', rowGap: 'var(--x-gap)', columnGap: 'var(--x-gap)' }}>
                            <div className='rdo-primary-caption'>{`List of ${this.props.steps.length} randomly selected steps with NtC class ${this.props.criteria.NtC}`}</div>
                            <SearchConformers onDoSearch={this.props.onSearch} initial={this.props.criteria} />
                            <div style={{ overflow: 'hidden' }}>
                                <div className='rdo-scroll-vertically'>
                                    {this.renderStepsTable()}
                                </div>
                            </div>
                        </div>
                    </div>
                </ShadowedBox>
            </div>
        );
    }
}

export namespace BrowseConformersTab {
    export interface Props {
        criteria: Search.Criteria;
        onSearch: (criteria: Search.Criteria) => void;
        onStepSelected: (name: string) => void;
        steps: Search.FoundStep[];
    }
}
