import * as React from 'react';
import { GlobalConfig } from '../../global-config';
import '../../../assets/imgs/sort.svg';
import '../../../assets/imgs/sorted-ascending.svg';
import '../../../assets/imgs/sorted-descending.svg';

interface State {
    sortBy: number;
    sortOrder: 'asc' | 'desc';
}

interface Comparator<T> {
    (a: T, b: T): number;
}

function getCellStyle<T>(v: T, getter?: (v: T) => React.CSSProperties) {
    return getter ? getter(v) : {};
}

export class DynamicTable extends React.Component<DynamicTable.Props, State> {
    constructor(props: DynamicTable.Props) {
        super(props);

        this.state = {
            sortBy: -1,
            sortOrder: 'desc',
        };
    }

    private changeSort(columnIdx: number) {
        if (this.state.sortBy === columnIdx) {
            const sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
            this.setState({ ...this.state, sortOrder });
        } else
            this.setState({ ...this.state, sortBy: columnIdx, sortOrder: 'asc' });
    }

    private getRows() {
        const rows = new Array<(string|number)[]>();

        for (let idx = 0; idx < this.props.columns[0].values.length; idx++) {
            const row = new Array<string|number>();
            for (const col of this.props.columns)
                row.push(col.values[idx]);
            rows.push(row);
        }

        if (this.state.sortBy === -1)
            return rows;
        else {
            const sortIdx = this.state.sortBy;
            const order = this.state.sortOrder;
            const mainColumn = this.props.columns[sortIdx];
            const comparator = mainColumn.comparator
                ?
                mainColumn.comparator
                :
                typeof mainColumn.values[0] === 'number'
                    ?
                    (a: number, b: number) => a - b
                    :
                    (a: string, b: string) => a.localeCompare(b);

            rows.sort((a, b) => {
                const eA = a[sortIdx];
                const eB = b[sortIdx];
                const invert = order === 'asc' ? 1 : -1;
                return invert * (comparator as Comparator<typeof eA>)(eA, eB);
            });

            return rows;
        }
    }

    private renderBody() {
        const rows = this.getRows();
        const rowElems = new Array<JSX.Element>();

        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            rowElems.push(
                <tr key={idx}>
                    {
                        row.map((item, jdx) =>
                            <td
                                className='rdo-data-table'
                                key={jdx}
                                style={{
                                    ...getCellStyle(item, this.props.columns[jdx].cellStyle),
                                    textAlign: this.props.columns[jdx].alignment ?? 'left',
                                }}
                                onClick={() => {
                                    if (this.props.onCellClicked)
                                        this.props.onCellClicked(idx, this.props.columns[jdx].name, item.toString());
                                }}
                            >
                                {item}
                            </td>
                        )
                    }
                </tr>
            );
        }

        return rowElems;
    }

    private renderHeader() {
        const prefix = GlobalConfig.get('pathPrefix');
        const headers = new Array<JSX.Element>();

        for (let idx = 0; idx < this.props.columns.length; idx++) {
            const col = this.props.columns[idx];

            const imgSrc = this.state.sortBy === idx
                ?
                this.state.sortOrder === 'asc' ? `${prefix}imgs/sorted-ascending.svg` : `${prefix}imgs/sorted-descending.svg`
                :
                `${prefix}imgs/sort.svg`;

            headers.push(
                <th
                    className='rdo-data-table'
                    key={idx}
                >
                    {col.name}
                    {'\u00A0'}
                    <img
                        className='column-sort-button'
                        src={imgSrc}
                        onClick={() => this.changeSort(idx)}
                    />
                </th>
            );
        }

        return headers;
    }

    componentDidUpdate(prevProps: DynamicTable.Props) {
        if (this.props.columns !== prevProps.columns)
            this.setState({ ...this.state, sortBy: -1, sortOrder: 'asc' });
    }

    render() {
        if (this.props.columns.length === 0)
            return <div></div>;

        return (
            <table className='rdo-data-table'>
                <thead>
                    <tr>{this.renderHeader()}</tr>
                </thead>
                <tbody>
                    {this.renderBody()}
                </tbody>
            </table>
        );
    }
}

export namespace DynamicTable {
    export type Column<T extends string|number> = {
        name: string;
        values: T[];
        alignment?: 'left'|'center'|'right';
        comparator?: (a: T, b: T) => number;
        cellStyle?: (v: T) => React.CSSProperties;
    }

    export interface Props {
        columns: Column<any>[];
        onCellClicked?: (row: number, column: string, value: string) => void;
    }
}
