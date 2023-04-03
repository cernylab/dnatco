import * as React from 'react';
import { Icon } from './icon';
import { Tooltip } from './tooltip';
import { scrollIntoViewIfNeeded } from '../util';
import { GlobalConfig } from '../../global-config';
import { Downloader as _Downloader } from '../../util/downloader';
import 'assets/imgs/data-transfer-download.svg';
import 'assets/imgs/sort.svg';
import 'assets/imgs/sorted-ascending.svg';
import 'assets/imgs/sorted-descending.svg';

interface Comparator<T> {
    (a: T, b: T): number;
}

function cellShouldUpdate(oldCell: DynamicTable.Cell<any>, newCell: DynamicTable.Cell<any>) {
    const data = oldCell.data !== newCell.data;
    const elem = oldCell.elem !== newCell.elem;
    const tag = oldCell.tag !== newCell.tag;
    const tooltip = oldCell.tooltip !== newCell.tooltip;

    return data || elem || tag || tooltip;
}

function getCellStyle<T>(v: T, getter?: (v: T) => React.CSSProperties) {
    return getter ? getter(v) : {};
}

class DynamicTableCell extends React.Component<{
    item: DynamicTable.Cell<any>,
    col: DynamicTable.Column<any>,
    model: DynamicTable.Model,
    rowIdx: number,
    colIdx: number,
    highlightedTag?: string,
    onCellClicked?: (data: DynamicTable.Cell<any>, row: DynamicTable.Cell<any>[], colName: string) => void,
}>  {
    shouldComponentUpdate(nextProps: Readonly<{item: DynamicTable.Cell<any>; col: DynamicTable.Column<any>; model: DynamicTable.Model; rowIdx: number; colIdx: number; highlightedTag?: string | undefined; onCellClicked?: ((data: DynamicTable.Cell<any>, row: DynamicTable.Cell<any>[], colName: string) => void) | undefined;}>): boolean {
        if (this.props.highlightedTag !== nextProps.highlightedTag && this.props.highlightedTag === this.props.item.tag || nextProps.highlightedTag === this.props.item.tag)
            return true;

        return cellShouldUpdate(this.props.item, nextProps.item);
    }

    render() {
        return (
            <td
                className={`rdo-data-table ${(this.props.highlightedTag && this.props.highlightedTag === this.props.item.tag) ? 'rdo-data-table-selected' : ''}`}
                id={this.props.item.tag ? `${this.props.item.tag}-${this.props.rowIdx}-${this.props.colIdx}` : undefined}
                style={{
                    ...getCellStyle(this.props.item.data, this.props.col.cellStyle),
                    textAlign: this.props.model.columns[this.props.colIdx].alignment ?? 'left',
                }}
                onClick={() => {
                    if (this.props.onCellClicked)
                        this.props.onCellClicked(this.props.item.data, this.props.model.rows[this.props.rowIdx], this.props.col.name);
                }}
            >
                {this.props.item.tooltip
                    ? this.props.item.tooltip
                    : this.props.item.elem
                        ? this.props.item.elem
                        : this.props.item.data
                }
            </td>
        )
    }
}

class DynamicTableRow extends React.Component<{
    model: DynamicTable.Model,
    rowIdx: number,
    highlightedTag?: string,
    children: React.ReactNode[]
}> {
    shouldComponentUpdate(nextProps: Readonly<{model: DynamicTable.Model; rowIdx: number; highlightedTag?: string; children: React.ReactNode[];}>): boolean {
        const oldModel = this.props.model;
        const newModel = nextProps.model;

        if (oldModel.columns.length !== newModel.columns.length || this.props.highlightedTag !== nextProps.highlightedTag)
            return true;

        for (let colIdx = 0; colIdx < oldModel.columns.length; colIdx++) {
            const oldCell = oldModel.columns[colIdx].cells[this.props.rowIdx];
            const newCell = newModel.columns[colIdx].cells[this.props.rowIdx];

            if (cellShouldUpdate(oldCell, newCell))
                return true;
        }

        return false;
    }

    render() {
        return <tr>{...this.props.children}</tr>
    }
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
                <DynamicTableRow
                    model={this.props.model}
                    rowIdx={rowIdx}
                    highlightedTag={this.props.highlightedTag}
                    key={rowIdx}
                >
                    {
                        row.map((item, colIdx) => {
                            const col = this.props.model.columns[colIdx];
                            return (
                                <DynamicTableCell
                                    item={item}
                                    col={col}
                                    model={this.props.model}
                                    rowIdx={rowIdx}
                                    colIdx={colIdx}
                                    highlightedTag={this.props.highlightedTag}
                                    onCellClicked={this.props.onCellClicked}
                                />
                            );
                        })
                    }
                </DynamicTableRow>
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
        if (!this.props.download)
            return void 0;

        const prefix = GlobalConfig.data().pathPrefix;
        const buttons = new Array<JSX.Element>();
        const fileName = this.props.download.fileName;

        this.props.download.downloaders.forEach((dl, idx) => {
            buttons.push(
                <div
                    key={idx}
                    className='rdo-dynamic-table-download-button'
                    onClick={e => {
                        e.stopPropagation();
                        dl.download(fileName, this.props.model);
                    }}
                >
                    <Icon img={`${prefix}/imgs/data-transfer-download.svg`} size='text' />
                    {dl.caption}
                </div>
            );
        });

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

    export type Downloader = _Downloader<Model>;
    export interface Props {
        model: Model;
        onCellClicked?: (data: any, row: Cell<any>[], columnName: string) => void;
        highlightedTag?: string;
        scrollTainer?: string|HTMLElement; // This needs to be se to a reasonable element to make autoscrolling work reliably
        style?: Style;
        download?: {
            downloaders: Downloader[];
            fileName: string;
        };
    }
}
