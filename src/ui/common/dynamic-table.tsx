import * as React from 'react';
import { Icon } from './icon';
import { Tooltip } from './tooltip';
import { scrollIntoViewIfNeeded } from '../util';
import { GlobalConfig } from '../../global-config';
import 'assets/imgs/data-transfer-download.svg';
import 'assets/imgs/sort.svg';
import 'assets/imgs/sorted-ascending.svg';
import 'assets/imgs/sorted-descending.svg';

interface Comparator<T> {
    (a: T, b: T): number;
}

function getCellStyle<T>(v: T, getter?: (v: T) => React.CSSProperties) {
    return getter ? getter(v) : {};
}

export class DynamicTable extends React.Component<DynamicTable.Props> {
    private changeSort(columnIdx: number) {
        const { sortedBy, sortOrder } = this.props.model.sortState();

        if (sortedBy === columnIdx) {
            if (sortOrder === 'asc')
                this.props.model.setSort(columnIdx, 'desc');
            else
                this.props.model.resetSort();
        } else
            this.props.model.setSort(columnIdx, 'asc');

         this.forceUpdate();
    }

    private findFirstTaggedCellId(tag: string) {
        for (let colIdx = 0; colIdx < this.props.model.columns.length; colIdx++) {
            const col = this.props.model.columns[colIdx];
            for (let rowIdx = 0; rowIdx < col.cells.length; rowIdx++) {
                const cell = col.cells[rowIdx];
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
                                        : item.elem
                                            ? item.elem
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

    private renderColumnCaption(col: DynamicTable.Column<any>) {
        if (col.tooltip) {
            return (
                <Tooltip
                    tag={col.elem ? col.elem : col.name}
                    delayMsec={300}
                >
                    {col.tooltip}
                </Tooltip>
            );
        } else {
            return <>{col.elem ? col.elem : col.name}</>;
        }
    }

    private renderDownloadBar() {
        if (!this.props.downloaders || this.props.downloaders.length === 0)
            return void 0;

        const prefix = GlobalConfig.data().pathPrefix;
        const buttons = new Array<JSX.Element>();
        for (const dl of this.props.downloaders) {
            buttons.push(
                <div
                    className='rdo-dynamic-table-download-button'
                    onClick={() => dl.download(this.props.model)}
                >
                    <Icon img={`${prefix}/imgs/data-transfer-download.svg`} size='text' />
                    {dl.caption}
                </div>
            );
        }

        return (
            <div className='rdo-dynamic-table-download-bar'>
                {buttons}
                <div className='rdo-dynamic-table-download-bar-padder' />
            </div>
        );
    }

    private renderHeader() {
        const prefix = GlobalConfig.data().pathPrefix;
        const headers = new Array<JSX.Element>();
        const { sortedBy, sortOrder } = this.props.model.sortState();

        for (let idx = 0; idx < this.props.model.columns.length; idx++) {
            const col = this.props.model.columns[idx];

            const imgSrc = sortedBy === idx
                ? sortOrder === 'asc' ? `${prefix}/imgs/sorted-ascending.svg` : `${prefix}/imgs/sorted-descending.svg`
                : `${prefix}/imgs/sort.svg`;

            headers.push(
                <th
                    className='rdo-data-table'
                    key={idx}
                >
                    {this.renderColumnCaption(col)}
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
        if (this.props.scrollTainer && this.props.highlightedTag && this.props.highlightedTag !== prevProps.highlightedTag) {
            const cellId = this.findFirstTaggedCellId(this.props.highlightedTag);
            if (cellId)
                scrollIntoViewIfNeeded(cellId, this.props.scrollTainer);
        }
    }

    render() {
        if (this.props.model.columns.length === 0)
            return <div></div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {this.renderDownloadBar()}
                <table className={`rdo-data-table ${this.props.style === 'wide' ? 'rdo-data-table-wide' : ''}`}>
                    <thead>
                        <tr>{this.renderHeader()}</tr>
                    </thead>
                    <tbody>
                        {this.renderBody()}
                    </tbody>
                </table>
            </div>
        );
    }
}

export namespace DynamicTable {
    export type Cell<T extends string|number> = { data: T, tag?: string, elem?: JSX.Element, tooltip?: React.ReactNode };
    export type Column<T extends string|number> = {
        name: string;
        cells: Cell<T>[];
        alignment?: 'left'|'center'|'right';
        comparator?: (a: T, b: T) => number;
        cellStyle?: (v: T) => React.CSSProperties;
        notSortable?: boolean;                 // Do not allow to sort by this column
        noData?: boolean;                      // This is only a utility column with no actual data
        tooltip?: React.ReactNode;             // Optional tooltip to display when a column header is hovered
        elem?: JSX.Element|React.ReactElement; // Optional element to show as column header.
    }
    export type Style = 'normal' | 'wide';

    export type SortOrder = 'asc' | 'desc';
    export class Model {
        sortedBy = -1;
        sortOrder: SortOrder = 'asc';

        constructor(readonly columns: Column<any>[] = []) {
        }

        get columnNames() {
            return this.columns.map(col => col.name);
        }

        get rows() {
            const rows = new Array<DynamicTable.Cell<any>[]>();

            for (let idx = 0; idx < this.columns[0].cells.length; idx++) {
                const row = new Array<DynamicTable.Cell<any>>();
                for (const col of this.columns)
                    row.push(col.cells[idx]);
                rows.push(row);
            }

            if (this.sortedBy === -1 || rows.length === 0)
                return rows;
            else {
                const sortIdx = this.sortedBy;
                const order = this.sortOrder;
                const mainColumn = this.columns[sortIdx];
                const comparator = mainColumn.comparator
                    ? mainColumn.comparator
                    : typeof mainColumn.cells[0].data === 'number'
                        ? (a: number, b: number) => a - b
                        : (a: string, b: string) => a.localeCompare(b);

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

    export type Downloader = {
        caption: string;
        download: (model: Model) => void;
    }
    export interface Props {
        model: Model;
        onCellClicked?: (row: number, column: string, value: string) => void;
        highlightedTag?: string;
        scrollTainer?: string|HTMLElement; // This needs to be se to a reasonable element to make autoscrolling work reliably
        style?: Style;
        downloaders?: Downloader[];
    }
}
