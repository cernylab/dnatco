import * as React from 'react';
import { deselectText, scrollIntoViewIfNeeded } from '../util';
import { GlobalConfig } from '../../global-config';
import '../../../assets/imgs/sort.svg';
import '../../../assets/imgs/sorted-ascending.svg';
import '../../../assets/imgs/sorted-descending.svg';

interface Comparator<T> {
    (a: T, b: T): number;
}

function getCellStyle<T>(v: T, getter?: (v: T) => React.CSSProperties) {
    return getter ? getter(v) : {};
}

export class DynamicTable extends React.Component<DynamicTable.Props> {
    private changeSort(columnIdx: number) {
        const { sortedBy, sortOrder } = this.props.model.sortState();

        if (sortedBy === columnIdx)
            this.props.model.setSort(columnIdx, sortOrder === 'asc' ? 'desc' : 'asc');
        else
            this.props.model.setSort(columnIdx, 'asc');

         this.forceUpdate();
    }

    private findFirstTaggedCellId(tag: string) {
        for (let colIdx = 0; colIdx < this.props.model.columns.length; colIdx++) {
            const col = this.props.model.columns[colIdx];
            for (let rowIdx = 0; rowIdx < col.values.length; rowIdx++) {
                const cell = col.values[rowIdx];
                if (cell.tag && cell.tag.startsWith(tag))
                    return `${cell.tag}-${rowIdx}-${colIdx}`;
            }
        }

        return undefined;
    }

    private renderBody() {
        const rows = this.props.model.rows;
        const rowElems = new Array<JSX.Element>();

        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx];
            rowElems.push(
                <tr key={rowIdx}>
                    {
                        row.map((item, colIdx) => {
                            const col = this.props.model.columns[colIdx];
                            return (
                                <td
                                    className={`rdo-data-table ${(this.props.highlightedTag && this.props.highlightedTag === item.tag) ? 'rdo-data-table-selected' : ''}`}
                                    key={colIdx}
                                    id={item.tag ? `${item.tag}-${rowIdx}-${colIdx}` : undefined}
                                    style={{
                                        ...getCellStyle(item.data, col.cellStyle),
                                        textAlign: this.props.model.columns[colIdx].alignment ?? 'left',
                                    }}
                                    onClick={() => {
                                        if (this.props.onCellClicked)
                                            this.props.onCellClicked(rowIdx, col.name, item.data.toString());
                                    }}
                                >
                                    {item.tooltip
                                        ? item.tooltip
                                        : col.contentFormatter !== undefined
                                            ? col.contentFormatter(item.data)
                                            : item.data
                                    }
                                </td>
                            )
                        })
                    }
                </tr>
            );
        }

        return rowElems;
    }

    private renderHeader() {
        const prefix = GlobalConfig.data().pathPrefix;
        const headers = new Array<JSX.Element>();
        const { sortedBy, sortOrder } = this.props.model.sortState();

        for (let idx = 0; idx < this.props.model.columns.length; idx++) {
            const col = this.props.model.columns[idx];

            const imgSrc = sortedBy === idx
                ? sortOrder === 'asc' ? `${prefix}imgs/sorted-ascending.svg` : `${prefix}imgs/sorted-descending.svg`
                : `${prefix}imgs/sort.svg`;

            headers.push(
                <th
                    className='rdo-data-table'
                    key={idx}
                    onDoubleClick={() => {
                        deselectText();
                        if (!col.notSortable) {
                            this.props.model.resetSort();
                            this.forceUpdate();
                        }
                    }}
                >
                    {col.name}
                    {'\u00A0'}
                    {col.notSortable
                        ? undefined
                        : <img
                            className='column-sort-button'
                            src={imgSrc}
                            onClick={() => this.changeSort(idx)}
                        />
                    }
                </th>
            );
        }

        return headers;
    }

    componentDidUpdate(prevProps: DynamicTable.Props) {
        if (this.props.scrollTainerId && this.props.highlightedTag && this.props.highlightedTag !== prevProps.highlightedTag) {
            const cellId = this.findFirstTaggedCellId(this.props.highlightedTag);
            if (cellId && parent)
                scrollIntoViewIfNeeded(cellId, this.props.scrollTainerId);
        }
    }

    render() {
        if (this.props.model.columns.length === 0)
            return <div></div>;

        return (
            <table className={`rdo-data-table ${this.props.style === 'wide' ? 'rdo-data-table-wide' : ''}`}>
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
    export type CellValue<T extends string|number> = { data: T, tag?: string, tooltip?: React.ReactNode };
    export type Column<T extends string|number> = {
        name: string;
        values: CellValue<T>[];
        alignment?: 'left'|'center'|'right';
        comparator?: (a: T, b: T) => number;
        cellStyle?: (v: T) => React.CSSProperties;
        contentFormatter?: (v: T) => string;
        notSortable?: boolean;
    }
    export type Style = 'normal' | 'wide';

    export type SortOrder = 'asc' | 'desc';
    export class Model {
        sortedBy = -1;
        sortOrder: SortOrder = 'asc';

        constructor(readonly columns: Column<any>[] = []) {
        }

        get rows() {
            const rows = new Array<DynamicTable.CellValue<any>[]>();

            for (let idx = 0; idx < this.columns[0].values.length; idx++) {
                const row = new Array<DynamicTable.CellValue<any>>();
                for (const col of this.columns)
                    row.push(col.values[idx]);
                rows.push(row);
            }

            if (this.sortedBy === -1)
                return rows;
            else {
                const sortIdx = this.sortedBy;
                const order = this.sortOrder;
                const mainColumn = this.columns[sortIdx];
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

        resetSort() {
            this.sortedBy = -1;
        }

        setSort(column: number, order: SortOrder) {
            this.sortedBy = column;
            this.sortOrder = order;
        }

        sortState() {
            return { sortedBy: this.sortedBy, sortOrder: this.sortOrder };
        }
    }

    export interface Props {
        model: Model;
        onCellClicked?: (row: number, column: string, value: string) => void;
        highlightedTag?: string;
        scrollTainerId?: string; // This needs to be se to a reasonable element to make autoscrolling work reliably
        style?: Style;
    }
}
