import * as React from 'react';
import { deselectText, scrollIntoViewIfNeeded } from '../util';
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

    private findFirstTaggedCellId(tag: string) {
        for (let colIdx = 0; colIdx < this.props.columns.length; colIdx++) {
            const col = this.props.columns[colIdx];
            for (let rowIdx = 0; rowIdx < col.values.length; rowIdx++) {
                const cell = col.values[rowIdx];
                if (cell.tag && cell.tag.startsWith(tag))
                    return `${cell.tag}-${rowIdx}-${colIdx}`;
            }
        }

        return undefined;
    }

    private getRows() {
        const rows = new Array<DynamicTable.CellValue<any>[]>();

        for (let idx = 0; idx < this.props.columns[0].values.length; idx++) {
            const row = new Array<DynamicTable.CellValue<any>>();
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
                typeof mainColumn.values[0].data === 'number'
                    ?
                    (a: number, b: number) => a - b
                    :
                    (a: string, b: string) => a.localeCompare(b);

            rows.sort((a, b) => {
                const eA = a[sortIdx].data;
                const eB = b[sortIdx].data;
                const invert = order === 'asc' ? 1 : -1;
                return invert * (comparator as Comparator<typeof eA>)(eA, eB);
            });

            return rows;
        }
    }

    private renderBody() {
        const rows = this.getRows();
        const rowElems = new Array<JSX.Element>();

        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx];
            rowElems.push(
                <tr key={rowIdx}>
                    {
                        row.map((item, colIdx) =>
                            <td
                                className={`rdo-data-table ${(this.props.highlightedTag && this.props.highlightedTag === item.tag) ? 'rdo-data-table-selected' : ''}`}
                                key={colIdx}
                                id={item.tag ? `${item.tag}-${rowIdx}-${colIdx}` : undefined}
                                style={{
                                    ...getCellStyle(item.data, this.props.columns[colIdx].cellStyle),
                                    textAlign: this.props.columns[colIdx].alignment ?? 'left',
                                }}
                                onClick={() => {
                                    if (this.props.onCellClicked)
                                        this.props.onCellClicked(rowIdx, this.props.columns[colIdx].name, item.data.toString());
                                }}
                            >
                                {item.data}
                            </td>
                        )
                    }
                </tr>
            );
        }

        return rowElems;
    }

    private renderHeader() {
        const prefix = GlobalConfig.data().pathPrefix;
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
                    onDoubleClick={() => {
                        this.setState({ ...this.state, sortBy: -1, sortOrder: 'asc' });
                        deselectText();
                    }}
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

        if (this.props.scrollTainerId && this.props.highlightedTag && this.props.highlightedTag !== prevProps.highlightedTag) {
            const cellId = this.findFirstTaggedCellId(this.props.highlightedTag);
            if (cellId && parent)
                scrollIntoViewIfNeeded(cellId, this.props.scrollTainerId);
        }
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
    export type CellValue<T extends string|number> = { data: T, tag?: string };
    export type Column<T extends string|number> = {
        name: string;
        values: CellValue<T>[];
        alignment?: 'left'|'center'|'right';
        comparator?: (a: T, b: T) => number;
        cellStyle?: (v: T) => React.CSSProperties;
    }

    export interface Props {
        columns: Column<any>[];
        onCellClicked?: (row: number, column: string, value: string) => void;
        highlightedTag?: string;
        scrollTainerId?: string; // This needs to be se to a reasonable element to make autoscrolling work reliably
    }
}
